const express = require ('express');
const {createInitialUser} = require('../controllers/userController');
const router = express.Router();

router.post( 'inital_user', createInitialUser );

module.exports = router;