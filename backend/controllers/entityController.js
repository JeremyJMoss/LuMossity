const Entity = require('../models/Entity');
const { validateFields } = require('../util/validation');

module.exports.createEntity = async (req, res, next) => {

    const missing_fields = validateFields(req.body, ['name']);
    
    if (missing_fields.length > 0) {
        return res.status(422).json({
            success: false,
            error: 'Missing required fields',
            missing: missing_fields
        });
    }

    const { name, entity_key = null, fields = [] } = req.body;

    try {
        const entity = await Entity.create( name, entity_key, fields );
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
    const { entity_key } = req.params;

    try {
        const entity = await Entity.getExistingEntity(entity_key);

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
    const { entity_key } = req.params;
    const { name = null } = req.body

    try {
        const entity = await Entity.getExistingEntity(entity_key);

        if ( !entity ) {
            return res.status(404).json({
                success: false,
                error: 'Could not update Entity as Entity was not found'
            });
        }

        if ( name ) {
            entity.setName( name );
            await entity.update();
        }

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

module.exports.updateEntityFields = async ( req, res, next ) => {
    const { entity_key } = req.params;

    const missing_fields = validateFields(req.body, ['fields']);
    
    if (missing_fields.length > 0) {
        return res.status(422).json({
            success: false,
            error: 'Missing required fields',
            missing: missing_fields
        });
    }

    const { fields = [] } = req.body;

    if ( !Array.isArray(fields) ) {
        return res.status(422).json({
            success: false,
            error: 'Malformed request body'
        })
    }

    try {
        const entity = await Entity.getExistingEntity(entity_key);

        if ( !entity ) {
            return res.status(404).json({
                success: false,
                error: 'Could not update entity fields as entity was not found'
            });
        }

        if ( fields.length > 0 ) {
            entity.updateFields(fields);
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

module.exports.createEntityFields = async (req, res, next) => {
    const { entity_key } = req.params;

    const missing_fields = validateFields(req.body, ['fields']);
    
    if (missing_fields.length > 0) {
        return res.status(422).json({
            success: false,
            error: 'Missing required fields',
            missing: missing_fields
        });
    }

    const { fields = [] } = req.body;

    if ( !Array.isArray(fields) ) {
        return res.status(422).json({
            success: false,
            error: 'Malformed request body'
        })
    }

    try {
        const entity = await Entity.getExistingEntity(entity_key);

        if ( !entity ) {
            return res.status(404).json({
                success: false,
                error: 'Could not update entity fields as entity was not found'
            });
        }

        if ( fields.length > 0 ) {
            entity.addFields(fields);
        } else {
            return res.status(422).json({
                success: false,
                error: "No fields sent in request"
            })
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