'use strict';

var test = require('tap').test,
    recorder = require(__dirname + '/../../lib/recorder'),
    sinon = require('sinon'),
    _ = require('underscore');

var options = { hostname: 'example.com', dir: './' };

test('returns a function', function (t) {
    t.type(recorder(options), 'function');
    t.end();
});

test('throws an error if record option is current', function (t) {
    t.plan(1);
    try {
        recorder(_.extend(options, { record: 'current' }));
        t.end();
    } catch(e) {
        t.equal(e.message, '"current" is not a valid recording name');
    }
});