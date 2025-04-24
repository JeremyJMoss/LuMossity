const express = require ('express');
const {createEntity, getAllEntities, getSingleEntity, updateEntity} = require('../controllers/entityController');
const router = express.Router();

router.post('/create', createEntity);

router.put('/:entityKey', updateEntity);

router.get('/all', getAllEntities);

router.get('/:entityKey', getSingleEntity);

module.exports = router;