/**
 * ssl_bypass_basic.js
 *
 * Educational Frida script — hooks Android's X509TrustManager to disable
 * certificate validation. This targets the standard Java SSL stack.
 *
 * Run: frida -U -f <package> -l ssl_bypass_basic.js --no-pause
 *
 * FOR EDUCATIONAL PURPOSES ONLY.
 * Use only on applications and devices you own or have written permission to test.
 */

Java.perform(function () {
    console.log('[*] ssl_bypass_basic.js loaded');

    // -------------------------------------------------------------------------
    // Hook 1: SSLContext.init()
    //
    // SSLContext is the entry point for setting up an SSL connection.
    // By injecting a permissive TrustManager here, we override whatever
    // TrustManager the app specified — including a custom one with pinning logic.
    // -------------------------------------------------------------------------
    var SSLContext = Java.use('javax.net.ssl.SSLContext');

    SSLContext.init.overload(
        '[Ljavax.net.ssl.KeyManager;',
        '[Ljavax.net.ssl.TrustManager;',
        'java.security.SecureRandom'
    ).implementation = function (keyManagers, trustManagers, secureRandom) {
        console.log('[+] SSLContext.init() called — replacing TrustManager');

        // Build a permissive TrustManager that accepts anything
        var PermissiveTrustManager = Java.registerClass({
            name: 'com.ssllab.PermissiveTrustManager',
            implements: [Java.use('javax.net.ssl.X509TrustManager')],
            methods: {
                // Return no accepted issuers (accepts all)
                getAcceptedIssuers: function () {
                    return Java.use('[Ljava.security.cert.X509Certificate;').$new(0);
                },
                // Do nothing = accept any client cert
                checkClientTrusted: function (chain, authType) {
                    console.log('[+] checkClientTrusted called — skipping');
                },
                // Do nothing = accept any server cert (bypasses pinning)
                checkServerTrusted: function (chain, authType) {
                    console.log('[+] checkServerTrusted called — bypassing pin check');
                }
            }
        });

        var permissiveTM = [PermissiveTrustManager.$new()];
        var TrustManagerArray = Java.use('[Ljavax.net.ssl.TrustManager;');

        // Call the original init() but with our permissive TrustManager
        this.init(keyManagers, permissiveTM, secureRandom);
    };

    console.log('[+] Hook 1 active: SSLContext.init()');

    // -------------------------------------------------------------------------
    // Hook 2: HttpsURLConnection.setDefaultHostnameVerifier()
    //
    // This verifier checks that the hostname in the certificate matches the
    // hostname being connected to. We replace it with one that always returns true.
    // -------------------------------------------------------------------------
    var HttpsURLConnection = Java.use('javax.net.ssl.HttpsURLConnection');

    HttpsURLConnection.setDefaultHostnameVerifier.implementation = function (verifier) {
        console.log('[+] setDefaultHostnameVerifier() called — replacing with permissive verifier');

        var PermissiveVerifier = Java.registerClass({
            name: 'com.ssllab.PermissiveHostnameVerifier',
            implements: [Java.use('javax.net.ssl.HostnameVerifier')],
            methods: {
                verify: function (hostname, session) {
                    console.log('[+] HostnameVerifier.verify() for: ' + hostname + ' — returning true');
                    return true;
                }
            }
        });

        this.setDefaultHostnameVerifier(PermissiveVerifier.$new());
    };

    console.log('[+] Hook 2 active: HttpsURLConnection.setDefaultHostnameVerifier()');

    // -------------------------------------------------------------------------
    // Hook 3: HttpsURLConnection.setSSLSocketFactory()
    //
    // Some apps set a custom SSLSocketFactory on individual connections.
    // We replace it with one built from our permissive SSLContext.
    // -------------------------------------------------------------------------
    HttpsURLConnection.setSSLSocketFactory.implementation = function (factory) {
        console.log('[+] setSSLSocketFactory() called — replacing with permissive factory');

        var permissiveSSLContext = Java.use('javax.net.ssl.SSLContext')
            .getInstance('TLS');
        permissiveSSLContext.init(null, null, null);

        this.setSSLSocketFactory(permissiveSSLContext.getSocketFactory());
    };

    console.log('[+] Hook 3 active: HttpsURLConnection.setSSLSocketFactory()');
    console.log('[*] ssl_bypass_basic.js — all hooks installed');
});
