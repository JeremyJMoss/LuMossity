const express = require ('express');
const {createInitialUser, createUser, loginUser} = require('../controllers/userController');
const router = express.Router();

router.post( '/initial-user', createInitialUser );

router.post( '/create', createUser );

router.post( '/login', loginUser );

module.exports = router;