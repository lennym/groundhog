'use strict';

module.exports = function (req, protocol, callback) {
    protocol = (protocol === 'http') ? 'http' : 'https';
    var port = (protocol === 'http') ? 80 : 443;

    var http = require(protocol);

    var options = {
        hostname: req.headers.host,
        port: port,
        path: req.url,
        method: req.method,
        headers: req.headers
    };

    var r = http.request(options, function (response) {
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
