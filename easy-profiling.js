var fs = require('fs');
var profiler = require('v8-profiler');
var _datadir = null;

module.exports.init = function (datadir) {
    _datadir = datadir;
    setInterval(startProfiling, 30 * 1000);
};

function startProfiling() {
    var timestamp = Date.now();
    var id = 'profile-' + timestamp;

    profiler.startProfiling(id);

    setTimeout(function () {
        stopProfiling(id)
    }, 5000);
}

function stopProfiling(id) {
    var profile = profiler.stopProfiling(id);
    fs.writeFile(_datadir + '/' + id + '.cpuprofile', JSON.stringify(profile));
}
