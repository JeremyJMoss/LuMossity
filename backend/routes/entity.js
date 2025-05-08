const express = require ('express');
const {createEntity, getAllEntities, getSingleEntity, updateEntity, updateEntityFields, createEntityFields} = require('../controllers/entityController');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware')

router.post('/create', authenticate("superadmin"), createEntity);

router.post('/:entity_key/fields/add', authenticate("superadmin"), createEntityFields);

router.put('/:entity_key/fields/update', authenticate("superadmin"), updateEntityFields);

router.put('/:entity_key', updateEntity);

router.get('/all', getAllEntities);

router.get('/:entity_key', getSingleEntity);

module.exports = router;