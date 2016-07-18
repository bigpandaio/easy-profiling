const express = require('express');
const http = require('http');

module.exports.init = (params) => {
    const datadir = params && params.datadir ? params.datadir : '.';
    const app = initExpress(params);

		require('./routes/profile').init({ app, datadir });

    if (app.independant) {
      const server = http.createServer(app);
      server.listen(app.get('port'));
    }
};

function initExpress(params) {
  if (params && params.app) {
    return params.app;
  }

  const app = express();

  app.independant = true;
  app.set('port', 1991);
  app.enable('trust proxy');

  return app;
}
