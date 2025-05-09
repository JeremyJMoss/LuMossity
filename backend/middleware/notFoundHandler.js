const { NotFoundError } = require("../models/utility/Errors")

module.exports = (req, res, next) => {
    next(new NotFoundError('Route not Found'));
}