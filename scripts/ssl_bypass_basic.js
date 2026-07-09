'use strict';

function log(msg) {
    send({ tag: 'basic', msg: msg });
}

Java.perform(function () {
    log('loaded');

    var SSLContext = Java.use('javax.net.ssl.SSLContext');
    var X509TrustManager = Java.use('javax.net.ssl.X509TrustManager');
    var HostnameVerifier = Java.use('javax.net.ssl.HostnameVerifier');
    var HttpsURLConnection = Java.use('javax.net.ssl.HttpsURLConnection');
    var X509CertArray = Java.use('[Ljava.security.cert.X509Certificate;');

    var TrustManager = Java.registerClass({
        name: 'com.ssllab.TrustManager',
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
        name: 'com.ssllab.HostnameVerifier',
        implements: [HostnameVerifier],
        methods: {
            verify: function (hostname, session) {
                log('hostname accepted ' + hostname);
                return true;
            }
        }
    });

    SSLContext.init.overload(
        '[Ljavax.net.ssl.KeyManager;',
        '[Ljavax.net.ssl.TrustManager;',
        'java.security.SecureRandom'
    ).implementation = function (km, tm, sr) {
        log('SSLContext.init patched');
        this.init(km, [TrustManager.$new()], sr);
    };

    HttpsURLConnection.setDefaultHostnameVerifier.implementation = function (v) {
        log('setDefaultHostnameVerifier patched');
        this.setDefaultHostnameVerifier(Verifier.$new());
    };

    HttpsURLConnection.setSSLSocketFactory.implementation = function (factory) {
        log('setSSLSocketFactory patched');
        var ctx = SSLContext.getInstance('TLS');
        ctx.init(null, [TrustManager.$new()], null);
        this.setSSLSocketFactory(ctx.getSocketFactory());
    };

    log('active');
});
