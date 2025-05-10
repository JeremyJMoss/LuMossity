const extensionService = require('../services/ExtensionService');

module.exports = function extensionMiddleware(req, res, next) {
  req.extensions = extensionService;
  next();
};