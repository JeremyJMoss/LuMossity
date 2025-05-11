const express = require ('express');
const {initializeDatabase} = require('../controllers/setupController');
const router = express.Router();

router.post('/database', initializeDatabase);

module.exports = router;