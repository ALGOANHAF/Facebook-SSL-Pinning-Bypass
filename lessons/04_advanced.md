# Lesson 4 — Advanced Techniques

> **Educational use only.** Only test on devices and accounts you own.

This lesson moves from running scripts to writing your own and understanding the defences you meet.

---

## 4.1 The Hook Skeleton

Every Android Frida hook has the same shape. You resolve a class, then replace a method implementation.

```javascript
Java.perform(function () {
    var Target = Java.use('com.example.Target');
    Target.method.implementation = function (a, b) {
        return this.method(a, b);
    };
});
```

Return without calling the original to skip the method entirely, or call the original to observe while letting it proceed.

---

## 4.2 Finding What to Hook

Decompile the APK with jadx.

```bash
jadx -d out Facebook.apk
```

Search the decompiled source for pinning surfaces.

```bash
grep -rEn "CertificatePinner|checkServerTrusted|TrustManager|sha256/" out | head -20
```

Note the fully qualified class names, then hook them.

---

## 4.3 Hooking the Standard TrustManager

`checkServerTrusted` is the method that raises an exception on a bad chain. Enumerate loaded classes, find app-defined trust managers, and neutralise every overload.

```javascript
Java.perform(function () {
    Java.enumerateLoadedClasses({
        onMatch: function (name) {
            if (name.indexOf('TrustManager') === -1) return;
            try {
                var cls = Java.use(name);
                if (!cls.checkServerTrusted) return;
                cls.checkServerTrusted.overloads.forEach(function (o) {
                    o.implementation = function () {};
                });
            } catch (e) {}
        },
        onComplete: function () {}
    });
});
```

---

## 4.4 Hooking OkHttp CertificatePinner

`check` has more than one overload, so hook each signature you need.

```javascript
Java.perform(function () {
    var CP = Java.use('okhttp3.CertificatePinner');
    CP.check.overload('java.lang.String', 'java.util.List').implementation = function (host, certs) {};
    CP.check.overload('java.lang.String', '[Ljava.security.cert.Certificate;').implementation = function (host, certs) {};
});
```

When you do not know the signatures ahead of time, hook them all at once.

```javascript
Java.perform(function () {
    var CP = Java.use('okhttp3.CertificatePinner');
    CP.check.overloads.forEach(function (o) {
        o.implementation = function () {};
    });
});
```

---

## 4.5 Hooking the Network Security Config

On Android 7 and above, the OS enforces XML-declared pins. Hook the OS verifier.

```javascript
Java.perform(function () {
    var NSTM = Java.use('android.security.net.config.NetworkSecurityTrustManager');
    NSTM.checkPins.implementation = function (chain) {};
});
```

---

## 4.6 Bypassing Certificate Transparency

Some builds additionally require certificates to be logged in public CT logs. On recent Android that policy lives in Conscrypt.

```javascript
Java.perform(function () {
    try {
        var CT = Java.use('com.android.org.conscrypt.ct.CTPolicyImpl');
        CT.doesResultConformToPolicy.overloads.forEach(function (o) {
            o.implementation = function () { return true; };
        });
    } catch (e) {}
});
```

---

## 4.7 Understanding Anti-Frida Detection

Facebook ships integrity checks. Understanding them is essential research, not something to defeat for abuse.

**Memory map scanning.** The app reads its own `/proc/self/maps` looking for the Frida agent. You can observe the reads by hooking `open`.

```javascript
Interceptor.attach(Module.findExportByName('libc.so', 'open'), {
    onEnter: function (args) {
        var path = args[0].readUtf8String();
        if (path && path.indexOf('maps') !== -1) {
            send({ tag: 'detect', msg: path });
        }
    }
});
```

**Port scanning.** The Frida server listens on TCP 27042 by default. Move it to a non-standard port and connect over that port.

```bash
adb shell su -c "/data/local/tmp/frida-server -l 0.0.0.0:47000 &"
```

```bash
python run.py com.facebook.katana --script all --host 127.0.0.1:47000
```

**Play Integrity and SafetyNet.** On a real device, use Magisk with the DenyList enabled for the Facebook package so integrity attestation is not fed the tampered state.

---

## 4.8 Static Patching, In Concept

Static patching modifies the APK instead of the running process. The flow is:

Decompile to smali.

```bash
apktool d Facebook.apk -o fb_src
```

Locate the pinning smali.

```bash
grep -rn "CertificatePinner" fb_src/smali
```

Edit the target method so it returns immediately, then rebuild and sign with a throwaway key.

```bash
apktool b fb_src -o Facebook_patched.apk
keytool -genkey -v -keystore test.jks -alias test -keyalg RSA -keysize 2048 -validity 10000
apksigner sign --ks test.jks --out Facebook_signed.apk Facebook_patched.apk
adb install -r Facebook_signed.apk
```

For Facebook specifically this usually fails, because the app is obfuscated with R8, verifies its own signature at runtime, and reports a modified state to Play Integrity. Static patching remains a valid technique for apps you build yourself.

---

## 4.9 Logging Certificates Instead of Only Skipping

To study the pinning setup, log the presented chain while still bypassing the check.

```javascript
Java.perform(function () {
    var CP = Java.use('okhttp3.CertificatePinner');
    var X509 = Java.use('java.security.cert.X509Certificate');
    CP.check.overload('java.lang.String', 'java.util.List').implementation = function (host, certs) {
        var arr = certs.toArray();
        for (var i = 0; i < arr.length; i++) {
            var c = Java.cast(arr[i], X509);
            send({ tag: 'cert', msg: host + ' ' + c.getSubjectDN().toString() });
        }
    };
});
```

---

## Summary

You can now write hooks for every pinning layer, defeat certificate transparency, reason about anti-Frida defences, and understand where static patching fits.

Continue to [Lesson 5 — Ethics & Legal Boundaries](05_ethics.md).
