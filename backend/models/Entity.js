const DatabaseConnector = require ('../services/DatabaseConnector');
const Field = require('./partials/EntityField');
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

    static async create( name, entity_key = null ) {
        const final_key = entity_key || toSnakeCase(name);

        let existing_entity;
        try {
            existing_entity = await Entity.#getEntityData(final_key);
        } catch (err) {
            throw err;
        }

        if ( existing_entity ) {
            throw new Error('Entity with that key already exists');
        }

        try {
            const entity = new Entity( name, final_key );

            await entity.#create();

            return entity;
        } catch (err) {
            throw err;
        }
    }

    static async getExistingEntity( entity_key ) {
        let existing_entity;
        try {
            existing_entity = await Entity.#getEntityData(entity_key);
        } catch (err) {
            throw err;
        }

        if ( existing_entity ) {
            try {
                return existing_entity
            }
            catch (err) {
                throw err;
            }
        } else {
            return null;
        }
    }

    static async #getEntityData(entity_key) {
        return await DatabaseConnector.withConnection(async (db) => {
            try {
                const [entity_rows] = await db.query(
                    `SELECT * FROM \`entities\` WHERE entity_key = ? LIMIT 1`,
                    [entity_key]
                );
    
                if (entity_rows.length === 0) return null;
    
                const entity_info = entity_rows[0];

                const entity = new Entity(
                    entity_info.entity_name,
                    entity_info.entity_key,
                    entity_info.ID
                );
    
                await entity.refreshFields();
    
                return entity;

            } catch (err) {
                throw new Error('Failed to load entity data: ' + err.message);
            } 
        })
    }

    static async getAll () {
        return await DatabaseConnector.withConnection(async (db) => {
            try {
                const [entities] = await db.query('SELECT * FROM entities');

                const [fields] = await db.query('SELECT * FROM entities_structure');

                const entity_groups = entities.map(entity => {
                    const structure = fields.filter(field => field.entity_id === entity.ID)
                    .map(field => new Field(field));
                    return {
                        ...entity,
                        fields: structure
                    };
                });
            
                return entity_groups;
            } catch (err) {
                throw new Error( 'Unable to retrieve all entities: ' + err.message );
            }
        })
    }

    setName( newName ) {
        this.name = newName;
    }

    addField( config ) {
        if ( typeof config !== "object" ){
            throw new Error("Configuration for field properties malformed");
        }
        
        const newField = new Field(config);

        // check if field already exists
        if (this.fields.find(field => field.field_name === newField.field_name)) {
            throw new Error(`Field with name "${newField.field_name}" already exists`);
        }
        
        // add new field into array
        this.fields.push(newField);
    }

    addFields( fields ) {
        if ( Array.isArray(fields) ) {
            fields.forEach((field) => {
                this.addField(field);
            })
        } else {
            throw new Error('Malformed request body');
        }
    }

    async retrieveFields() {
        return await DatabaseConnector.withConnection(async (db) => {
            try {
                const [structure] = await db.query(
                    `SELECT * FROM \`entities_structure\` WHERE entity_id = ? ORDER BY order_index ASC`,
                    [this.entity_id]
                );

                const fields = structure.map(field => new Field(field));
    
                return fields;

            } catch (err) {
                throw new Error('Could not retrieve fields for entity');
            }
        })
    }

    async refreshFields() {
        return await DatabaseConnector.withConnection(async (db) => {
            try {
                if (!this.entity_id) {
                    const [entity_rows] = await db.query(
                        `SELECT * FROM \`entities\` WHERE entity_key = ? LIMIT 1`,
                        [this.entity_key]
                    );
        
                    if (entity_rows.length === 0) {
                        return false;
                    }
    
                    this.entity_id = entity_rows[0].ID;
    
                }
    
                this.fields = await this.retrieveFields();
    
                return true;
            } catch (err) {
                throw new Error('Could not retrieve fields from database');
            }
        })
    }

    removeFields(fields) {
        if ( Array.isArray(fields) ){
            fields.forEach((field_name) => {
                this.updateField(field_name);
            })
        } else {
            throw new Error('Malformed request body');
        }
    }

    removeField(field_name) {
        if ( typeof field_name !== "string" ) {
            throw new Error('Malformed request body');
        }
        const starting_length = this.fields.length;
        this.fields = this.fields.filter(field => field.field_name != field_name);
        if (starting_length === this.fields.length) {
            throw new Error('Could not find field_name in field list');
        }
    }

    updateFields( fields ) {
        if ( Array.isArray(fields) ){
            fields.forEach((field) => {
                this.updateField(field);
            })
        } else {
            throw new Error('Malformed request body');
        }
    }

    updateField( new_field_info ) {
        const field_to_update = this.fields.find(field => field.field_name == new_field_info.field_name);
        field_to_update.update(new_field_info);
        this.removeField(field_to_update.field_name);
        this.addField(field_to_update.toJSON());
    }

    clearFields() {
        this.fields = [];
    }

    orderFields() {
        return this.fields.sort((a, b) => a.order_index - b.order_index);
    }

    async #create() {
        await DatabaseConnector.withConnection(async (db) => {
            try {
                const [result] = await db.query(
                    `INSERT INTO entities (entity_key, entity_name) VALUES (?, ?)`,
                    [this.entity_key, this.name]
                );
    
                if ( !result?.insertId ) {
                    throw new Error(`Unable to obtain insert id for entity ${this.name}`);
                }
    
                this.entity_id = result.insertId;
    
                await db.query(
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
    
                await db.query(
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
            }
        })
    }

    async sync() {
        await DatabaseConnector.withConnection(async (db) => {
            try {
                await db.query(
                    `UPDATE entities SET entity_name = ? WHERE ID = ?`,
                    [this.name, this.entity_id]
                );
    
                const database_fields = await this.retrieveFields();
    
                const fields_to_insert = this.fields.filter(newField => !database_fields.some(existing => existing.field_name === newField.field_name));
                const fields_to_update = this.fields.filter(newField => database_fields.some(existing => existing.field_name === newField.field_name));
                const fields_to_delete = database_fields.filter(existing => !this.fields.some(newField => newField.field_name === existing.field_name));
    
                // Insert new
                for (const field of fields_to_insert) {
                    await db.query(`INSERT INTO entities_structure (entity_id, field_name, display_label, field_type, is_required, is_db_column, is_queryable, default_value, order_index ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
                        [this.entity_id, field.field_name, field.display_label, field.field_type, field.is_required, field.is_db_column, field.is_queryable, field.default_value, field.order_index]
                    );
                }
            
                // Update existing
                for (const field of fields_to_update) {
                    await db.query(`UPDATE entities_structure SET display_label = ?, field_type = ?, is_required = ?, is_db_column = ?, is_queryable = ?, default_value = ?, order_index = ? WHERE entity_id = ? AND field_name = ?`, 
                        [field.display_label, field.field_type, field.is_required, field.is_db_column, field.is_queryable, field.default_value, field.order_index, this.entity_id, field.field_name]);
                }
            
                // Delete removed
                for (const field of fields_to_delete) {
                    await db.query(`DELETE FROM entities_structure WHERE entity_id = ? AND field_name = ?`, [this.entity_id, field.field_name]);
                }
            } catch (err) {
                throw new Error('Could not update entity: ' + err.message);
            }
        })
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