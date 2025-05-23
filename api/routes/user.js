const express = require ('express');
const {createInitialUser, createUser, getAllUsers, deleteUser} = require('../controllers/userController');
const authenticate = require('../middleware/authMiddleware');
const router = express.Router();

//Get
router.get( '/', getAllUsers );

//Post
router.post( '/initial-user', createInitialUser );

router.post( '/create', createUser );

//Delete
router.delete( '/:user_id', authenticate('superadmin'), deleteUser );

module.exports = router;