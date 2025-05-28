const { AuthenticationError, AuthorizationError } = require("../models/utility/Errors");
const AuthService = require('../services/AuthService');
const {validateBodySchema} = require('../util/validation');
const User = require('../models/User');
const { loginUserSchema } =  require('../schemas/authSchema');
const { refreshTokenMaxAge, accessTokenMaxAge } = require('../util/constants');
const cookie = require("cookie");

module.exports.refreshAccessToken = async ( req, res, next ) => {
    try {
        const refresh_token = req.cookies?.refreshToken;

        if ( !refresh_token ) throw new AuthenticationError("No refresh token sent in request");

        const verified_user = AuthService.verifyJwtToken('refresh', refresh_token);

        if (!verified_user) {
            throw new AuthorizationError("Invalid or expired token");
        }

        const userInDB = await User.getUserBy('id', verified_user.userId);

        const user = userInDB.toJSON();

        const access_token = AuthService.createJwtToken('access', {
            userId: user.id,
            role: user.role
        });

        res.setHeader('Set-Cookie', [
            cookie.serialize('accessToken', access_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                maxAge: accessTokenMaxAge,
                path: '/'
            }),
            cookie.serialize('refreshToken', refresh_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                maxAge: refreshTokenMaxAge,
                path: '/'
            })
        ])

        res.status(201).json({access_token})
    } catch (err) {
        next(err);
    }
}

module.exports.loginUser = async (req, res, next) => {
    try {
        validateBodySchema(loginUserSchema, req.body);

        const {email, password} = req.body;

        const user = await User.getUserBy('email', email);

        if (user === null) {
            throw new AuthenticationError('Email or password was invalid');
        }

        const tokens = await user.login(password);

        res.setHeader('Set-Cookie', [
            cookie.serialize('refreshToken', tokens.refresh_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                maxAge: refreshTokenMaxAge,
                path: '/'
            }),
            cookie.serialize('accessToken', tokens.access_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                maxAge: accessTokenMaxAge,
                path: '/'
            })
        ]);

        return res.status(200).json({
            access_token: tokens.access_token
        });

    } catch (err) {
        next(err);
    }
}

module.exports.verifyAccessToken = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    try {
        const decoded = AuthService.verifyJwtToken('access', token);
        if (!decoded) {
            throw new AuthenticationError('Invalid or expired token');
        }
        res.status(200).json({
            expiry: decoded.exp
        });
    } catch {
        next(err);
    }
}