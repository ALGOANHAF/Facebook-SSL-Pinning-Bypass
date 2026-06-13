/**
 * ssl_bypass_all.js
 *
 * Educational Frida script — comprehensive SSL pinning bypass.
 * Combines hooks from ssl_bypass_basic.js and ssl_bypass_okhttp.js and adds
 * Android Network Security Config hooking.
 *
 * This is the recommended starting script for your lab sessions.
 *
 * Run: frida -U -f com.facebook.katana -l ssl_bypass_all.js --no-pause
 *
 * FOR EDUCATIONAL PURPOSES ONLY.
 * Use only on applications and devices you own or have written permission to test.
 */

'use strict';

// ============================================================================
// Utility: safe hook wrapper — logs errors without crashing the script
// ============================================================================
function safeHook(label, fn) {
    try {
        fn();
        console.log('[+] Hooked: ' + label);
    } catch (e) {
        console.log('[-] Could not hook ' + label + ': ' + e.message);
    }
}

// ============================================================================
// Utility: hook all overloads of a method at once
// ============================================================================
function hookAllOverloads(cls, methodName, replacementFn) {
    if (!cls[methodName] || !cls[methodName].overloads) {
        console.log('[~] No overloads found for: ' + methodName);
        return;
    }
    cls[methodName].overloads.forEach(function (overload) {
        overload.implementation = function () {
            return replacementFn.apply(this, arguments);
        };
    });
}

// ============================================================================
// Main bypass logic — runs inside the app's Java runtime
// ============================================================================
Java.perform(function () {
    console.log('\n[*] ===== SSL Pinning Bypass Starting =====\n');

    // --------------------------------------------------------------------------
    // SECTION 1: Standard Java SSL (javax.net.ssl)
    // --------------------------------------------------------------------------

    safeHook('SSLContext.init()', function () {
        var SSLContext = Java.use('javax.net.ssl.SSLContext');

        // Create our permissive TrustManager once
        var PermissiveTM = Java.registerClass({
            name: 'com.ssllab.AllowAllTrustManager',
            implements: [Java.use('javax.net.ssl.X509TrustManager')],
            methods: {
                getAcceptedIssuers: function () {
                    return Java.use('[Ljava.security.cert.X509Certificate;').$new(0);
                },
                checkClientTrusted: function (chain, authType) {},
                checkServerTrusted: function (chain, authType) {
                    console.log('    [bypass] checkServerTrusted — accepting without pin check');
                }
            }
        });

        SSLContext.init.overload(
            '[Ljavax.net.ssl.KeyManager;',
            '[Ljavax.net.ssl.TrustManager;',
            'java.security.SecureRandom'
        ).implementation = function (km, tm, sr) {
            console.log('[bypass] SSLContext.init() — injecting permissive TrustManager');
            this.init(km, [PermissiveTM.$new()], sr);
        };
    });

    safeHook('HttpsURLConnection.setDefaultHostnameVerifier()', function () {
        var HttpsURLConnection = Java.use('javax.net.ssl.HttpsURLConnection');
        var PermissiveHV = Java.registerClass({
            name: 'com.ssllab.AllowAllHostnameVerifier',
            implements: [Java.use('javax.net.ssl.HostnameVerifier')],
            methods: {
                verify: function (hostname, session) { return true; }
            }
        });
        HttpsURLConnection.setDefaultHostnameVerifier.implementation = function (hv) {
            this.setDefaultHostnameVerifier(PermissiveHV.$new());
        };
    });

    // --------------------------------------------------------------------------
    // SECTION 2: OkHttp3 (primary Facebook HTTP client)
    // --------------------------------------------------------------------------

    safeHook('okhttp3.CertificatePinner.check() [List overload]', function () {
        var CP = Java.use('okhttp3.CertificatePinner');
        CP.check.overload('java.lang.String', 'java.util.List').implementation =
            function (hostname, peerCerts) {
                console.log('[bypass] OkHttp3 CertificatePinner.check() for: ' + hostname);
            };
    });

    safeHook('okhttp3.CertificatePinner.check() [Certificate[] overload]', function () {
        var CP = Java.use('okhttp3.CertificatePinner');
        CP.check.overload('java.lang.String', '[Ljava.security.cert.Certificate;').implementation =
            function (hostname, certs) {
                console.log('[bypass] OkHttp3 CertificatePinner.check(cert[]) for: ' + hostname);
            };
    });

    // --------------------------------------------------------------------------
    // SECTION 3: OkHttp2 / Square OkHttp (legacy namespace)
    // --------------------------------------------------------------------------

    safeHook('com.squareup.okhttp.CertificatePinner.check()', function () {
        var CP = Java.use('com.squareup.okhttp.CertificatePinner');
        hookAllOverloads(CP, 'check', function (hostname) {
            console.log('[bypass] OkHttp2 CertificatePinner.check() for: ' + hostname);
        });
    });

    // --------------------------------------------------------------------------
    // SECTION 4: Android Network Security Config
    // Pins declared in network_security_config.xml are enforced here.
    // --------------------------------------------------------------------------

    safeHook('NetworkSecurityTrustManager.checkPins()', function () {
        var NSTM = Java.use(
            'android.security.net.config.NetworkSecurityTrustManager'
        );
        NSTM.checkPins.implementation = function (chain) {
            console.log('[bypass] NetworkSecurityTrustManager.checkPins() — skipping');
        };
    });

    safeHook('NetworkSecurityTrustManager.checkServerTrusted()', function () {
        var NSTM = Java.use(
            'android.security.net.config.NetworkSecurityTrustManager'
        );
        NSTM.checkServerTrusted.overload(
            '[Ljava.security.cert.X509Certificate;',
            'java.lang.String'
        ).implementation = function (chain, authType) {
            console.log('[bypass] NetworkSecurityTrustManager.checkServerTrusted() — skipping');
        };
    });

    // --------------------------------------------------------------------------
    // SECTION 5: Conscrypt (Android's SSL provider)
    // --------------------------------------------------------------------------

    safeHook('Conscrypt TrustManagerImpl.checkTrustedRecursive()', function () {
        var TMI = Java.use('com.android.org.conscrypt.TrustManagerImpl');
        TMI.checkTrustedRecursive.implementation = function () {
            console.log('[bypass] Conscrypt checkTrustedRecursive() — returning null (no error)');
            return null;
        };
    });

    // --------------------------------------------------------------------------
    // SECTION 6: Dynamic TrustManager discovery
    //
    // Facebook may use anonymous inner classes for TrustManager.
    // We enumerate all loaded classes at startup and hook any that implement
    // X509TrustManager and have a checkServerTrusted method.
    // --------------------------------------------------------------------------

    safeHook('Dynamic TrustManager discovery', function () {
        Java.enumerateLoadedClasses({
            onMatch: function (name) {
                // Look for app-defined TrustManagers (not system ones)
                if (
                    name.indexOf('TrustManager') !== -1 &&
                    name.indexOf('android') === -1 &&
                    name.indexOf('com.android') === -1 &&
                    name.indexOf('java') === -1 &&
                    name.indexOf('javax') === -1 &&
                    name.indexOf('com.ssllab') === -1 // don't re-hook our own class
                ) {
                    try {
                        var cls = Java.use(name);
                        if (cls.checkServerTrusted) {
                            cls.checkServerTrusted.overloads.forEach(function (overload) {
                                overload.implementation = function () {
                                    console.log('[bypass] Dynamic TrustManager.checkServerTrusted() in: ' + name);
                                    // Do not call original
                                };
                            });
                            console.log('[+] Dynamically hooked TrustManager: ' + name);
                        }
                    } catch (e) {
                        // Class not hookable (abstract/interface) — skip
                    }
                }
            },
            onComplete: function () {
                console.log('[*] Dynamic TrustManager enumeration complete');
            }
        });
    });

    console.log('\n[*] ===== All SSL Bypass Hooks Active =====');
    console.log('[*] Configure your proxy and start the app.\n');
});
