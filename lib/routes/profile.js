const fs = require('fs');
const profiler = require('v8-profiler');
var _datadir;

module.exports.init = (params) => {
  params.app.post('/profile', startProfiling);
  params.app.post('/profile/:timeout', startProfiling);
  _datadir = params.datadir;
};


function startProfiling(req, res) {
  const timestamp = Date.now();
  const id = `profile-${timestamp}`;
  const timeout = req.params && req.params.timeout || 5000;

  profiler.startProfiling(id);

  setTimeout(() => stopProfiling(id, res, timeout), timeout);
}

function stopProfiling(id, res, timeout) {
  const profile = profiler.stopProfiling(id);
  try {
    fs.writeFile(`${_datadir}/${id}.cpuprofile`, JSON.stringify(profile));
    res.status(200).send(`Started profiling for ${timeout}s`);
  } catch (err) {
    res.status(500).send(`ERROR: ${err.message}`);
  }
}
