'use strict';

var assert = require('assert');
var request = require('request');

var config = require('./config');
var host = config.host;

console.log('GET ' + host + '/css/index.css');

request(host + '/css/index.css', function (err) {
    assert.equal(err, null);
    console.log('ok');
    process.exit();
});
