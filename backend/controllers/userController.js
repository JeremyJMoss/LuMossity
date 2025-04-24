const User = require('../models/User');

module.exports.createInitialUser = (req, res, next) => {
    const missingFields = validateFields(req.body, ['username', 'email', 'password']);

    const { username, email, password } = req.body;

    const role = 1;

}