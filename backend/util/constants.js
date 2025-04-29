const path = require('path');

module.exports.configPath = path.resolve(__dirname, '..', 'config', 'db.json');
module.exports.maxFailedLoginAttempts = 5;
// how long till user can login again
module.exports.lockoutBaseTime = 15 * 60;