const extensionService = require('../services/ExtensionService');

// adding extension service to all routes
module.exports = function extensionMiddleware(req, res, next) {
  req.extensions = extensionService;
  next();
};