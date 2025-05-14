const DatabaseConnector = require ('../services/DatabaseConnector');
const Field = require('./partials/EntityField');
const { toSnakeCase, mapMySQLError } = require('../util/helpers');
const { NotFoundError, AppError, ConflictError } = require('./utility/Errors');
const { fieldTypeToMySQLType } = require('../util/constants');

class Entity {

    constructor( name, key = null, entity_id = null, fields = [] ) {
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

            if ( existing_entity ) {
                throw new NotFoundError('Entity with that key already exists');
            }

            const entity = new Entity( name, final_key );

            await entity.#create();

            return entity;

        } catch (err) {
            throw err
        }
    }

    static async getExistingEntity( entity_key ) {
        let existing_entity;

        try {
            existing_entity = await Entity.#getEntityData(entity_key);

            return existing_entity || null 

        } catch (err) {
            throw err;
        }
    }

    static async #getEntityData( entity_key ) {
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
                if (err instanceof AppError) {
                    throw err;
                }
                const {message, status_code} = mapMySQLError(err);

                throw new AppError(message, status_code);
            } 
        })
    }

    static async getAll () {
        return await DatabaseConnector.withConnection(async (db) => {
            try {
                const [entities] = await db.query('SELECT * FROM entities');

                const [fields] = await db.query('SELECT * FROM entities_structure');

                const entity_groups = await entities.map(async entity => {
                    const structure = await Promise.all( fields.filter(field => field.entity_id === entity.ID)
                    .map((field) => Field.create(field)));
                    return {
                        ...entity,
                        fields: structure
                    };
                });
            
                return entity_groups;
            } catch (err) {
                const {message, status_code} = mapMySQLError(err)
                throw new AppError( message, status_code );
            }
        })
    }

    setName( newName ) {
        this.name = newName;
    }

    async addField( config ) {
        try {
            const newField = await Field.create(config);
        
            // check if field already exists
            if (this.fields.find(field => field.field_name === newField.field_name)) {
                throw new ConflictError(`Field with name ${newField.field_name} already exists`);
            }
            
            // add new field into array
            this.fields.push(newField);

        } catch (err) {
            throw err;
        }
    }

    async addFields( fields ) {
        try {
            for (const field of fields) {
                await this.addField(field);
            }
        } catch (err) {
            throw err;
        }
    }

    async retrieveFields() {
        return await DatabaseConnector.withConnection(async (db) => {
            try {
                const [structure] = await db.query(
                    `SELECT * FROM \`entities_structure\` WHERE entity_id = ? ORDER BY order_index ASC`,
                    [this.entity_id]
                );

                const fields = await Promise.all(structure.map((field) => Field.create(field)));
    
                return fields;

            } catch (err) {
                const {message, status_code} = mapMySQLError(err);
                throw new AppError(message, status_code);
            }
        })
    }

    async refreshFields() {
        await DatabaseConnector.withConnection(async (db) => {
            try {
                if (!this.entity_id) {
                    const [entity_rows] = await db.query(
                        `SELECT * FROM \`entities\` WHERE entity_key = ? LIMIT 1`,
                        [this.entity_key]
                    );
        
                    if (entity_rows.length === 0) {
                        throw new NotFoundError('Entity not found');
                    }
    
                    this.entity_id = entity_rows[0].ID;
                }
    
                this.fields = await this.retrieveFields();

            } catch (err) {
                if ( err instanceof AppError) {
                    throw err
                }

                const {message, status_code} = mapMySQLError(err);

                throw new AppError(message, status_code);
            }
        })
    }

    removeFields(fields) {
        try{
            for (const field_name of fields) {
                this.removeField(field_name);
            }
        } catch (err){
            throw err;
        }
    }

    removeField(field_name) {
        const starting_length = this.fields.length;
        this.fields = this.fields.filter(field => field.field_name != field_name);
        if (starting_length === this.fields.length) {
            throw new NotFoundError('Entity field does not exist');
        }
    }

    async updateFields( fields ) {
        try {
            for (const field of fields) {
                await this.updateField(field);
            }
        } catch (err) {
            throw err;
        }
    }

    async updateField( new_field_info ) {
        try{
            const field_to_update = this.fields.find(field => field.field_name == new_field_info.field_name);
            await field_to_update.update(new_field_info);
            this.removeField(field_to_update.field_name);
            this.addField(field_to_update.toJSON());
        } catch (err) {
            throw err;
        }
    }

    clearFields() {
        this.fields = [];
    }

    orderFields() {
        return this.fields.sort((a, b) => a.order_index - b.order_index);
    }

    static async getMeta( entity_key ) {
        if (!key) {
            return await DatabaseConnector( db => {
                db.query(`SELECT meta_json from m_entity_${entity_key} WHERE `);
            });
        }
    } 

    async #create() {
        await DatabaseConnector.withConnection(async (db) => {
            try {
                const [result] = await db.query(
                    `INSERT INTO entities (entity_key, entity_name) VALUES (?, ?)`,
                    [this.entity_key, this.name]
                );
    
                if ( !result?.insertId ) {
                    throw new AppError(`Entity was not inserted`, 500);
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
                if (err instanceof AppError){
                    throw err;
                }
                const {message, status_code} = mapMySQLError(err);

                throw new AppError(message, status_code);
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
                    if (field.is_db_column) {
                        const column_type = fieldTypeToMySQLType[field.field_type]; 
                        const column_required = field.is_required ? 'NULL ' : 'NOT NULL ';
                        const default_value = field.default_value !== null ? `DEFAULT ${db.escape(default_value)}` : '';
                        await db.query(`ALTER TABLE \`m_entity_${this.entity_key}\` ADD COLUMN \`${field.field_name}\` ${column_type} ${column_required} ${default_value}`);
                    }
                    await db.query(`INSERT INTO entities_structure (entity_id, field_name, display_label, field_type, is_required, is_db_column, is_queryable, default_value, order_index, field_config ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
                        [this.entity_id, field.field_name, field.display_label, field.field_type, field.is_required, field.is_db_column, field.is_queryable, field.default_value, field.order_index, JSON.stringify(field.field_config)]
                    );
                }
            
                // Update existing
                for (const field of fields_to_update) {

                    await db.query(`UPDATE entities_structure SET display_label = ?, field_type = ?, is_required = ?, is_db_column = ?, is_queryable = ?, default_value = ?, order_index = ?, 'field_config = ? WHERE entity_id = ? AND field_name = ?`, 
                        [field.display_label, field.field_type, field.is_required, field.is_db_column, field.is_queryable, field.default_value, field.order_index, this.entity_id, field.field_name, JSON.stringify(field.field_config)]);
                }
            
                // Delete removed
                for (const field of fields_to_delete) {
                    if (field.is_db_column) {
                        await db.query(`ALTER TABLE \`m_entity_${this.entity_key}\` DROP COLUMN \`${field.field_name}\``);
                    } else {
                        await db.query(`DELETE FROM m_entity_${this.entity_key}_meta WHERE meta_key = ?`, [field.field_name]);
                        
                        const json_path = `$.${field.field_name}`;
                        await db.query(
                            `UPDATE m_entity_${entity_key}
                             SET meta_json = JSON_REMOVE(meta_json, '${json_path}')
                             WHERE JSON_CONTAINS_PATH(meta_json, 'one', '${json_path}');`
                        )
                    }
                    await db.query(`DELETE FROM entities_structure WHERE entity_id = ? AND field_name = ?`, [this.entity_id, field.field_name]);
                }
            } catch (err) {
                if (err instanceof AppError) {
                    throw err;
                }

                console.log(err);

                const {message, status_code} = mapMySQLError(err);

                throw new AppError(message, status_code);
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