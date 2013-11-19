'use strict';

module.exports = function playback(options) {

    var proxy = require('./proxy'),
        debug = require('debug')('groundhog:playback'),
        warn = require('debug')('groundhog:playback:warning'),
        fs = require('fs'),
        path = require('path'),
        zlib = require('zlib'),
        _ = require('underscore');

    var fileForHost = function (name) {
        name = name || 'current';
        return path.join(options.dir, name + '_' + options.hostname +  '.json');
    };

    var keyForFixture = function (req) {
        var host = req.host || req.headers.host,
            path = req.path || req.url;

        return [
          req.method,
          host,
          path,
          new Buffer(req.body || '').toString('base64')
          ].join('_');
    };

    var allFiles = {};
    var testFixtures = {};
    var currentFilePath

    try {
        if (options.playback && options.playback !== 'current') {
            currentFilePath = fileForHost(options.playback);
        } else {
            currentFilePath = fs.readlinkSync(fileForHost());
        }
        allFiles[options.hostname] = JSON.parse(fs.readFileSync(
            currentFilePath, { encoding: 'utf8' }));
        debug('opened ' + currentFilePath);
    }
    catch (e) {
        debug('no files for ' + options.hostname);
        allFiles[options.hostname] = [];
    }

    debug('preparing all things. actually ' + allFiles[options.hostname].length + ' things.');
    _.each(allFiles[options.hostname], function (currentFixture) {
        var fKey = keyForFixture(currentFixture.request);
        testFixtures[fKey] = testFixtures[fKey] || [];
        testFixtures[fKey].push(currentFixture);
    });
    if (allFiles[options.hostname].length === 0) {
        debug('file is empty or does not exist. are you sure you configured ' + options.hostname + ' correctly?');
    }
    else {
        debug('searching in ' + Object.keys(testFixtures).join(', '));
    }

    return function handlePlayback(req, res) {

        req.headers.host = options.hostname;

        req.on('end', function () {
            var fixturesForReq = testFixtures[keyForFixture(req)];
            if (!(Array.isArray(fixturesForReq) && fixturesForReq.length > 0)) {
                if (!options.strict) {
                    warn('warning: ' + keyForFixture(req) + ' was served directly from proxy. Found: ' + fixturesForReq);
                    proxy(req, options.protocol, handleProxy);
                } else {
                    warn('strict mode refused playback of missing recording ' + keyForFixture(req));
                    error();
                }
                return;
            }

            var content = fixturesForReq.shift();
            var cResponse = content.response;

            debug('received request for ' + options.hostname + req.url);
            debug('responding with ' + content.uuid);

            res.statusCode = cResponse.status || 200;
            _.each(cResponse.headers, function (val, name) {
                res.setHeader(name, val);
            });

            if (cResponse.headers['content-encoding'] === 'gzip') {
                zlib.gzip(new Buffer(cResponse.body), function (err, contentFromCb) {
                    send(res, contentFromCb);
                });
            } else if (cResponse.headers['content-encoding'] === 'deflate') {
                zlib.deflate(new Buffer(cResponse.body), function (err, contentFromCb) {
                    send(res, contentFromCb);
                });
            } else {
                send(res, cResponse.body);
            }
        });

        function send(res, content) {
            res.setHeader('content-length', content.length);
            res.write(content);
            res.end();
        }

        function error() {
            res.statusCode = 500;
            res.end();
        }

        function handleProxy(err, response) {
            if (err) {
                error(err);
            } else {
                res.statusCode = response.statusCode;
                _.each(response.headers, function (val, name) {
                    res.setHeader(name, val);
                });
                response.on('data', function (chunk) {
                    res.write(chunk);
                });
                response.on('end', function () {
                    res.end();
                });
            }
        }

    };

};
