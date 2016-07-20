const fs = require('fs');
const profiler = require('v8-profiler');
var _datadir;
const profileStatuses = {};

module.exports.init = (params) => {
  params.app.post('/profile', startProfiling);
  params.app.post('/profile/:timeout', startProfiling);
  params.app.get('/profile/status/:id', getStatus);
  _datadir = params.datadir;
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
    fs.writeFile(`${_datadir}/${id}.cpuprofile`, JSON.stringify(profile));
    setStatus(id, 'finished');
  } catch (err) {
    setStatus(id, 'failed', err.message);
  }
}

function setStatus(id, status, data) {
  profileStatuses[id] = { status, data, timestamp: Date.now() };
}

function getStatus(req, res) {
  if (!req.params || !req.params.id) {
    return res.status(403).send('Please indicate profile id');
  }

  if (!profileStatuses[req.params.id]) {
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
