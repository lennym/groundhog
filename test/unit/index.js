'use strict';

var test = require('tap').test,
    groundhog = require(__dirname + '/../../lib/index'),
    sinon = require('sinon'),
    connect = require('connect');

test('proxies', function (t) {

    test('returns an array of proxies', function (t) {
        var output = groundhog.proxies({ hostname: 'example.com', protocol: 'https', port: 3002 });
        t.ok(output instanceof Array);
        t.equal(output.length, 1);
        t.equal(output[0].hostname, 'example.com');
        t.equal(output[0].protocol, 'https');
        t.equal(output[0].port, 3002);
        t.end();
    });

    test('adds default port and protocol', function (t) {
        var output = groundhog.proxies({ hostname: 'example.com' });
        t.equal(output[0].hostname, 'example.com');
        t.equal(output[0].protocol, 'http');
        t.equal(output[0].port, 3001);
        t.end();
    });

    test('handles multiple proxies', function (t) {
        var output = groundhog.proxies({ proxies: [
            { hostname: 'example.com', port: 3001 },
            { hostname: 'example.net', port: 3002 }
        ]});
        t.equal(output.length, 2);
        t.equal(output[0].hostname, 'example.com');
        t.equal(output[0].protocol, 'http');
        t.equal(output[0].port, 3001);
        t.equal(output[1].hostname, 'example.net');
        t.equal(output[1].protocol, 'http');
        t.equal(output[1].port, 3002);
        t.end();
    });

    t.end();

});

test('listen', function (t) {

    var handler = function () { return function () {}; }

    test('passes handler to connect.use', function (t) {
        var use = sinon.spy(connect.proto, 'use'),
            listen = sinon.stub(connect.proto, 'listen'),
            handler = function () {};
        groundhog.listen(function () { return handler; }, { hostname: 'example.com' });
        t.ok(use.calledWith(handler));
        use.restore();
        listen.restore();
        t.end();
    });

    test('starts server on default port', function (t) {
        var listen = sinon.stub(connect.proto, 'listen');
        groundhog.listen(handler, { hostname: 'example.com' });
        t.ok(listen.calledWith(3001));
        listen.restore();
        t.end();
    });

    test('starts server on config port if provided', function (t) {
        var listen = sinon.stub(connect.proto, 'listen');
        groundhog.listen(handler, { hostname: 'example.com', port: 3002 });
        t.ok(listen.calledWith(3002));
        listen.restore();
        t.end();
    });

    t.end();

});