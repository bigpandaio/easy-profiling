const express = require('express');
const http = require('http');

module.exports.init = (params) => {
    const datadir = params && params.datadir ? params.datadir : '.';
    const app = initExpress(params);
    const logger = initLogger(params);

    require('./routes/profile').init({ app, datadir, logger });

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

function initLogger(params) {
  if (params && params.logger) {
    return params.logger;
  }

  return {
    info: () => true,
    warn: () => true,
    error: () => true,
    debug: () => true
  };
}
