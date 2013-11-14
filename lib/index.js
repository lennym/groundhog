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

        var handler = options.record ? require('./recorder') : require('./playback'),
          defaultPort = typeof options.port === 'number' ? options.port : 3000,
          defaultProtocol = typeof options.protocol === 'string' ? options.protocol : 'http';

        if (typeof options.hostname === 'string') {
            options.proxies = [
                {   hostname: options.hostname,
                    port: defaultPort,
                    protocol: defaultProtocol
                }
            ];
        }

        _.each(options.proxies, function (proxy) {

            var opts = _.clone(options);
            opts.hostname = proxy.hostname;
            opts.port = proxy.port;
            opts.protocol = proxy.protocol;

            connect()
                .use(function bufferBody(req, res, next) {
                    req.body = '';
                    req.on('data', function (data) {
                        req.body += data;
                    });
                    next();
                })
                .use(handler(opts))
                .listen(opts.port || 3001);

            debug('server running in ' + (options.record ? 'record' : 'playback') +
                ' mode against ' + opts.hostname + ' on port ' + opts.port);

        });
    }
};

