# Lesson 4 — Advanced Techniques

> This lesson assumes you've completed Lessons 1–3 and are comfortable with basic Frida hooks.

---

## 4.1 Writing Frida Scripts from Scratch

Every Frida script for Android follows this skeleton:

```javascript
Java.perform(function () {
    // All Java class access must be inside Java.perform()

    var ClassName = Java.use('com.example.ClassName');

    ClassName.methodName.implementation = function (arg1, arg2) {
        // Your replacement logic
        console.log('[*] methodName called with: ' + arg1);
        // Optionally call the original:
        return this.methodName(arg1, arg2);
        // Or skip the original entirely (returning nothing / a fake value)
    };
});
```

### Finding What to Hook

1. **Decompile the APK** with `apktool` or `jadx`:
   ```bash
   jadx -d out/ Facebook.apk
   ```
2. Search for pinning-related strings:
   ```bash
   grep -r "CertificatePinner\|checkServerTrusted\|TrustManager\|pinning" out/
   ```
3. Note the fully-qualified class names, then hook them.

---

## 4.2 Hooking Different Pinning Implementations

### Implementation A — javax.net.ssl.X509TrustManager
Used by apps that create their own `SSLContext`.

```javascript
Java.perform(function () {
    var X509TrustManager = Java.use('javax.net.ssl.X509TrustManager');
    // Find the concrete implementation (may be an anonymous class)
    Java.enumerateLoadedClasses({
        onMatch: function (name) {
            if (name.indexOf('TrustManager') !== -1) {
                console.log('[*] Found TrustManager implementation: ' + name);
                try {
                    var TM = Java.use(name);
                    TM.checkServerTrusted.implementation = function (chain, authType) {
                        console.log('[+] checkServerTrusted bypassed for: ' + authType);
                        // Do not call original — skip the check
                    };
                } catch (e) {
                    // Not hookable (abstract/interface)
                }
            }
        },
        onComplete: function () {}
    });
});
```

### Implementation B — OkHttp3 CertificatePinner

```javascript
Java.perform(function () {
    var CertificatePinner = Java.use('okhttp3.CertificatePinner');
    CertificatePinner.check.overload('java.lang.String', 'java.util.List')
        .implementation = function (hostname, peerCertificates) {
            console.log('[+] OkHttp3 CertificatePinner.check() bypassed for: ' + hostname);
            // Return without calling original → no pin check
        };
    // Hook the single-arg variant too
    CertificatePinner.check.overload('java.lang.String', '[Ljava.security.cert.Certificate;')
        .implementation = function (hostname, certs) {
            console.log('[+] OkHttp3 CertificatePinner.check(cert[]) bypassed for: ' + hostname);
        };
});
```

### Implementation C — Android Network Security Config (API 24+)

The OS itself enforces pins declared in `network_security_config.xml`. Hook the underlying verifier:

```javascript
Java.perform(function () {
    var NetworkSecurityTrustManager = Java.use(
        'android.security.net.config.NetworkSecurityTrustManager'
    );
    NetworkSecurityTrustManager.checkPins.implementation = function (chain) {
        console.log('[+] NetworkSecurityTrustManager.checkPins() bypassed');
        // Skip pin check
    };
});
```

---

## 4.3 Handling Method Overloads

Java supports method overloading (same name, different parameters). Frida requires you to specify the signature:

```javascript
// If there are multiple overloads, Frida raises an error unless you pick one:
SomeClass.methodName.overload('java.lang.String', 'java.util.List').implementation = ...
SomeClass.methodName.overload('java.lang.String', '[Ljava.security.cert.Certificate;').implementation = ...

// Hook ALL overloads at once:
SomeClass.methodName.overloads.forEach(function (overload) {
    overload.implementation = function () {
        console.log('[+] Hooked overload: ' + overload.argumentTypes.join(', '));
        // Skip original
    };
});
```

---

## 4.4 Certificate Transparency (CT) Bypass

Certificate Transparency requires that certificates be logged to public CT servers. Some apps check CT compliance in addition to pinning.

Android (API 24+) enforces CT via `CTPolicy`. To hook it:

```javascript
Java.perform(function () {
    try {
        var CTPolicy = Java.use('com.android.org.conscrypt.ct.CTPolicy');
        CTPolicy.doesResultConformToPolicy.implementation = function (result, host) {
            console.log('[+] CT policy check bypassed for: ' + host);
            return true; // pretend CT is satisfied
        };
    } catch (e) {
        console.log('[-] CTPolicy not found (Android version may not use it): ' + e);
    }
});
```

---

## 4.5 Anti-Frida Detection and How to Understand It

Facebook's app includes integrity checks. Understanding them (without defeating them for malicious purposes) is essential for security research.

### Detection Method 1 — /proc/self/maps scanning
Apps scan their own memory map for Frida's library (`frida-agent`).

**Research approach:** Hook the file-open call to observe what the app reads:
```javascript
Interceptor.attach(Module.findExportByName('libc.so', 'open'), {
    onEnter: function (args) {
        var path = args[0].readUtf8String();
        if (path && path.indexOf('maps') !== -1) {
            console.log('[*] App reading: ' + path);
        }
    }
});
```

### Detection Method 2 — Port scanning
Frida listens on TCP port 27042 by default. Apps may scan localhost for this port.

**Mitigation:** Start frida-server with a non-standard port:
```bash
adb shell su -c "/data/local/tmp/frida-server -l 0.0.0.0:17042 &"
# Client:
frida -U -H 127.0.0.1:17042 -f com.facebook.katana -l scripts/ssl_bypass_all.js
```

### Detection Method 3 — D-Bus / named pipe checks
Frida creates specific named pipes. Hook `openat` to see what the app checks.

### Detection Method 4 — SafetyNet / Play Integrity API
Facebook may query Google's SafetyNet to verify device integrity. In emulators, this usually fails. Use a real rooted device with Magisk and the DenyList module enabled for the Facebook app to pass these checks.

---

## 4.6 Recompiling Facebook with Patched Pinning (Concept)

Static patching means modifying the APK itself. Here's the conceptual flow:

```
1. Decompile APK:
   apktool d Facebook.apk -o fb_decompiled

2. Find the smali (Dalvik bytecode) for CertificatePinner or TrustManager.
   grep -r "CertificatePinner" fb_decompiled/smali/

3. Edit the smali to make checkServerTrusted always return:
   # Original: runs validation logic
   # Patched:  adds "return-void" at the top of the method

4. Recompile:
   apktool b fb_decompiled -o Facebook_patched.apk

5. Sign with a test key:
   keytool -genkey -v -keystore test.jks -alias test -keyalg RSA -keysize 2048 -validity 10000
   apksigner sign --ks test.jks --out Facebook_signed.apk Facebook_patched.apk

6. Install:
   adb install -r Facebook_signed.apk
```

**Why this usually fails for Facebook specifically:**
- Facebook uses ProGuard/R8 obfuscation — class/method names are randomized.
- Facebook's app verifies its own APK signature at runtime; a re-signed APK triggers this check.
- The Play Integrity API reports a modified app.

For genuine security research on apps you write, static patching is a valid testing technique.

---

## 4.7 Inspecting Obfuscated Code with jadx

Even with obfuscation, jadx provides decompiled Java source:

```bash
jadx -d out/ --show-bad-code --deobf Facebook.apk
```

Search for patterns even when class names are obfuscated:
```bash
# Find all calls to sha256/ (pin hashes) in the decompiled source
grep -r 'sha256/' out/ | head -20

# Find classes implementing X509TrustManager
grep -r 'X509TrustManager' out/ | grep 'implements'
```

Use jadx's GUI for easier navigation:
```bash
jadx-gui Facebook.apk
```

---

## 4.8 Logging Certificates for Analysis

Instead of simply bypassing pinning, you can log what certificates the app is actually receiving — useful for understanding the pinning setup:

```javascript
Java.perform(function () {
    var CertificatePinner = Java.use('okhttp3.CertificatePinner');
    CertificatePinner.check.overload('java.lang.String', 'java.util.List')
        .implementation = function (hostname, peerCertificates) {
            console.log('\n[CERT] Hostname: ' + hostname);
            var certs = peerCertificates.toArray();
            for (var i = 0; i < certs.length; i++) {
                var cert = Java.cast(certs[i], Java.use('java.security.cert.X509Certificate'));
                console.log('[CERT]   Subject: ' + cert.getSubjectDN());
                console.log('[CERT]   Issuer:  ' + cert.getIssuerDN());
            }
            // Still bypass the pin check:
        };
});
```

---

## Summary

You now understand:
- How to write Frida hooks targeting specific Java classes.
- How to handle multiple pinning layers and method overloads.
- Certificate Transparency checks.
- Anti-Frida detection mechanisms (from a defensive research perspective).
- The conceptual flow for static APK patching.

Proceed to [Lesson 5 — Ethics & Legal Boundaries](05_ethics.md).
