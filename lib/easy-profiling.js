const express = require('express');
const http = require('http');
const events = require('events');
const eventEmitter = new events.EventEmitter();

module.exports.init = (params) => {
    const datadir = params && params.datadir ? params.datadir : '.';
    const app = initExpress(params);
    const initParams = { app, datadir, eventEmitter };

    require('./routes/profile').init(initParams);
    if (!params || !params.app) {
      const server = http.createServer(app);
      server.listen(app.get('port'));
    }
};

function initExpress(params) {
  if (params && params.app) {
    return params.app;
  }

  const app = express();

  app.set('port', params && params.port || 1991);
  app.enable('trust proxy');

  return app;
}
