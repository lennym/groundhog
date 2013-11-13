'use strict';

module.exports = function (options) {

    var proxy = require('./proxy'),
        debug = require('debug')('groundhog:recorder'),
        fs = require('fs'),
        zlib = require('zlib'),
        path = require('path'),
        _ = require('underscore');

    var capturedHttp = [];
    var recordFilename = options.timestamp + '_' + options.hostname +  '.json';
    var currentFilename = path.join(options.dir, 'current_' + options.hostname +  '.json');
    var filename = path.join(options.dir, recordFilename);
    var currentLinked = false;

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
            var interaction = {
                created: (new Date()).toISOString(),
                uuid: (~~(Math.random() * 1e9)).toString(36),
                response: {
                    status: response.statusCode,
                    headers: response.headers,
                    body: body
                }, request: {
                    headers: req.headers,
                    host: req.headers.host,
                    path: req.url,
                    method: req.method,
                }
            };

            if(req.body) {
                interaction.request.body = req.body;
            }

            capturedHttp.push(interaction);
            debug('writing file: ', filename);
            fs.writeFileSync(filename, JSON.stringify(capturedHttp, null, 2));
            if(!currentLinked) {
                debug('linking ', filename, currentFilename);
                fs.linkSync(filename, currentFilename);
                currentLinked = true;
            }

            debug('responded to ', req.url);
            res.end();
        }

        function error() {
            res.statusCode = 500;
            res.end();
        }

    };

};
