'use strict';

var http = require('http');
var request = require('request');

var config = require('./config');
var host = config.host;
var port = config.port;

http.createServer(function (req, res) {
    console.log(host + req.url);
    //
    // proxy request to emulate expected behavior
    // should be the same as groundhog since groundhog records
    // proxied stuff
    //
    req.pipe(request(host + req.url)).pipe(res);
}).listen(port, '127.0.0.1');

console.log('ready');

setTimeout(function () {
    console.log('bye bye');
    process.exit();
}, 500);
