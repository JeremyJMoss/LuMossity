const express = require ('express');
const {createInitialUser, createUser} = require('../controllers/userController');
const router = express.Router();

router.post( '/initial-user', createInitialUser );

router.post( '/create', createUser );

module.exports = router;