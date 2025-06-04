const express = require ('express');
const authenticate = require('../middleware/authMiddleware');
const {getFieldPresets, getFieldSetup} = require('../controllers/fieldTypeController');
const router = express.Router();

// Get
router.get('/field-presets', authenticate("superadmin"), getFieldPresets);

// Post
router.get('/:field_type/field-setup', authenticate('superadmin'), getFieldSetup);


module.exports = router;