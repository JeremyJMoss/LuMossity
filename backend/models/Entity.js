const DatabaseConnector = require ('../services/DatabaseConnector');
const {toSnakeCase} = require('../util/helpers');

class Entity {

    constructor( name, entity_key = null, entity_id = null, entity_fields = [] ) {
        if ( !name || typeof name !== 'string' ) {
            throw new Error( 'Entity must have a valid name' );
        }

        this.name = name;
        this.entity_key = entity_key;
        this.entity_id = entity_id;
        this.fields = entity_fields;
    }

    static async create( name, entity_key = null ) {
        const finalKey = entity_key || toSnakeCase(name);

        let existingData;
        try {
            existingData = await Entity.#getEntityData(finalKey);
        } catch (err) {
            throw err;
        }

        if ( existingData && entity_key ) {
            throw new Error('Entity with that key already exists');
        }

        try {
            const entity = new Entity( name, finalKey );
            await entity.createEntity();
            return entity;
        } catch (err) {
            throw err;
        }
    }

    static async getExistingEntity( entity_key ) {
        let existingData;
        try {
            existingData = await Entity.#getEntityData(entity_key);
        } catch (err) {
            throw err;
        }

        if ( existingData ) {
            try {
                return new Entity(
                    existingData.name,
                    existingData.entity_key,
                    existingData.entity_id,
                    existingData.fields
                )
            }
            catch (err) {
                throw err;
            }
        }
    }

    static async #getEntityData(entity_key) {
        let dbConnection;
        try {
            dbConnection = await DatabaseConnector.getConnection();

            const [entityRows] = await dbConnection.query(
                `SELECT * FROM \`entities\` WHERE entity_key = ? LIMIT 1`,
                [entity_key]
            );

            if (entityRows.length === 0) return null;

            const entity = entityRows[0];

            const [structureRows] = await dbConnection.query(
                `SELECT * FROM \`entities_structure\` WHERE entity_id = ? ORDER BY order_index ASC`,
                [entity.ID]
            );

            return {
                name: entity.entity_name,
                entity_key: entity.entity_key,
                entity_id: entity.ID,
                fields: structureRows
            };
        } catch (err) {
            throw new Error('Failed to load entity data: ' + err.message);
        } finally {
            if (dbConnection) {
                try {
                    await dbConnection.end();
                } catch (err) {
                    console.error('Failed to close database connection');
                }
            }
        }
    }

    static async getAll () {
        let dbConnection;
        try {
            dbConnection = await DatabaseConnector.getConnection();

            const [entities] = await dbConnection.query('SELECT * FROM entities');

            const [fields] = await dbConnection.query('SELECT * FROM entities_structure');

            const grouped = entities.map(entity => {
                const structure = fields.filter(field => field.entity_id === entity.ID);
                return {
                    ...entity,
                    fields: structure
                };
            });
        
            return grouped;

        } catch (err) {
            throw new Error( 'Unable to retrieve all entities: ' + err.message );
        } finally {
            if (dbConnection) {
                try {
                    await dbConnection.end();
                } catch (err) {
                    console.error("Failed to close database connection");
                }
            }
        }
    }

    addField( config ) {
        const requiredKeys = ['key', 'type', 'fieldName'];
        const missing = requiredKeys.filter( key => !config[key] );

        if (missing.length > 0) {
            throw new Error( `Missing required field properties: ${missing.join(', ')}` );
        }

        const {
            key, 
            type, 
            isRequired = false, 
            defaultValue = null, 
            isQueryable = false, 
            orderIndex = 0
        } = config;

        // check if field already exists
        if (this.fields.find( field => field.key == key) ) {
            throw new Error(`Field with key "${key}" already exists`);
        }

        // add new field into array
        this.fields.push({
            key,
            fieldName,
            type,
            isRequired,
            defaultValue,
            isQueryable,
            orderIndex
        });
    }

    async refreshFields() { 
        let dbConnection;
        try {
            dbConnection = await DatabaseConnector.getConnection();

            if (!this.entity_id) {
                const [entityRows] = await dbConnection.query(
                    `SELECT * FROM \`entities\` WHERE entity_key = ? LIMIT 1`,
                    [this.entity_key]
                );
    
                if (entityRows.length === 0) {
                    return false;
                }

                this.entity_id = entityRows[0].ID;

            }

            const [structureRows] = await dbConnection.query(
                `SELECT * FROM \`entities_structure\` WHERE entity_id = ? ORDER BY order_index ASC`,
                [this.entity_id]
            );

            this.fields = structureRows;

            return true;

        } catch (err) {
            throw new Error('Could not retrieve fields from database');
        } finally {
            if (dbConnection) {
                try {
                    await dbConnection.end();
                } catch (err) {
                    console.error('Failed to close database connection');
                }
            }
        }
    }

    removeField(key) {
        this.fields = this.fields.filter(field => field.key == key);
    }

    orderFields() {
        return this.fields.sort((a, b) => a.orderIndex - b.orderIndex);
    }

    async createEntity() {
        let dbConnection;
        try {
            dbConnection = await DatabaseConnector.getConnection();
            
            const [result, fields] = await dbConnection.query(
                `INSERT INTO entities (entity_key, entity_name) VALUES (?, ?)`,
                [this.entity_key, this.name]
            );

            if ( !result?.insertId ) {
                throw new Error(`Unable to obtain insert id for entity ${this.name}`);
            }

            this.entity_id = result.insertId;

            if ( this.fields.length > 0 ) {
                const fieldsSQL = this.fields.map((field) => {
                    return `(${this.entity_id}, '${field.key}', ${field.isQueryable}, '${field.fieldName}', '${field.type}', ${field.isRequired}, '${field.defaultValue}', ${field.orderIndex})`;
                });

                const fieldValues = fieldsSQL.join(',');

                await dbConnection.query(
                    `INSERT INTO entities_structure
                    (entity_id, unique_meta_key, is_queryable, field_name, field_type, is_required, default_value, order_index )
                    VALUES ${fieldValues}`
                );
            }

            await dbConnection.query(
                    `CREATE TABLE m_entity_${this.entity_key} (
                       ID INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
                       title TEXT,
                       author INT,
                       status ENUM('published', 'archived', 'draft') NOT NULL DEFAULT 'draft',
                       last_updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                       published_on DATETIME,
                       created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                       meta_json JSON
                    )`
            );

            await dbConnection.query(
                `CREATE TABLE m_entity_${this.entity_key}_meta (
                    ID INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
                    ${this.entity_key}_id INT NOT NULL,
                    meta_key VARCHAR(255),
                    meta_value TEXT,
                    FOREIGN KEY (${this.entity_key}_id) 
                    REFERENCES m_entity_${this.entity_key}(ID) 
                    ON DELETE CASCADE
                )`
            )

        } catch (err) {
            throw new Error('Failed to create Entity: ' + err.message);
        } finally {
            if (dbConnection) {
                try {
                    await dbConnection.end();
                } catch (err) {
                    console.error('Failed to close connection to database');
                }
            }
        }
    }

    updateEntity() {

    }
}

module.exports = Entity;