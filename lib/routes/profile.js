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
  const status = 'started';
  const timestamp = Date.now();
  const timeout = req.params && req.params.timeout || 5000;
  const id = `profile-${timeout}ms-${timestamp}`;

  profiler.startProfiling(id);
  setStatus(id, status, timeout);
  setTimeout(() => stopProfiling(id), timeout);

  const response = { status, id, timeout };

  res.setHeader('Content-Type', 'application/json');
  res.status(200).send(JSON.stringify(response));
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
  const logData = {};

  switch (status) {
    case 'started':
      message = `Started profiling for ${data}ms`;
      logData.profile_id = id;
      logData.status = status;
      logData.timeout = data;
      break;
    case 'finished':
      message = `Finished profiling id ${id}`;
      logData.profile_id = id;
      logData.status = status;
      break;
    case 'failed':
      message = `Failed to profile id ${id}, Error: ${data}`;
      logData.profile_id = id;
      logData.status = status;
      logData.error_message = data;
      break;
    default:
      return;
  }

  profileStatuses[id] = { status, data, timestamp: Date.now() };

  eventEmitter.emit('status_change', logData);
  logger.info(message, logData);
}

function getStatus(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (!req.params || !req.params.id) {
    logger.warn('Status request received without an id');
    const response = { status: 'failed', error: 'No profile id was indicated' };
    return res.status(403).send(JSON.stringify(response));
  }

  logger.info(`Status request received for id: ${req.params.id}`);

  if (!profileStatuses[req.params.id]) {
    logger.warn(`Status does not exist for id: ${req.params.id}`);
    const response = { status: 'failed', error: 'Profile ID ${req.params.id} was not found' };
    return res.status(404).send(JSON.stringify(response));
  }

  cost statusObj = profileStatuses[req.params.id];
  let message = { status: statusObj.status };
  switch (statusObj.status) {
    case 'started':
      message.time_left = `${statusObj.data - (Date.now() - statusObj.timestamp)}ms.`;
      break;
    case 'finished':
      message.end_time = `${Date.now() - statusObj.timestamp} ms ago.`;
      break;
    case 'failed':
      message.error = ${statusObj.data};
      break;
    default:
      message.status = 'unknown';
  }

  return res.status(200).send(JSON.stringify(message));
}
