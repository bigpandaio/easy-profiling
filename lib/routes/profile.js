const fs = require('fs');
const profiler = require('v8-profiler');
var datadir;
var logger;
var eventEmitter;
const profileStatuses = {};

module.exports.init = (params) => {
  params.app.post('/profile', startProfiling);
  params.app.post('/profile/:timeout', startProfiling);
  params.app.get('/profile/status/:id', getStatus);

  logger = params.logger;
  datadir = params.datadir;
  eventEmitter = params.eventEmitter;

  logger.info('Profiler initialized', { datadir });
};

function startProfiling(req, res) {
  const timestamp = Date.now();
  const timeout = req.params && req.params.timeout || 5000;
  const id = `profile-${timeout}ms-${timestamp}`;

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
  var message = '';
  const log_data = {};

  switch (status) {
    case 'started':
      message = `Started profiling for ${data}ms`;
      log_data.profile_id = id;
      log_data.status = status;
      log_data.timeout = data;
      break;
    case 'finished':
      message = `Finished profiling id ${id}`;
      log_data.profile_id = id;
      log_data.status = status;
      break;
    case 'failed':
      message = `Failed to profile id ${id}, Error: ${data}`;
      log_data.profile_id = id;
      log_data.status = status;
      log_data.error_message = data;
      break;
    default:
      return;
  }

  profileStatuses[id] = { status, data, timestamp: Date.now() };

  eventEmitter.emit('status_change', log_data);
  logger.info(message, log_data);
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
