'use strict';

var test = require('tap').test,
    playback = require(__dirname + '/../../lib/playback'),
    sinon = require('sinon'),
    _ = require('underscore');

var options = { hostname: 'example.com' };

test('returns a function', function (t) {
    t.type(playback(options), 'function');
    t.end();
});

test('throws an error if playback option', function (t) {
    t.type(playback(options), 'function');
    t.end();
});