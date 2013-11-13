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
          defaultPort = 3000;

        if (typeof options.hostname === 'string') {
            options.hostname = [options.hostname];
        }

        if (typeof options.port === 'number') {
            options.port = [options.port];
            defaultPort = options.port;
        }

        _.each(options.hostname, function (host, i) {

            var opts = _.clone(options);
            opts.hostname = host;
            var port = options.port[i] || ++defaultPort;

            connect()
                .use(function bufferBody(req, res, next) {
                    req.body = '';
                    req.on('data', function (data) {
                        req.body += data;
                    });
                    next();
                })
                .use(handler(opts))
                .listen(port || 3001);

            debug('server running in ' + (options.record ? 'record' : 'playback') +
                ' mode against ' + host + ' on port ' + port);

        });
    }
}

