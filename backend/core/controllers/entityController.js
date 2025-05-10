const Entity = require('../models/Entity');
const { validateBodySchema } = require('../util/validation');
const { createEntitySchema, createEntityFieldsSchema, updateEntitySchema, updateEntityFieldsSchema } = require('../schemas/entitySchema');
const { NotFoundError } = require('../models/utility/Errors');

// Read
module.exports.getAllEntities = async (req, res, next) => {
    try {
        const entities = await Entity.getAll();

        const transformed_entities = await req.extensions.runEvent('core.after.getAll.query', entities);
        
        res.status(200).json({
            success: true,
            entities: transformed_entities
        });
    } catch (err) {
        next(err);
    }
}

module.exports.getSingleEntity = async (req, res, next) => {
    const { entity_key } = req.params;

    try {
        const entity = await Entity.getExistingEntity(entity_key);

        if ( !entity ) {
            throw new NotFoundError('Entity not found');
        }

        res.status(200).json({
            success: true,
            entity: entity.toJSON()
        })
    } catch (err) {
        next(err);
    }
}

// Create
module.exports.createEntity = async (req, res, next) => {

    try{
        validateBodySchema( createEntitySchema, req.body );

        const { name, entity_key = null } = req.body;

        await Entity.create( name, entity_key );

        return res.status(201).json({
            success: true
        })
    } catch (err) {
        next(err);
    }
}

module.exports.createEntityFields = async (req, res, next) => {
    const { entity_key } = req.params;

    try {
        validateBodySchema( createEntityFieldsSchema, req.body );

        const { fields } = req.body;
    
        const entity = await Entity.getExistingEntity(entity_key);

        if ( !entity ) {
            throw new NotFoundError('Entity not found');
        }

        entity.removeFields(fields);

        await entity.sync();

        return res.status(200).json({
            success: true,
            entity: entity.toJSON()
        });

    } catch (err) {
        next(err);
    }
}

// Update
module.exports.updateEntity = async (req, res, next) => {
    const { entity_key } = req.params;

    try {
        validateBodySchema( updateEntitySchema, req.body);

        const { name } = req.body
    
        const entity = await Entity.getExistingEntity(entity_key);

        if ( !entity ) {
            throw new NotFoundError('Entity not found');
        }

        entity.setName( name );
        await entity.sync();

        return res.status(200).json({
            success: true
        });

    } catch (err) {
        next(err);
    }
}

module.exports.updateEntityFields = async ( req, res, next ) => {
    const { entity_key } = req.params;

    try {
        validateBodySchema(updateEntityFieldsSchema, req.body);

        const { fields } = req.body;

        const entity = await Entity.getExistingEntity(entity_key);

        if ( !entity ) {
            throw new NotFoundError('Entity not found');
        }

        if ( fields.length > 0 ) {
            entity.updateFields(fields);
        }

        await entity.sync();

        return res.status(200).json({
            success: true,
            entity: entity.toJSON()
        });

    } catch (err) {
        next(err)
    }
}

// Delete
module.exports.deleteEntityFields = async (req, res, next) => {

}