const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');

module.exports.init = (params) => {
    const datadir = params && params.datadir ? params.datadir : '.';
    const app = initExpress(params);

		require('./routes/profile').init({ app, datadir });

		const server = http.createServer(app);
		server.listen(app.get('port'));
};

function initExpress(params) {
  if (params && params.app) {
    return params.app;
  }

  const app = express();

  app.set('port', 1991);
  app.use(bodyParser.json({ limit: '51mb' }));
  app.enable('trust proxy');

  return app;
}
