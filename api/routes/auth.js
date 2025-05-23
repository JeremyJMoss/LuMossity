const express = require ('express');
const { refreshAccessToken, loginUser, verifyAccessToken } = require('../controllers/authController');
const router = express.Router();

router.post('/refresh', refreshAccessToken);

router.post( '/login', loginUser );

router.post('/verify', verifyAccessToken)

module.exports = router;