const User = require('../models/User');
const { refreshTokenMaxAge } = require('../util/constants');
const { validateBodySchema } = require('../util/validation');
const { ConflictError } = require('../models/utility/Errors');
const { createUserSchema, loginUserSchema } = require('../schemas/userSchema');

module.exports.createInitialUser = async (req, res, next) => {
    try {
        // check if initial user already exists
        const first_user = await User.getUserBy( 'id', 1 );

        if ( first_user ) {
            throw new ConflictError('Initial user has already been initialised');
        }

        validateBodySchema(createUserSchema, req.body);

        const { first_name, last_name, email, password } = req.body;

        const initUser = await User.create( first_name, last_name, email, password, 'superadmin' );

        const tokens = await initUser.login( password );

        res.cookie('refreshToken', tokens.refresh_token, {
            httpOnly: true,
            secure: true,
            sameSite: 'Strict',
            maxAge: refreshTokenMaxAge
        });

        return res.status(200).json({
            success: true,
            access_token: tokens.access_token
        });

    } catch (err) {
        next(err);
    }
}

module.exports.createUser = async (req, res, next) => {
    try {
        validateBodySchema(createUserSchema, req.body);

        const { first_name, last_name, email, password } = req.body;
    
        const newUser = await User.create( first_name, last_name, email, password, 'user');

        const tokens = await newUser.login( password );

        res.cookie('refreshToken', tokens.refresh_token, {
            httpOnly: true,
            secure: true,
            sameSite: 'Strict',
            maxAge: refreshTokenMaxAge
        });

        return res.status(200).json({
            success: true,
            access_token: tokens.access_token
        });

    } catch (err) {
        next(err);
    }
}

module.exports.loginUser = async (req, res, next) => {
    try {
        validateBodySchema(loginUserSchema, req.body);

        const {email, password} = req.body;

        const user = await User.getUserBy('email', email);

        const tokens = await user.login(password);

        res.cookie('refreshToken', tokens.refresh_token, {
            httpOnly: true,
            secure: true,
            sameSite: 'Strict',
            maxAge: refreshTokenMaxAge
        });

        return res.status(200).json({
            success: true,
            access_token: tokens.access_token
        });

    } catch (err) {
        next(err);
    }
}