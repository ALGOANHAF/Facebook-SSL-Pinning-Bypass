'use strict';

function log(msg) {
    send({ tag: 'okhttp', msg: msg });
}

function safeHook(name, fn) {
    try {
        fn(Java.use(name));
    } catch (e) {
        log('skip ' + name + ' ' + e.message);
    }
}

Java.perform(function () {
    log('loaded');

    safeHook('okhttp3.CertificatePinner', function (CP) {
        CP.check.overload('java.lang.String', 'java.util.List').implementation = function (host, certs) {
            log('okhttp3 check ' + host);
        };
        try {
            CP.check.overload('java.lang.String', '[Ljava.security.cert.Certificate;').implementation = function (host, certs) {
                log('okhttp3 check(array) ' + host);
            };
        } catch (e) {}
    });

    safeHook('com.squareup.okhttp.CertificatePinner', function (CP) {
        CP.check.overload('java.lang.String', 'java.util.List').implementation = function (host, certs) {
            log('okhttp2 check ' + host);
        };
    });

    safeHook('com.android.org.conscrypt.TrustManagerImpl', function (TMI) {
        TMI.checkTrustedRecursive.implementation = function () {
            log('conscrypt checkTrustedRecursive bypassed');
            return Java.use('java.util.ArrayList').$new();
        };
    });

    log('active');
});
