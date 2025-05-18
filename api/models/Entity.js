// ==================================================
// =============== Module Dependencies ==============
// ==================================================

const DatabaseConnector = require ('../services/DatabaseConnector');
const Field = require('./partials/EntityField');
const { toSnakeCase, mapMySQLError } = require('../util/helpers');
const { NotFoundError, AppError, ConflictError } = require('./utility/Errors');
const { fieldTypeToMySQLType } = require('../util/constants');
const logger = require('./utility/Logger');

// ==================================================
// ================= Entity Class ===================
// ==================================================
class Entity {
    // ==================================================
    // =============== Class Initialization =============
    // ==================================================
    constructor( name, key = null, entity_id = null, fields = [] ) {
        this.name = name;
        this.entity_key = key;
        this.entity_id = entity_id;
        this.fields = fields;
    }

    // ==================================================
    // ========== Getter and Setter Methods  ============
    // ==================================================
    setName( newName ) {
        this.name = newName;
    }

    get table_name() {
    return `m_entity_${this.entity_key}`;
}

    get meta_table_name() {
        return `m_entity_${this.entity_key}_meta`;
    }

    // ==================================================
    // ============ Field Altering Methods  =============
    // ==================================================
    async addFields( fields ) {
        try {
            for (const field of fields) {
                await this.addField(field);
            }
        } catch (err) {
            throw err;
        }
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
            await field_to_update.update(new_field_info, this.entity_key);
            const index = this.fields.findIndex(f => f.field_name === field_to_update.field_name);
            this.fields[index] = field_to_update;
        } catch (err) {
            throw err;
        }
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

    clearFields() {
        this.fields = [];
    }

    orderFields() {
        this.fields.sort((a, b) => a.order_index - b.order_index);
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

    // ==================================================
    // =========== Entity Synchronization ===============
    // ==================================================
    async sync() {
        await DatabaseConnector.withConnection(async (db) => {
            try {
                // Update entity name
                await db.query(
                    `UPDATE entities SET entity_name = ? WHERE ID = ?`,
                    [this.name, this.entity_id]
                );

                const database_fields = await this.retrieveFields();

                const fields_to_insert = this.fields.filter(
                    newField => !database_fields.some(existing => existing.field_name === newField.field_name)
                );
                const fields_to_update = this.fields.filter(
                    newField => database_fields.some(existing => existing.field_name === newField.field_name)
                );
                const fields_to_delete = database_fields.filter(
                    existing => !this.fields.some(newField => newField.field_name === existing.field_name)
                );

                await this.#applyFieldChangesToDB(db, fields_to_insert, fields_to_update);
                await this.#updateStructureTable(db, fields_to_insert, fields_to_update);
                await this.#cleanupRemovedFields(db, fields_to_delete);

            } catch (err) {

                if (err instanceof AppError) {
                    throw err;
                }

                const { message, status_code } = mapMySQLError(err);
                throw new AppError(message, status_code);
            }
        });
    }

    // ==================================================
    // ============= Public Static Methods  =============
    // ==================================================
    static async create( name, entity_key = null ) {
        const final_key = entity_key || toSnakeCase(name);

        let existing_entity;

        try {
            existing_entity = await Entity.getEntityData(final_key);

            if ( existing_entity ) {
                throw new ConflictError('Entity with that key already exists');
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
            existing_entity = await Entity.getEntityData(entity_key);

            return existing_entity || null 

        } catch (err) {
            throw err;
        }
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

    static async getEntityData( entity_key ) {
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

    // ==================================================
    // =========== Private Instance Methods =============
    // ==================================================
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
                        `CREATE TABLE ${this.table_name} (
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
                    `CREATE TABLE ${this.meta_table_name} (
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

    async #syncQueryableFields(db, field) {
        if (field.old_queryable_value !== null && !field.is_db_column) {
            if (field.old_queryable_value === true && !field.is_queryable) {
                // Was queryable, now unqueryable → delete from meta table
                await db.query(
                    `DELETE FROM ${this.meta_table_name} WHERE meta_key = ?`,
                    [field.field_name]
                );
            } else if (field.old_queryable_value === false && field.is_queryable) {
                // Was unqueryable, now queryable → copy from meta_json to meta table
                await db.query(
                    `INSERT INTO ${this.meta_table_name} (${this.entity_key}_id, meta_key, meta_value)
                    SELECT ID, ?, JSON_UNQUOTE(JSON_EXTRACT(meta_json, '$.${field.field_name}'))
                    FROM ${this.table_name}
                    WHERE JSON_CONTAINS_PATH(meta_json, 'one', '$.${field.field_name}')`,
                    [field.field_name]
                );
            }
        }
    }

    async #moveMetaToColumn (db, field) {
        // moving from meta to database column
        const column_type = fieldTypeToMySQLType[field.field_type]; 
        const column_required = field.is_required ? 'NOT NULL' : 'NULL';
        const default_value = field.default_value !== null
            ? `DEFAULT ${db.escape(field.default_value)}`
            : '';

        // add database column
        await db.query(
            `ALTER TABLE \`${this.table_name}\` ADD COLUMN \`${field.field_name}\` ${column_type} ${column_required} ${default_value}`
        );

        if (field.is_queryable){
            // move meta values from meta table to database column
            await db.query(
                `UPDATE ${this.table_name} AS e
                JOIN ${this.meta_table_name} AS m
                ON e.ID = m.${this.entity_key}_id AND m.meta_key = ?
                SET e.\`${field.field_name}\` = m.meta_value`,
                [field.field_name]
            );
        } else {
            // move meta values from meta_json to column
            await db.query(
                `UPDATE ${this.table_name}
                SET \`${field.field_name}\` = JSON_UNQUOTE(JSON_EXTRACT(meta_json, '$.${field.field_name}'))
                WHERE JSON_CONTAINS_PATH(meta_json, 'one', '$.${field.field_name}')`
            );
        }

        // delete entries from meta table
        await db.query(
            `DELETE FROM ${this.meta_table_name} WHERE meta_key = ?`,
            [field.field_name]
        );

        // remove meta data from meta_json
        await db.query(
            `UPDATE ${this.table_name}
            SET meta_json = JSON_REMOVE(meta_json, '$.${field.field_name}')
            WHERE JSON_CONTAINS_PATH(meta_json, 'one', '$.${field.field_name}');`
        );
    }

    async #moveColumnToMeta (db, field) {
        if (field.is_queryable) { 
            // move from db column to meta field
            await db.query(
                `INSERT INTO ${this.meta_table_name} (${this.entity_key}_id, meta_key, meta_value)
                SELECT ID, ?, \`${field.field_name}\` FROM ${this.table_name}`,
                [field.field_name]
            );
        }

        // set values for meta_json
        await db.query(
            `UPDATE ${this.table_name}
            SET meta_json = JSON_SET(meta_json, '$.${field.field_name}', \`${field.field_name}\`)
            WHERE \`${field.field_name}\` IS NOT NULL`
        );

        // drop database column
        await db.query(
            `ALTER TABLE \`${this.table_name}\` DROP COLUMN \`${field.field_name}\``
        );
    }

    async #insertNewEntityColumn (db, field) {
        const column_type = fieldTypeToMySQLType[field.field_type]; 
        const column_required = field.is_required ? 'NOT NULL' : 'NULL';
        const default_value = field.default_value !== null
            ? `DEFAULT ${db.escape(field.default_value)}`
            : '';

        await db.query(
            `ALTER TABLE \`${this.table_name}\` ADD COLUMN \`${field.field_name}\` ${column_type} ${column_required} ${default_value}`
        );
    }

    async #modifyColumnStructure(db, field) {
        const column_type = fieldTypeToMySQLType[field.field_type]; 
        const column_required = field.is_required ? 'NOT NULL' : 'NULL';
        const default_value = field.default_value !== null
            ? `DEFAULT ${db.escape(field.default_value)}`
            : '';

        await db.query(
            `ALTER TABLE \`${this.table_name}\` MODIFY COLUMN \`${field.field_name}\` ${column_type} ${column_required} ${default_value}`
        );
    }

    async #applyFieldChangesToDB(db, fields_to_insert, fields_to_update) {
        // === INSERT NEW FIELDS (DB columns only) ===
        for (const field of fields_to_insert) {
            if (field.is_db_column) {
                await this.#insertNewEntityColumn(db, field);
            }
        }

        // === FIELD UPDATES / MIGRATIONS ===
        for (const field of fields_to_update) {
            await this.#syncQueryableFields(db, field);

            if (!field.is_db_column && field.old_field_location === 'db') {

                await this.#moveColumnToMeta(db, field);

            } else if (field.is_db_column && field.old_field_location === 'meta') {

                await this.#moveMetaToColumn(db, field);

            } else if (field.is_db_column && field.old_field_location === null) {

                await this.#modifyColumnStructure(db, field)

            }
        }
    }

    async #updateStructureTable(db, fields_to_insert, fields_to_update) {
        let results;

        // === INSERT NEW STRUCTURE ENTRIES ===
        results = await Promise.allSettled(fields_to_insert.map((field) =>
            db.query(
                `INSERT INTO entities_structure 
                (entity_id, field_name, field_type, is_required, is_db_column, is_queryable, default_value, order_index, field_config) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    this.entity_id,
                    field.field_name,
                    field.field_type,
                    field.is_required,
                    field.is_db_column,
                    field.is_queryable,
                    field.default_value,
                    field.order_index,
                    JSON.stringify(field.field_config)
                ]
            )
        ));

        results.forEach(r => {
            if (r.status === 'rejected') throw new ConflictError(r.reason);
        });

        // === UPDATE EXISTING STRUCTURE ENTRIES ===
        results = await Promise.allSettled(fields_to_update.map((field) =>
            db.query(
                `UPDATE entities_structure 
                SET field_type = ?, is_required = ?, is_db_column = ?, is_queryable = ?, default_value = ?, order_index = ?, field_config = ?
                WHERE entity_id = ? AND field_name = ?`,
                [
                    field.field_type,
                    field.is_required,
                    field.is_db_column,
                    field.is_queryable,
                    field.default_value,
                    field.order_index,
                    JSON.stringify(field.field_config),
                    this.entity_id,
                    field.field_name
                ]
            )
        ));

        results.forEach(r => {
            if (r.status === 'rejected') throw new ConflictError(r.reason);
        });
    }

    async #cleanupRemovedFields(db, fields_to_delete) {
        for (const field of fields_to_delete) {
            if (field.is_db_column) {
                await db.query(
                    `ALTER TABLE \`${this.table_name}\` DROP COLUMN \`${field.field_name}\``
                );
            } else {
                await db.query(
                    `DELETE FROM ${this.meta_table_name} WHERE meta_key = ?`,
                    [field.field_name]
                );
            }
        }

        // === BATCH JSON_REMOVE from meta_json ===
        const json_paths = fields_to_delete.map(f => `'$.${f.field_name}'`).join(', ');
        if (json_paths.length > 0) {
            await db.query(
                `UPDATE ${this.table_name}
                SET meta_json = JSON_REMOVE(meta_json, ${json_paths})
                WHERE JSON_CONTAINS_PATH(meta_json, 'one', ${json_paths});`
            );
        }

        // === DELETE FROM STRUCTURE TABLE ===
        const results = await Promise.allSettled(fields_to_delete.map((field) =>
            db.query(
                `DELETE FROM entities_structure WHERE entity_id = ? AND field_name = ?`,
                [this.entity_id, field.field_name]
            )
        ));
        results.forEach(r => {
            if (r.status === 'rejected') throw new ConflictError(r.reason);
        });
    }

    toJSON() {
        return {
            id: this.entity_id,
            key: this.entity_key,
            name: this.name,
            fields: this.fields.map(field => field.toJSON())
        };
    }
}

module.exports = Entity;