const User = require('../models/User');
const {validateFields} = require('../util/validation');

module.exports.createInitialUser = async (req, res, next) => {
    const missingFields = validateFields(req.body, ['username', 'email', 'password']);

    if (missingFields.length > 0) {
        return res.status(422).json({
            success: false,
            error: 'Missing required fields',
            missing: missingFields
        });
    }

    const { username, email, password } = req.body;

    try {
        const firstUser = await User.getUserBy( 'id', 1 );

        if (firstUser){
            return res.status(409).json({
                success: false,
                error: 'User already has been initialised'
            });
        }

        const initUser = await User.create( username, email, password, 1 );

        const token = await initUser.login( password );

        return res.status(200).json({
            success: true,
            token
        });

    } catch (err) {
        return res.status(500). json({
            success: false,
            error: err.message
        });
    }

    
}