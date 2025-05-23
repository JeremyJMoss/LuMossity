const express = require ('express');
const { refreshAccessToken, loginUser } = require('../controllers/authController');
const router = express.Router();

router.post('/refresh', refreshAccessToken);

router.post( '/login', loginUser );

module.exports = router;