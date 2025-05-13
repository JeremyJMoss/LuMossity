const path = require('path');

module.exports.configPath = path.resolve(__dirname, '..', 'config', 'db.json');
module.exports.typeConfigPath = path.resolve(__dirname, '..', 'seeds', 'field_type_config.json');
module.exports.presetsPath = path.join(__dirname, '..', 'seeds', 'field_presets.json');
module.exports.maxFailedLoginAttempts = 5;
module.exports.lockoutBaseTime = 15 * 60;
module.exports.refreshTokenMaxAge = 7 * 24 * 60 * 1000;

module.exports.fieldTypeToMySQLType = {
  text: 'VARCHAR(255)',
  textarea: 'TEXT',
  email: 'VARCHAR(255)',
  integer: 'INT',
  float: 'FLOAT',
  currency: 'DECIMAL(10, 2)',
  url: 'VARCHAR(2083)',
  tel: 'VARCHAR(20)',
  password: 'VARCHAR(255)',
  date: 'DATE',
  time: 'TIME',
  datetime: 'DATETIME',
  checkboxes: 'JSON',
  checkbox: 'BOOLEAN',
  radio: 'VARCHAR(255)',
  switch: 'BOOLEAN',
  select: 'VARCHAR(255)',
  multiselect: 'JSON',
  image: 'JSON',
  file: 'JSON',
  relation_select: 'INT',
  relation_multiselect: "JSON",
  group: 'JSON'
};
