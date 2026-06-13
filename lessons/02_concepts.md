# Lesson 2 — Core SSL/TLS Concepts

## 2.1 How HTTPS Works (Quick Refresher)

When your browser connects to `https://facebook.com`, the following happens:

```
Client (App)              Facebook Server
    |                           |
    |---- ClientHello --------->|  (supported cipher suites)
    |<--- ServerHello ----------|  (chosen cipher + certificate)
    |---- verifies cert ------->|  (is the cert trusted?)
    |<--- Encrypted channel --->|  (data flows here)
```

The "verify cert" step is where SSL pinning matters.

---

## 2.2 Normal Certificate Validation

Without pinning, the app trusts **any certificate signed by a Certificate Authority (CA)** in the system trust store. There are ~150 trusted CAs pre-installed on Android.

**Problem for security research:** If an attacker controls a CA (or installs their own CA on the device), they can perform a Man-in-the-Middle (MITM) attack and intercept the traffic.

**This is exactly what mitmproxy does in a lab** — it installs its own CA and issues fake certs for every host. Without pinning, the app happily accepts them.

---

## 2.3 What is SSL Pinning?

SSL pinning is an extra check: the app doesn't just ask "is this cert signed by *any* trusted CA?" — it also asks "is this cert *specifically* the one I expect?"

### Certificate Pinning
The app stores the **full DER-encoded certificate** and compares it byte-by-byte.

```
Stored pin:  SHA-256(facebook.com's cert) = "abc123..."
Received:    SHA-256(mitmproxy's fake cert) = "xyz789..."
Result:      MISMATCH → connection refused
```

### Public Key Pinning (more common, more flexible)
The app stores only the **public key hash** (SPKI hash). This survives certificate renewal as long as the key pair stays the same.

```
Stored pin:  SHA-256(facebook.com's public key) = "abc123..."
Received:    SHA-256(mitmproxy's fake public key) = "xyz789..."
Result:      MISMATCH → connection refused
```

---

## 2.4 How Facebook Implements Pinning

Facebook's Android app (`com.facebook.katana`) uses multiple pinning layers:

### Layer 1 — OkHttp CertificatePinner
Facebook uses the [OkHttp](https://square.github.io/okhttp/) HTTP library. OkHttp has a built-in `CertificatePinner` class:

```java
// Pseudocode — what Facebook's code looks like internally
CertificatePinner pinner = new CertificatePinner.Builder()
    .add("*.facebook.com", "sha256/AbCdEfGhIjKlMnOpQrStUvWxYz...")
    .add("*.facebook.com", "sha256/BaCkUpPiNhAsH...")   // backup pin
    .build();

OkHttpClient client = new OkHttpClient.Builder()
    .certificatePinner(pinner)
    .build();
```

When `CertificatePinner.check()` is called, it compares the server's cert to the pinned hashes. If none match, it throws `SSLPeerUnverifiedException`.

### Layer 2 — Custom X509TrustManager
Facebook also registers a custom `TrustManager` that performs additional validation beyond standard CA verification.

### Layer 3 — Network Security Config (Android 7+)
`res/xml/network_security_config.xml` can define pins at the OS level:

```xml
<network-security-config>
    <domain-config>
        <domain includeSubdomains="true">facebook.com</domain>
        <pin-set>
            <pin digest="SHA-256">AbCdEfGh...</pin>
        </pin-set>
    </domain-config>
</network-security-config>
```

---

## 2.5 Why Burp Fails Without a Bypass

Let's trace what happens when you point the Facebook app at Burp:

```
1. App starts TLS handshake with graph.facebook.com
2. Burp intercepts and presents its own certificate
3. Burp's cert is signed by "PortSwigger CA" (trusted by system store after install)
4. Android's standard validation: PASS  (it's a valid cert)
5. OkHttp CertificatePinner.check():
       Expected: sha256/AbCdEf... (Facebook's real key)
       Got:      sha256/XyZaBc... (Burp's key)
       → throws SSLPeerUnverifiedException
6. App crashes or shows "Network error"
```

You can confirm this by enabling verbose logging:

```bash
adb logcat | grep -i "ssl\|certificate\|pinning\|okhttp"
```

You'll see messages like:
```
Certificate pinning failure!
  Peer certificate chain: ...
  Pinned certificates for graph.facebook.com: ...
```

---

## 2.6 Static vs. Dynamic Pinning Bypass

### Static Bypass (Patch the APK)
Decompile the APK → find the pinning code → remove or patch it → recompile and sign.

- **Pros:** Persistent, doesn't require Frida at runtime.
- **Cons:** Complex, breaks with each app update, requires re-signing (may trigger integrity checks).

### Dynamic Bypass (Frida/Objection at runtime)
Inject a Frida script into the running process → hook the pinning methods → replace their logic.

- **Pros:** No APK modification needed, fast to iterate.
- **Cons:** Requires root, Frida server, and re-hooking after process restart.

**In this lab we use dynamic bypass** — it's faster and more educational because you can see exactly which Java methods are being hooked.

---

## 2.7 Frida Architecture (How Hooks Work)

```
Your Machine                   Android Device
┌─────────────────┐           ┌──────────────────────────┐
│  frida CLI      │           │  frida-server (root)     │
│  (Python venv)  │◄─ USB ───►│  ↕ ptrace / /proc/mem   │
│                 │           │  Target App Process       │
│  Your .js hook  │           │  ┌────────────────────┐  │
│  is uploaded    │──────────►│  │ Hooked Java methods │  │
└─────────────────┘           │  └────────────────────┘  │
                               └──────────────────────────┘
```

Frida uses `ptrace` (Linux system call) to inject a tiny shared library into the target process. That library executes your JavaScript hook inside the process's memory. When the app calls `CertificatePinner.check()`, your hook runs instead — and you decide whether to let it proceed or skip the check.

---

## Summary of Key Terms

| Term | Meaning |
|------|---------|
| **CA** | Certificate Authority — a trusted entity that signs certificates |
| **SPKI** | Subject Public Key Info — the public key portion of a cert |
| **MITM** | Man-in-the-Middle — intercepting traffic between two parties |
| **CertificatePinner** | OkHttp class that enforces pinning |
| **TrustManager** | Android interface for certificate validation logic |
| **Frida** | Dynamic instrumentation framework using JS hooks |
| **Objection** | Frida-based toolkit with pre-built mobile security hooks |

Proceed to [Lesson 3 — Tool Walkthrough](03_walkthrough.md).
