const User = require('../models/User');
const { refreshTokenMaxAge } = require('../util/constants');
const {validateFields} = require('../util/validation');

module.exports.createInitialUser = async (req, res, next) => {
    try {
        // check if initial user already exists
        const firstUser = await User.getUserBy( 'id', 1 );

        if (firstUser){
            return res.status(409).json({
                success: false,
                error: 'User already has been initialised'
            });
        }

        const missingFields = validateFields(req.body, ['username', 'email', 'password']);

        if (missingFields.length > 0) {
            return res.status(422).json({
                success: false,
                error: 'Missing required fields',
                missing: missingFields
            });
        }

        const { username, email, password } = req.body;

        const initUser = await User.create( username, email, password, 'superadmin' );

        const tokens = await initUser.login( password );

        res.cookie('refreshToken', tokens.refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'Strict',
            maxAge: refreshTokenMaxAge
        });

        return res.status(200).json({
            success: true,
            accessToken: tokens.accessToken
        });

    } catch (err) {
        return res.status(500). json({
            success: false,
            error: err.message
        });
    }

    
}