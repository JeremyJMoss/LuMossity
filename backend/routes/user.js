const express = require ('express');
const {createInitialUser} = require('../controllers/userController');
const router = express.Router();

router.post( '/initial-user', createInitialUser );

module.exports = router;