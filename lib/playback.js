'use strict';

module.exports = function (options) {

    var proxy = require('./proxy'),
        debug = require('debug')('groundhog:playback'),
        warn = require('debug')('groundhog:playback:warning'),
        fs = require('fs'),
        path = require('path'),
        crypto = require('crypto'),
        zlib = require('zlib'),
        _ = require('underscore');

    var fileForHost = function (hostname) {
        return path.join(options.dir, 'current_' + options.hostname +  '.json');
    }

    var keyForFixture = function (req) {
        var host = req.host || req.headers.host,
            path = req.path || req.url;

        if (req.method.match(/POST|PUT/) && req.body) {
            var hash = crypto.createHash('md5');
            hash.update(req.body);
            path += ('__' + hash.digest('base64'));
        }

        return  req.method + '_' + (host + path);
    }

    var allFiles = {};
    var testFixtures = {};

    return function (req, res) {

        debug('received request for ' + options.hostname + req.url);
        req.headers.host = options.hostname;

        var err;

        try {
            if(!allFiles[options.hostname]) {
                allFiles[options.hostname] = JSON.parse(fs.readFileSync(
                    fileForHost(options.hostname), { encoding: 'utf8' }));
                debug('preparing all things. actually ' + allFiles[options.hostname].length + ' things.');
                _.each(allFiles[options.hostname], function (currentFixture) {
                    var fKey = keyForFixture(currentFixture.request);
                    testFixtures[fKey] = testFixtures[fKey] || [];
                    testFixtures[fKey].push(currentFixture);
                });
                debug('Searching in ' + Object.keys(testFixtures).join(', '));
            }
        } catch (e) {
            err = e;
        }

        req.on('end', function () {
            var fixturesForReq = testFixtures[keyForFixture(req)];
            if(err || !(Array.isArray(fixturesForReq) && fixturesForReq.length > 0)) {
                if (!options.strict) {
                    warn('warning: ' + keyForFixture(req) + ' was served directly from proxy.');
                    proxy(req, options.protocol, handleProxy);
                } else {
                    warn('strict mode refused playback of missing recording ' + keyForFixture(req));
                    error();
                }
                return;
            }

            var content = fixturesForReq.shift();
            var cRequest = content.request;
            var cResponse = content.response;

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
