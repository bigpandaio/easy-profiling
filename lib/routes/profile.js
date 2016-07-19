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
  setStatus(id, `Profile started at ${timestamp / 1000} for ${timeout / 1000} seconds`);
  setTimeout(() => stopProfiling(id), timeout);

  res.status(200).send(`Started profiling for ${timeout} seconds\nid: ${id}`);
}

function stopProfiling(id) {
  const profile = profiler.stopProfiling(id);
  try {
    fs.writeFile(`${_datadir}/${id}.cpuprofile`, JSON.stringify(profile));
    setStatus(id, `Profile finished successfuly on ${Date.now() / 1000}`);
  } catch (err) {
    setStatus(id, `Profile failed with error: '${err.message}'`);
  }
}

function setStatus(id, status) {
  profileStatuses[id] = status;
}

function getStatus(req, res) {
  if (!req.params || !req.params.id) {
    return res.status(403).send('Please indicate profile id');
  }

  if (!profileStatuses[req.params.id]) {
    return res.status(404);
  }

  return res.status(200).send(profileStatuses[req.params.id]);
}
