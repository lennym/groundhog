'use strict';

var test = require('tap').test;
var nixt = require('nixt');

var sampleDir = __dirname + '/../sample';

test('install all node modules', function (t) {
    nixt({
        colors: false
    })
    .cwd(sampleDir)
    .run('npm install')
    .expect(function (response) {
        t.equal(response.err, null);
        t.equal(response.code, 0);
    })
    .end(function () { t.end(); });
});

test('remove possible garbage in test/recordings', function (t) {
    nixt({
        colors: false
    })
    .cwd(sampleDir)
    .run('rm test/recordings/*')
    .expect(function () {
        t.ok(true);
    })
    .end(function () { t.end(); });
});

test('run the tests with the proxy on', function (t) {
    nixt({
        colors: false
    })
    .cwd(sampleDir)
    .run('./test/run')
    .expect(function (response) {
        t.equal(response.err, null);
        t.equal(response.code, 0);
        t.isSimilar(response.stderr, /was served directly from proxy/);
    })
    .end(function () { t.end(); });
});

test('record the interaction', function (t) {
    nixt({
        colors: false
    })
    .cwd(sampleDir)
    .run('./test/run --record')
    .expect(function (response) {
        t.equal(response.err, null);
        t.equal(response.code, 0);
        t.ok(/groundhog:recorder/.test(response.stderr));
    })
    .end(function () { t.end(); });
});

test('run the tests with available recordings', function (t) {
    nixt({
        colors: false
    })
    .cwd(sampleDir)
    .run('./test/run')
    .expect(function (response) {
        t.equal(response.err, null);
        t.equal(response.code, 0);
        t.isNotSimilar(response.stderr, /was served directly from proxy/);
    })
    .end(function () { t.end(); });
});
