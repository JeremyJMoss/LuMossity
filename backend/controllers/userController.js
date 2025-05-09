const User = require('../models/User');
const { refreshTokenMaxAge } = require('../util/constants');
const { validateBodySchema } = require('../util/validation');
const { ConflictError } = require('../models/utility/Errors');
const { createUserSchema } = require('../schemas/userSchema');

module.exports.createInitialUser = async (req, res, next) => {
    try {
        // check if initial user already exists
        const firstUser = await User.getUserBy( 'id', 1 );

        if ( firstUser ) {
            throw new ConflictError('Initial user has already been initialised');
        }

        validateBodySchema(createUserSchema, req.body);

        const { firstName, lastName, email, password } = req.body;

        const initUser = await User.create( firstName, lastName, email, password, 'superadmin' );

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
        next(err);
    }
}

module.exports.createUser = async (req, res, next) => {
    try {
        validateBodySchema(createUserSchema, req.body);

        const { firstName, lastName, email, password } = req.body;
    
        const newUser = await User.create( firstName, lastName, email, password, 'user');

        const tokens = await newUser.login( password );

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
        next(err);
    }
}