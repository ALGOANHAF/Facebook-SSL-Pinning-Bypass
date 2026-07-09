'use strict';

function log(msg) {
    send({ tag: 'bypass', msg: msg });
}

function safeHook(name, fn) {
    try {
        fn();
        log('hooked ' + name);
    } catch (e) {
        log('skip ' + name + ' ' + e.message);
    }
}

Java.perform(function () {
    log('starting');

    var SSLContext = Java.use('javax.net.ssl.SSLContext');
    var X509TrustManager = Java.use('javax.net.ssl.X509TrustManager');
    var HostnameVerifier = Java.use('javax.net.ssl.HostnameVerifier');
    var HttpsURLConnection = Java.use('javax.net.ssl.HttpsURLConnection');
    var X509CertArray = Java.use('[Ljava.security.cert.X509Certificate;');
    var ArrayList = Java.use('java.util.ArrayList');

    var TrustManager = Java.registerClass({
        name: 'com.ssllab.AllowAllTrustManager',
        implements: [X509TrustManager],
        methods: {
            getAcceptedIssuers: function () {
                return X509CertArray.$new(0);
            },
            checkClientTrusted: function (chain, authType) {},
            checkServerTrusted: function (chain, authType) {
                log('checkServerTrusted bypassed');
            }
        }
    });

    var Verifier = Java.registerClass({
        name: 'com.ssllab.AllowAllHostnameVerifier',
        implements: [HostnameVerifier],
        methods: {
            verify: function (hostname, session) {
                return true;
            }
        }
    });

    safeHook('SSLContext.init', function () {
        SSLContext.init.overload(
            '[Ljavax.net.ssl.KeyManager;',
            '[Ljavax.net.ssl.TrustManager;',
            'java.security.SecureRandom'
        ).implementation = function (km, tm, sr) {
            this.init(km, [TrustManager.$new()], sr);
        };
    });

    safeHook('HttpsURLConnection.setDefaultHostnameVerifier', function () {
        HttpsURLConnection.setDefaultHostnameVerifier.implementation = function (v) {
            this.setDefaultHostnameVerifier(Verifier.$new());
        };
    });

    safeHook('okhttp3.CertificatePinner', function () {
        var CP = Java.use('okhttp3.CertificatePinner');
        CP.check.overload('java.lang.String', 'java.util.List').implementation = function (host, certs) {
            log('okhttp3 ' + host);
        };
        try {
            CP.check.overload('java.lang.String', '[Ljava.security.cert.Certificate;').implementation = function (host, certs) {
                log('okhttp3 array ' + host);
            };
        } catch (e) {}
    });

    safeHook('com.squareup.okhttp.CertificatePinner', function () {
        var CP = Java.use('com.squareup.okhttp.CertificatePinner');
        CP.check.overloads.forEach(function (o) {
            o.implementation = function () {
                log('okhttp2 check');
            };
        });
    });

    safeHook('NetworkSecurityTrustManager', function () {
        var NSTM = Java.use('android.security.net.config.NetworkSecurityTrustManager');
        NSTM.checkPins.implementation = function (chain) {
            log('checkPins bypassed');
        };
    });

    safeHook('Conscrypt TrustManagerImpl', function () {
        var TMI = Java.use('com.android.org.conscrypt.TrustManagerImpl');
        TMI.checkTrustedRecursive.implementation = function () {
            log('checkTrustedRecursive bypassed');
            return ArrayList.$new();
        };
    });

    safeHook('dynamic TrustManager discovery', function () {
        Java.enumerateLoadedClasses({
            onMatch: function (name) {
                if (name.indexOf('TrustManager') === -1) return;
                if (/^(android|com\.android|java|javax|com\.ssllab)/.test(name)) return;
                try {
                    var cls = Java.use(name);
                    if (!cls.checkServerTrusted) return;
                    cls.checkServerTrusted.overloads.forEach(function (o) {
                        o.implementation = function () {
                            log('dynamic ' + name);
                        };
                    });
                } catch (e) {}
            },
            onComplete: function () {}
        });
    });

    log('active');
});
