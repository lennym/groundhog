'use strict';

module.exports = function (options) {

    var counts = {};

    var utils = require('./utils'),
        proxy = require('./proxy'),
        debug = require('debug')('groundhog:playback'),
        fs = require('fs'),
        _ = require('underscore');

    return function (req, res) {

        req.headers.host = options.hostname;

        req.on('end', function () {
            readResponse(utils.key(req), function (err, content) {
                if (err) {
                    if (!options.strict) {
                        // if no recording exists - proxy the request
                        proxy(req, handleProxy);
                    } else {
                        error();
                    }
                } else {
                    res.statusCode = content.status || 200;
                    _.each(content.headers, function (val, name) {
                        res.setHeader(name, val);
                    });
                    res.write(content.body);
                    res.end();
                }
            });
        });

        function error() {
            res.statusCode = 500;
            res.end();
        }

        function readResponse(file, callback) {
            if (counts[file] === undefined) {
                counts[file] = 0;
            }
            var count = counts[file],
                filename = file + '__'  + count;

            debug('Reading file: ', filename);
            fs.readFile(options.dir + '/' + filename + '.json', { encoding: 'utf8' }, function (err, contents) {
                if (err) {
                    debug('Failed to read: ', options.dir + '/' + filename + '.json');
                    callback(err);
                } else {
                    counts[file]++;
                    callback(null, JSON.parse(contents));
                }
            });

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
