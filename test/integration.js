'use strict';

var test = require('tap').test;
var nixt = require('nixt');
var fs = require('fs');

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
        t.isSimilar(response.stderr, /groundhog:recorder/);
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

test('record the interactions to a named file', function (t) {
    nixt({
        colors: false
    })
    .cwd(sampleDir)
    .run('./test/run --record testname')
    .expect(function (response) {
        t.ok(fs.existsSync(sampleDir + '/test/recordings/testname_www.yld.io.json'));
        t.equal(fs.readlinkSync(sampleDir + '/test/recordings/current_www.yld.io.json'), 'test/recordings/testname_www.yld.io.json');
        t.isSimilar(response.stderr, /recording to (.)*test\/recordings\/testname_www.yld.io.json/);
    })
    .end(function () { t.end(); });
});

test('playback the interactions from a named file', function (t) {
    nixt({
        colors: false
    })
    .cwd(sampleDir)
    .run('./test/run --record newrecording')
    .expect(function (response) {
        t.equal(fs.readlinkSync(sampleDir + '/test/recordings/current_www.yld.io.json'), 'test/recordings/newrecording_www.yld.io.json');
    })
    .end(function () {
        nixt({
            colors: false
        })
        .cwd(sampleDir)
        .run('./test/run --playback testname')
        .expect(function (response) {
            t.isSimilar(response.stderr, /opened (.)*test\/recordings\/testname_www.yld.io.json/);
        })
        .end(function () { t.end(); });
    });
});
