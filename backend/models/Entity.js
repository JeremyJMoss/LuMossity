const DatabaseConnector = require ('../services/DatabaseConnector');
const {toSnakeCase} = require('../util/helpers');

class Entity {

    constructor( name, key = null, entity_id = null, fields = [] ) {
        if ( !name || typeof name !== 'string' ) {
            throw new Error( 'Entity must have a valid name' );
        }

        this.name = name;
        this.entity_key = key;
        this.entity_id = entity_id;
        this.fields = fields;
    }

    static async create( name, entity_key = null, fields = [] ) {
        const finalKey = entity_key || toSnakeCase(name);

        let existingData;
        try {
            existingData = await Entity.#getEntityData(finalKey);
        } catch (err) {
            throw err;
        }

        if ( existingData ) {
            throw new Error('Entity with that key already exists');
        }

        try {
            const entity = new Entity( name, finalKey );
            
            if (fields.length > 0) {
                fields.forEach((field) => {
                    entity.addField(field);
                })
            }

            await entity.#create();

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
        } else {
            return null;
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

            const [fields] = await dbConnection.query(
                `SELECT * FROM \`entities_structure\` WHERE entity_id = ? ORDER BY order_index ASC`,
                [entity.ID]
            );

            return {
                name: entity.entity_name,
                entity_key: entity.entity_key,
                entity_id: entity.ID,
                fields
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

    setName( newName ) {
        this.name = newName;
    }

    addField( config ) {
        if ( typeof config !== "object" ){
            throw new Error("Configuration for field properties malformed");
        }
        const requiredKeys = ['key', 'type', 'fieldName', 'orderIndex'];
        const missing = requiredKeys.filter( key => !config[key] );

        if (missing.length > 0) {
            throw new Error( `Missing required field properties: ${missing.join(', ')}` );
        }

        const {
            key, 
            type,
            fieldName,
            orderIndex,
            isRequired = false, 
            defaultValue = null,
            isQueryable = false
        } = config;

        // check if field already exists
        if (this.fields.find( field => field.key == key) ) {
            throw new Error(`Field with key "${key}" already exists`);
        }
        
        // add new field into array
        this.fields.push({
            unique_meta_key: key,
            field_name: fieldName,
            field_type: type,
            is_required: isRequired,
            default_value: defaultValue,
            is_queryable: isQueryable,
            order_index: orderIndex
        });
    }

    addFields( fields ) {
        if ( Array.isArray(fields) ){
            fields.forEach((field) => {
                this.addField(field);
            })
        } else {
            throw new Error('Fields is not an array of objects');
        }
    }

    async retrieveFields() {
        let dbConnection;
        try {
            dbConnection = await DatabaseConnector.getConnection();
            
            const [structureRows] = await dbConnection.query(
                `SELECT * FROM \`entities_structure\` WHERE entity_id = ? ORDER BY order_index ASC`,
                [this.entity_id]
            );

            return structureRows;

        } catch (err) {
            throw new Error('Could not retreive fields for entity');
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

            this.fields = await this.retrieveFields();

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
        this.fields = this.fields.filter(field => field.unique_meta_key == key);
    }

    clearFields() {
        this.fields = [];
    }

    orderFields() {
        return this.fields.sort((a, b) => a.order_index - b.order_index);
    }

    async #create() {
        let dbConnection;
        try {
            dbConnection = await DatabaseConnector.getConnection();
            
            const [result] = await dbConnection.query(
                `INSERT INTO entities (entity_key, entity_name) VALUES (?, ?)`,
                [this.entity_key, this.name]
            );

            if ( !result?.insertId ) {
                throw new Error(`Unable to obtain insert id for entity ${this.name}`);
            }

            this.entity_id = result.insertId;

            if ( this.fields.length > 0 ) {
                const fieldsSQL = this.fields.map((field) => {
                    return `(${this.entity_id}, '${field.unique_meta_key}', ${field.is_queryable}, '${field.field_name}', '${field.field_type}', ${field.is_required}, '${field.default_value}', ${field.order_index})`;
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

    async update() {
        let dbConnection;
        try {
            dbConnection = await DatabaseConnector.getConnection();
            
            await dbConnection.query(
                `UPDATE entities SET entity_name = ? WHERE ID = ?`,
                [this.name, this.entity_id]
            );

            const databaseFields = await this.retrieveFields();

            const fieldsToInsert = this.fields.filter(newField => !databaseFields.some(existing => existing.unique_meta_key === newField.unique_meta_key));
            const fieldsToUpdate = this.fields.filter(newField => databaseFields.some(existing => existing.unique_meta_key === newField.unique_meta_key));
            const fieldsToDelete = databaseFields.filter(existing => !this.fields.some(newField => newField.unique_meta_key === existing.unique_meta_key));
            
            // Insert new
            for (const field of fieldsToInsert) {
                await dbConnection.query(`INSERT INTO entities_structure (entity_id, unique_meta_key, field_name, field_type, is_required, is_queryable, default_value, order_index ) VALUES (?, ?, ?)`, 
                    [this.entity_id, field.unique_meta_key, field.field_name, field.field_type, field.is_required, field.is_queryable, field.default_value, field.order_index]
                );
            }
        
            // Update existing
            for (const field of fieldsToUpdate) {
                await dbConnection.query(`UPDATE entities_structure SET field_name = ?, field_type = ? WHERE entity_id = ? AND unique_meta_key = ?`, [field.field_name, field.field_type, this.entity_id, field.unique_meta_key]);
            }
        
            // Delete removed
            for (const field of fieldsToDelete) {
                await dbConnection.query(`DELETE FROM entities_structure WHERE entity_id = ? AND unique_meta_key = ?`, [this.entity_id, field.unique_meta_key]);
            }        

        } catch (err) {
            throw new Error( 'Could not update Entity: ' + err.message );
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

    toJSON() {
        return {
            id: this.entity_id,
            key: this.entity_key,
            name: this.name,
            fields: this.fields
        };
    }
}

module.exports = Entity;