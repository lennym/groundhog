'use strict';

module.exports = function (req, callback) {

    var https = require('https');

    var options = {
        hostname: req.headers.host,
        port: 443,
        path: req.url,
        method: req.method,
        headers: req.headers
    };
    var r = https.request(options, function (response) {
        callback(null, response);
    });
    r.on('error', callback);

    if (req.complete) {
        r.write(req.body);
        r.end();
    } else {
        req.on('data', function (data) {
            r.write(data);
        });
        req.on('end', function () {
            r.end();
        });
    }

};