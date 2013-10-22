'use strict';

var crypto = require('crypto');

module.exports = {
    key: function (req) {
        var host = req.headers.host,
            path = req.url;

        if (req.method.match(/POST|PUT/)) {
            var hash = crypto.createHash('md5');
            hash.update(req.body);
            path += ('__' + hash.digest('base64'));
        }

        return  req.method + '__' + (host + path).split('/').join('__');
    }
};