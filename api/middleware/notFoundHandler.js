const { NotFoundError } = require("../models/utility/Errors")

// if route is not a valid route will return route not found
module.exports = (req, res, next) => {
    next(new NotFoundError('Route not found.'));
}