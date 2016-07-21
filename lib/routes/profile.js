const fs = require('fs');
const profiler = require('v8-profiler');
var datadir;
var logger;
const profileStatuses = {};

module.exports.init = (params) => {
  params.app.post('/profile/:timeout', startProfiling);
  params.app.get('/profile/status/:id', getStatus);
  logger = params.logger;
  datadir = params.datadir;

  logger.info('Profiler initialized', { datadir });
};


function startProfiling(req, res) {
  const timestamp = Date.now();
  const id = `profile-${timestamp}`;
  const timeout = req.params && req.params.timeout || 5000;

  profiler.startProfiling(id);
  setStatus(id, 'started', timeout);
  setTimeout(() => stopProfiling(id), timeout);

  res.status(200).send(`Started profiling for ${timeout} seconds\nid: ${id}\n`);
}

function stopProfiling(id) {
  const profile = profiler.stopProfiling(id);
  try {
    fs.writeFile(`${datadir}/${id}.cpuprofile`, JSON.stringify(profile));
    setStatus(id, 'finished');
  } catch (err) {
    setStatus(id, 'failed', err.message);
  }
}

function setStatus(id, status, data) {
  profileStatuses[id] = { status, data, timestamp: Date.now() };
  switch (status) {
    case 'started':
      logger.info(`Started profiling for ${data}ms`, { profile_id: id, status, timeout: data });
      break;
    case 'finished':
      logger.info(`Finished profiling id ${id}`, { profile_id: id, status });
      break;
    case 'failed':
      logger.error(`Failed to profile id ${id}, Error: ${data}`, { profile_id: id, status, error_message: data });
      break;
    default:
      return;
  }
}

function getStatus(req, res) {
  if (!req.params || !req.params.id) {
    logger.warn('Status request received without an id');
    return res.status(403).send('Please indicate profile id');
  }

  logger.info(`Status request received for id: ${req.params.id}`);

  if (!profileStatuses[req.params.id]) {
    logger.warn(`Status does not exist for id: ${req.params.id}`);
    return res.status(404);
  }

  var message = '';
  var statusObj = profileStatuses[req.params.id];
  switch (statusObj.status) {
    case 'started':
      message = `Running. Left: ${statusObj.data - (Date.now() - statusObj.timestamp)}ms.`;
      break;
    case 'finished':
      message = `Finished ${Date.now() - statusObj.timestamp} ms ago.`;
      break;
    case 'failed':
      message = `Failed due to error: ${statusObj.data}`;
      break;
    default:
      message = 'Status unknown';
  }

  message += '\n';
  return res.status(200).send(message);
}
