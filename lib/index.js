'use strict';

var debug = require('debug')('groundhog:server'),
  connect = require('connect'),
  mkdirp = require('mkdirp'),
  _ = require('underscore');

module.exports = function (options) {
    options.timestamp = (new Date()).toISOString();

    if (options.record) {
        mkdirp(options.dir, start);
    } else {
        start();
    }

    function start(err) {
        if (err)
            throw err;

        var handler = options.record ? require('./recorder') : require('./playback');

        if (typeof options.hostname === 'string' && typeof options.proxies === 'undefined') {
            options.proxies = [
                {
                    hostname: options.hostname,
                    port: options.port,
                    protocol: options.protocol
                }
            ];
        }

        _.each(options.proxies, function (proxy) {

            var opts = _.clone(options);
            opts.hostname = proxy.hostname;
            opts.port = proxy.port || 3001;
            opts.protocol = proxy.protocol || 'http';

            connect()
                .use(function bufferBody(req, res, next) {
                    req.body = '';
                    req.on('data', function (data) {
                        req.body += data;
                    });
                    next();
                })
                .use(handler(opts))
                .listen(opts.port);

            debug('server running in ' + (options.record ? 'record' : 'playback') +
                ' mode against ' + opts.protocol + '://' + opts.hostname + ' on port ' + opts.port);

        });
    }
};

