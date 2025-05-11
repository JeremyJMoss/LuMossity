const express = require ('express');
const {createEntity, getAllEntities, getSingleEntity, updateEntity, updateEntityFields, createEntityFields, deleteEntityFields} = require('../controllers/entityController');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware')

router.get('/all', getAllEntities);

router.get('/:entity_key', getSingleEntity);

router.post('/create', authenticate("superadmin"), createEntity);

router.post('/:entity_key/fields/add', authenticate("superadmin"), createEntityFields);

router.put('/:entity_key/fields/update', authenticate("superadmin"), updateEntityFields);

router.put('/:entity_key', updateEntity);

router.delete('/:entity_key/fields', authenticate("superadmin"), deleteEntityFields);

module.exports = router;