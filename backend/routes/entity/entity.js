const express = require ('express');
const Entity = require('../../models/Entity');
const { validateEntity } = require('../../util/validation');
const router = express.Router();

router.post('/create', async (req, res, next) => {

    const missingFields = validateEntity( req.body );
    
    if (missingFields.length > 0) {
        return res.status(422).json({
            success: false,
            error: 'Missing required fields',
            missing: missingFields
        });
    }

    const { name, entityKey = null, fields = [] } = req.body;

    try {
        const entity = await Entity.create( name, entityKey );
        return res.status(200).json({
            success: true,
            entity
        })
    } catch (err) {
        return res.status(500).json({
            success: false,
            error: err.message
        })
    }
})

router.get('/all', async (req, res, next) => {
    try {
        const entities = await Entity.getAll();
        res.status(200).json({
            success: true,
            entities
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        })
    }
})

module.exports = router;