'use strict';

var connect = require('connect'),
    fs = require('fs'),
    argh = require('argh');

var record = argh.argv.record,
    options = {
        dir: argh.argv.dir,
        hostname: argh.argv.hostname,
        strict: argh.argv.strict
    };


if (argh.argv.help || argh.argv.h || !options.dir || !options.hostname) {
    usage();
}

if (record) {
    fs.mkdir(options.dir, function () {
        start();
    });
} else {
    start();
}

function start(err) {
    if (err) { throw err; }

    var handler;

    if (record) {
        handler = require('./lib/recorder');
    } else {
        handler = require('./lib/playback');
    }

    connect()
        .use(parseBody)
        .use(handler(options))
        .listen(argh.argv.port || 3001);
}

function usage() {
    console.log('Usage: node app.js --hostname <hostname> --dir <directory> [--port] [--record] [--strict]\n');
    console.log('--hostname      host to which to proxy requests');
    console.log('--dir           directory in which to read/write playback files');
    console.log('--record        record the current session');
    console.log('--port          port to run on (default: 3001)');
    console.log('--strict        only serve recordings in playback mode');
    process.exit();
}

function parseBody(req, res, next) {
    req.body = '';
    req.on('data', function (data) {
        req.body += data;
    });
    next();
}