const express = require ('express');
const {createInitialUser, createUser, loginUser, getAllUsers} = require('../controllers/userController');
const router = express.Router();

//Get
router.get( '/all', getAllUsers );

//Post
router.post( '/initial-user', createInitialUser );

router.post( '/create', createUser );

router.post( '/login', loginUser );

module.exports = router;