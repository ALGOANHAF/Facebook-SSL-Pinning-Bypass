/**
 * ssl_bypass_okhttp.js
 *
 * Educational Frida script — targets OkHttp's CertificatePinner.
 * Facebook's Android app uses OkHttp as its HTTP client library.
 * OkHttp's CertificatePinner is the primary pinning mechanism.
 *
 * Run: frida -U -f <package> -l ssl_bypass_okhttp.js --no-pause
 *
 * FOR EDUCATIONAL PURPOSES ONLY.
 * Use only on applications and devices you own or have written permission to test.
 */

Java.perform(function () {
    console.log('[*] ssl_bypass_okhttp.js loaded');

    // -------------------------------------------------------------------------
    // Helper: safely hook a class, with error handling if it's not present.
    // This is important because OkHttp2 and OkHttp3 have different class paths,
    // and not all versions of the app ship with both.
    // -------------------------------------------------------------------------
    function safeHook(className, hookFn) {
        try {
            var cls = Java.use(className);
            hookFn(cls);
        } catch (e) {
            console.log('[-] Could not hook ' + className + ' (not present or different version): ' + e.message);
        }
    }

    // -------------------------------------------------------------------------
    // Hook 1: OkHttp3 CertificatePinner
    //
    // okhttp3.CertificatePinner.check() is called for every HTTPS connection.
    // It receives the hostname and the peer's certificate chain, then compares
    // the certificate's public key hash against pinned values.
    //
    // Bypassing: simply return from the function without calling original.
    // -------------------------------------------------------------------------
    safeHook('okhttp3.CertificatePinner', function (CertificatePinner) {
        // Overload 1: check(String hostname, List<Certificate> peerCertificates)
        CertificatePinner.check.overload(
            'java.lang.String',
            'java.util.List'
        ).implementation = function (hostname, peerCertificates) {
            console.log('[+] OkHttp3 CertificatePinner.check(List) bypassed for: ' + hostname);
            // Log the certificates for educational inspection
            var certs = peerCertificates.toArray();
            for (var i = 0; i < certs.length; i++) {
                try {
                    var x509 = Java.cast(certs[i], Java.use('java.security.cert.X509Certificate'));
                    console.log('    Certificate[' + i + ']: ' + x509.getSubjectDN().toString());
                } catch (e) { /* not an X509Certificate */ }
            }
            // Do NOT call original — pin check is skipped
        };

        // Overload 2: check(String hostname, Certificate[] certs) — used in some OkHttp3 versions
        try {
            CertificatePinner.check.overload(
                'java.lang.String',
                '[Ljava.security.cert.Certificate;'
            ).implementation = function (hostname, certs) {
                console.log('[+] OkHttp3 CertificatePinner.check(Certificate[]) bypassed for: ' + hostname);
            };
        } catch (e) {
            console.log('[~] Overload check(Certificate[]) not found — skipping');
        }

        console.log('[+] Hook 1 active: OkHttp3 CertificatePinner');
    });

    // -------------------------------------------------------------------------
    // Hook 2: OkHttp2 CertificatePinner (older OkHttp version)
    //
    // Some versions of Facebook ship an older OkHttp under a different package.
    // -------------------------------------------------------------------------
    safeHook('com.squareup.okhttp.CertificatePinner', function (CertificatePinner) {
        CertificatePinner.check.overload(
            'java.lang.String',
            'java.util.List'
        ).implementation = function (hostname, peerCertificates) {
            console.log('[+] OkHttp2 CertificatePinner.check() bypassed for: ' + hostname);
        };
        console.log('[+] Hook 2 active: OkHttp2 CertificatePinner');
    });

    // -------------------------------------------------------------------------
    // Hook 3: OkHttp3 internal RealConnection — handles TLS setup per connection.
    // This catches cases where pinning is performed inside the TLS handshake
    // helper rather than through CertificatePinner directly.
    // -------------------------------------------------------------------------
    safeHook('okhttp3.internal.connection.RealConnection', function (RealConnection) {
        // connectTls() sets up the TLS socket and runs certificate checks
        try {
            RealConnection.connectTls.implementation = function () {
                console.log('[+] RealConnection.connectTls() — calling original without pin enforcement');
                // Call original — the socket is established, but OkHttp's
                // CertificatePinner.check() which we already hooked above
                // will be a no-op when it's invoked internally.
                return this.connectTls.apply(this, arguments);
            };
            console.log('[+] Hook 3 active: RealConnection.connectTls()');
        } catch (e) {
            console.log('[~] RealConnection.connectTls not hookable: ' + e.message);
        }
    });

    // -------------------------------------------------------------------------
    // Hook 4: TrustManagerImpl (Conscrypt)
    //
    // Conscrypt is Android's SSL provider (used by OkHttp internally).
    // TrustManagerImpl.checkTrustedRecursive() is the deep validation call.
    // -------------------------------------------------------------------------
    safeHook('com.android.org.conscrypt.TrustManagerImpl', function (TrustManagerImpl) {
        try {
            TrustManagerImpl.checkTrustedRecursive.implementation = function () {
                console.log('[+] Conscrypt TrustManagerImpl.checkTrustedRecursive() bypassed');
                // Return null = no validation error
                return null;
            };
            console.log('[+] Hook 4 active: Conscrypt TrustManagerImpl');
        } catch (e) {
            console.log('[~] TrustManagerImpl.checkTrustedRecursive not hookable: ' + e.message);
        }
    });

    console.log('[*] ssl_bypass_okhttp.js — all hooks installed');
});
