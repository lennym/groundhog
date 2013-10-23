'use strict';

module.exports = function (options) {

    var proxy = require('./proxy'),
        utils = require('./utils'),
        debug = require('debug')('groundhog:recorder'),
        fs = require('fs'),
        zlib = require('zlib'),
        _ = require('underscore');

    var counts = {};

    return function (req, res) {

        req.headers.host = options.hostname;
        debug('proxying request to', req.headers.host + req.url);

        proxy(req, function (err, response) {
            var body = new Buffer('', 'utf8');
            if (err) {
                error();
            } else {
                res.statusCode = response.statusCode;
                _.each(response.headers, function (val, name) {
                    res.setHeader(name, val);
                });
                response.on('data', function (chunk) {
                    if (Buffer.isBuffer(chunk)) {
                        body = Buffer.concat([body, chunk]);
                    } else {
                        body.write(chunk);
                    }
                    res.write(chunk);
                });
                response.on('end', function () {
                    if (response.headers['content-encoding'] === 'gzip') {
                        zlib.gunzip(body, function (err, content) {
                            send(req, response, content.toString());
                        });
                    } else if (response.headers['content-encoding'] === 'deflate') {
                        zlib.inflate(body, function (err, content) {
                            send(req, response, content.toString());
                        });
                    } else {
                        send(req, response, body.toString());
                    }
                });
            }
        });

        function send(req, response, body) {
            saveResponse(utils.key(req), response, body, function (err) {
                if (err) {
                    error();
                } else {
                    debug('responded to ', req.url);
                    res.end();
                }
            });
        }

        function error() {
            res.statusCode = 500;
            res.end();
        }

        function saveResponse(file, response, body, callback) {
            if (counts[file] === undefined) {
                counts[file] = 0;
            }
            var count = counts[file],
                filename = file + '__'  + count;

            var content = {
                status: response.statusCode,
                headers: response.headers,
                body: body
            };
            debug('writing file: ', filename);
            fs.writeFile(options.dir + '/' + filename + '.json', JSON.stringify(content, null, '\t'), function (err) {
                if (err) {
                    debug('failed to write: ', options.dir + '/' + filename + '.json');
                    callback(err);
                } else {
                    counts[file]++;
                    callback();
                }
            });

        }

    };

};
