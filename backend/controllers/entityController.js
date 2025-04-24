const Entity = require('../models/Entity');
const { validateFields } = require('../util/validation');

module.exports.createEntity = async (req, res, next) => {

    const missingFields = validateFields(req.body, ['name']);
    
    if (missingFields.length > 0) {
        return res.status(422).json({
            success: false,
            error: 'Missing required fields',
            missing: missingFields
        });
    }

    const { name, entityKey = null, fields = [] } = req.body;

    try {
        const entity = await Entity.create( name, entityKey, fields );
        return res.status(201).json({
            success: true,
            entity: entity.toJSON()
        })
    } catch (err) {
        return res.status(500).json({
            success: false,
            error: err.message
        })
    }
}

module.exports.getAllEntities = async (req, res, next) => {
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
}

module.exports.getSingleEntity = async (req, res, next) => {
    const { entityKey } = req.params;

    try {
        const entity = await Entity.getExistingEntity(entityKey);

        if ( !entity ) {
            return res.status(404).json({
                success: false,
                error: 'Entity not found'
            });
        }

        res.status(200).json({
            success: true,
            entity: entity.toJSON()
        })
    } catch (err) {
        return res.status(500).json({
            success: false,
            error: err.message       
        });
    }
}

module.exports.updateEntity = async (req, res, next) => {
    const { entityKey } = req.params;
    const { name = null, fields } = req.body

    try {
        const entity = await Entity.getExistingEntity(entityKey);

        if ( !entity ) {
            return res.status(404).json({
                success: false,
                error: 'Could not update Entity as Entity was not found'
            });
        }

        entity.clearFields();

        entity.addFields(fields);

        if ( name ) {
            entity.setName( name );
        }

        await entity.update();

        return res.status(200).json({
            success: true,
            entity: entity.toJSON()
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            error: err.message
        })
    }
}