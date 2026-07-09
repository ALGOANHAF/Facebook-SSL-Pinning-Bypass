# Lesson 2 — Core SSL/TLS Concepts

> **Educational use only.** Only test on devices and accounts you own.

Before touching a single hook, you need a clear mental model of what pinning is and why a plain proxy cannot defeat it.

---

## 2.1 The TLS Handshake in One Diagram

```
Client (App)                       Server
    |------ ClientHello ------------->|
    |<----- ServerHello + cert -------|
    |------ verify certificate ------>|
    |<===== encrypted channel =======>|
```

Everything hinges on the **verify certificate** step. That is where pinning lives.

---

## 2.2 Standard Certificate Validation

Without pinning, an app accepts any certificate signed by a Certificate Authority in the system trust store. Android ships with roughly 150 trusted CAs.

The weakness for an attacker, and the opportunity for a researcher, is that if you can add a CA to the device, you can mint certificates the app will accept. That is exactly what mitmproxy does: it installs its own CA and issues a fresh certificate for every host on the fly.

---

## 2.3 What Pinning Adds

Pinning adds a second question after the CA check passes:

> Is this the *specific* certificate or key I was built to expect?

**Certificate pinning** compares the full certificate byte for byte.

**Public key pinning** compares only the SHA-256 of the public key. This is more common because it survives certificate renewal as long as the key pair is unchanged.

When a proxy presents its own certificate, the CA check may pass, but the pin comparison fails:

```
Expected pin : sha256/AbCdEf...   (the app's built-in value)
Received     : sha256/XyZ123...   (the proxy's key)
Result       : mismatch, connection aborted
```

---

## 2.4 How Facebook Pins

Facebook's Android client (`com.facebook.katana`) enforces pinning at three layers.

**Layer 1 — OkHttp CertificatePinner.** Facebook's HTTP stack is built on OkHttp, whose `CertificatePinner` compares the server key against a hardcoded list and throws `SSLPeerUnverifiedException` on mismatch.

**Layer 2 — Custom TrustManager.** A custom `X509TrustManager` performs additional validation beyond the standard CA path.

**Layer 3 — Network Security Config.** On Android 7 and above, pins can be declared in `res/xml/network_security_config.xml` and enforced by the OS itself, independent of the app code.

Because there are three layers, a reliable bypass has to neutralise all of them. That is why the comprehensive script in this lab hooks each one.

---

## 2.5 Why Burp or mitmproxy Alone Fails

Trace what happens when you point the app at a proxy with its CA already trusted:

1. The app opens a TLS connection to a Facebook host.
2. The proxy presents its own certificate.
3. Standard CA validation passes, because the proxy CA is trusted.
4. OkHttp `CertificatePinner.check()` compares the key hash to its pinned values.
5. The hashes do not match, so it throws and the request dies.
6. The app shows a network error.

You can watch this happen in the device log.

```bash
adb logcat | grep -iE "ssl|certificate|pinning|okhttp"
```

---

## 2.6 Static vs Dynamic Bypass

**Static bypass** modifies the APK itself: decompile, patch the pinning code, recompile, re-sign. It is persistent but brittle, breaks on every app update, and re-signing can trip integrity checks.

**Dynamic bypass** injects Frida into the running process and replaces the pinning methods at runtime. It needs root and a running server, but it is fast, reversible, and shows you exactly which methods you are neutralising.

This lab uses dynamic bypass.

---

## 2.7 How Frida Injection Works

```
Your machine                 Android device
+-------------+              +------------------------+
| frida CLI   |              | frida-server (root)    |
| run.py      |==== USB ====>| ptrace into target     |
| .js hook    |              | +--------------------+  |
+-------------+              | | hooked Java methods |  |
                             | +--------------------+  |
                             +------------------------+
```

Frida uses `ptrace` to inject a small agent into the target process. Your JavaScript runs inside that process, so when the app calls `CertificatePinner.check()`, your replacement runs instead and decides whether to enforce the pin.

---

## Glossary

| Term | Meaning |
|------|---------|
| CA | Certificate Authority that signs certificates |
| SPKI | Subject Public Key Info, the key portion of a certificate |
| MITM | Man-in-the-middle interception |
| CertificatePinner | OkHttp class that enforces pinning |
| TrustManager | Android interface for certificate validation |
| Frida | Dynamic instrumentation framework |
| Objection | Frida toolkit with prebuilt hooks |

Continue to [Lesson 3 — Tool Walkthrough](03_walkthrough.md).
