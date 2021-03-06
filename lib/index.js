'use strict';

var debug = require('debug')('groundhog:server'),
  connect = require('connect'),
  mkdirp = require('mkdirp'),
  _ = require('underscore');

var Groundhog = {

    run: function run(options) {
        options.timestamp = (new Date()).toISOString();

        if (options.record) {
            mkdirp(options.dir, function (err) {
                if (err) throw err;
                this.listen(require('./recorder'), options);
            }.bind(this));
        } else {
            this.listen(require('./playback'), options);
        }
    },

    listen: function listen(handler, options) {
        _.each(this.proxies(options), function (proxy) {

            connect()
                .use(function bufferBody(req, res, next) {
                    req.body = '';
                    req.on('data', function (data) {
                        req.body += data;
                    });
                    next();
                })
                .use(handler(proxy))
                .listen(proxy.port);

            debug('server running in ' + (options.record ? 'record' : 'playback') +
                ' mode against ' + proxy.protocol + '://' + proxy.hostname + ' on port ' + proxy.port);

        });
    },

    proxies: function proxies(opts) {
        if (typeof opts.hostname === 'string' && typeof opts.proxies === 'undefined') {
            opts.proxies = [
                {
                    hostname: opts.hostname,
                    port: opts.port || 3001,
                    protocol: opts.protocol
                }
            ];
        }
        return _.map(opts.proxies, function (proxy) {
            return _.defaults(_.extend({}, opts, proxy), { protocol: 'http' });
        });
    }

};

module.exports = Groundhog;

