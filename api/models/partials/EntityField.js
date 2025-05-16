const DatabaseConnector = require("../../services/DatabaseConnector");
const { validateFieldConfig } = require( "../../util/validation");
const { mapMySQLError } = require( "../../util/helpers");
const { AppError, ConflictError } = require( "../utility/Errors");
const { fieldTypeToMySQLType, fieldTypeToMySQLCastType } = require("../../util/constants");
const DatabaseConfigManager = require("../../services/DatabaseConfigManager");

class Field {
    constructor(config) {
        this.field_name = config.field_name;
        this.field_type = config.field_type;
        this.is_db_column = !!config.is_db_column;
        this.is_queryable = !!config.is_queryable;
        this.is_required = !!config.is_required;
        this.default_value = config.default_value || null;
        this.order_index = config.order_index;
        this.field_config = config.field_config;
        this.old_field_location = config.old_field_location || null;
        this.old_queryable_value = config.old_queryable_value || null;
    }

    /**
     * Factory function for creating fields
     * @async
     * @function
     * @param {Object} config - configuration for setting up new field 
     * @returns {Promise<Field>} - new field
     * @throws {ValidationError|AppError} - error if validation of schema fails
     */
    static async create(config) {
        if (Object.hasOwn(config, 'field_config') && Object.hasOwn(config, 'field_type')) {
            try {
                await Field.checkFieldConfig(config.field_config, config.field_type);
            } catch (err) {
                throw err;
            }
            return new Field(config);
        }
    }

    /**
     * Updates database fields and makes sure all updates are valid before sync with the entity
     * @async
     * @function
     * @param {Object} config - configuration of the new version of the field
     * @param {string} entity_key - key relating to the entity that this field belong to
     * @throws {ValidationError|ConflictError|AppError}
     */
    async update(config, entity_key) {
        const changed = (key) => Object.hasOwn(config, key);

        // Handle change between DB column and meta field
        if (changed('is_db_column') && config.is_db_column !== this.is_db_column) {
            this.old_field_location = this.is_db_column ? 'db' : 'meta';
            this.is_db_column = config.is_db_column;
        }

        if (!this.is_db_column) {
            if (changed('field_type')) this.field_type = config.field_type;
            if (changed('is_required')) this.is_required = !!config.is_required;
            if (changed('default_value')) this.default_value = config.default_value;
        } else {
            if (changed('is_db_column') && !config.is_db_column) {
                if (changed('field_type')) this.field_type = config.field_type;
                if (changed('is_required')) this.is_required = !!config.is_required;
                if (changed('default_value')) this.default_value = config.default_value;
            } else {
                // Type change
                if (changed('field_type') && config.field_type !== this.field_type) {
                    try {
                        const canConvert = await this.checkTypeConversionPossible(this.field_name, config.field_type, entity_key);
                        if (!canConvert) {
                            const mysql_type = fieldTypeToMySQLType[config.field_type];
                            throw new ConflictError(`Cannot convert column "${this.field_name}" to type "${mysql_type}": some values are incompatible with this type.`);
                        }
                    } catch (err) {
                        if (err instanceof AppError){
                            throw err;
                        }
            
                        const {message, status_code} = mapMySQLError(err);
                        
                        throw new AppError(message, status_code);
                    }
                    this.field_type = config.field_type;
                }

                // Required flag change
                if (changed('is_required') && !!config.is_required !== this.is_required) {
                    if (config.is_required) {
                        try {
                            const hasNoNulls = await this.#checkColumnForNull(this.field_name, entity_key);
                            if (!hasNoNulls) {
                                throw new ConflictError(`Cannot convert column "${this.field_name}" to a required field: some values are set to null.`);
                            }
                        } catch (err) {
                            if (err instanceof AppError){
                                throw err;
                            }
                
                            const {message, status_code} = mapMySQLError(err);
                            
                            throw new AppError(message, status_code);
                        }
                    }
                    this.is_required = !!config.is_required;
                }

                // Default value validation
                if (changed('default_value')) {
                    const targetType = changed('field_type') ? config.field_type : this.field_type;

                    if (config.default_value !== null) {
                        try {
                            const isValid = await this.#isDefaultCompatible(config.default_value, targetType);
                            if (!isValid) {
                                const mysql_type = fieldTypeToMySQLType[targetType];
                                throw new ConflictError(`Cannot set default for "${this.field_name}": value is not compatible with type "${mysql_type}".`);
                            }
                        } catch (err) {
                            if (err instanceof AppError){
                                throw err;
                            }
                
                            const {message, status_code} = mapMySQLError(err);
                            
                            throw new AppError(message, status_code);
                        }
                    }
                    
                    this.default_value = config.default_value;
                }
            }
        }

        // Shared properties
        if (changed('is_queryable')) {
            if (this.is_queryable !== !!config.is_queryable) {
                this.old_queryable_value = this.is_queryable;
                this.is_queryable = !!config.is_queryable;
            }
        }
        if (changed('order_index')) this.order_index = config.order_index;

        // Field config
        if (changed('field_config')) {
            try {
                await Field.checkFieldConfig(config.field_config, this.field_type);
            } catch (err) {
                if (err instanceof AppError){
                    throw err;
                }

                const {message, status_code} = mapMySQLError(err);
                
                throw new AppError(message, status_code);
            }
            this.field_config = config.field_config;
        }
    }

    /**
     * checks field schema matches field type
     * @async
     * @function
     * @param {Object} config - configuration for field type 
     * @param {*} field_type - field_type for schema check to see if field config is valid
     * @returns {Promise<boolean>} whether field config matches schema for field type
     * @throws {ValidationError|AppError} - throws validation error if validation of schema failed. Throws App Error if sql actions have failed. 
     */
    static async checkFieldConfig(config, field_type) {
        try {
            const field_schema = await DatabaseConnector.withConnection( async (db) => {
                const [field_config] = await db.query(`SELECT config FROM field_types WHERE name = ?`, field_type);
                return field_config[0].config;
            })

            return validateFieldConfig(field_schema, config);
        } catch (err) {
            if (err instanceof AppError){
                throw err;
            }

            const {message, status_code} = mapMySQLError(err);
            
            throw new AppError(message, status_code);
        }
    }

    /**
     * Gets query string to be used to check for type cooercion 
     * @param {{table: string, column: string, source_type: string, target_type: string}} config - the configuration for the query
     * @returns {string|null} the query string for that type cooercion check or null if type cooercion not necessary
     */
    #getValidationQuery ( { table, column, source_type, target_type } ) {
        source_type = source_type.toLowerCase();
        target_type = target_type.toLowerCase();

        let target_length = null;
        const matches = target_type.match(/\((\d+)\)/);
        if (matches && matches[1]) {
            target_length = parseInt(matches[1], 10);
        }
        
        if (source_type.match(/varchar|text/) && target_type.match(/int|bigint/)) {
            return `SELECT * FROM \`${table}\` WHERE CAST(${column} AS SIGNED) IS NULL AND ${column} IS NOT NULL LIMIT 5`;
        }
        
        if (source_type.match(/varchar|text/) && target_type.match(/decimal|float|double/)) {
            return `SELECT * FROM \`${table}\` WHERE CAST(${column} AS DECIMAL(65,30)) IS NULL AND ${column} IS NOT NULL LIMIT 5`;
        }
        
        if (source_type === 'varchar' && target_type.startsWith('varchar') && target_length) {
            return `SELECT * FROM \`${table}\` WHERE CHAR_LENGTH(${column}) > ${target_length} LIMIT 5`;
        }
        
        if (source_type === 'bigint' && target_type === 'int') {
            return `SELECT * FROM \`${table}\` WHERE ${column} > 2147483647 OR ${column} < -2147483648 LIMIT 5`;
        }
        
        if (source_type === 'int' && target_type === 'tinyint') {
            return `SELECT * FROM \`${table}\` WHERE ${column} > 127 OR ${column} < -128 LIMIT 5`;
        }
        
        if (source_type === 'float' && target_type.match(/int|tinyint|smallint|bigint/)) {
            return `SELECT * FROM \`${table}\` WHERE MOD(${column}, 1) != 0 LIMIT 5`;
        }
        
        if (source_type === 'datetime' && target_type === 'date') {
            return `SELECT * FROM \`${table}\` WHERE ${column} IS NOT NULL LIMIT 5 -- Potential data loss (time component)`;
        }
        
        if (source_type === 'json' && target_type.match(/text|varchar/)) {
            return `SELECT * FROM \`${table}\` WHERE JSON_VALID(${column}) = 0 LIMIT 5`;
        }
        
        return null;
    }

    /**
     * Checks to see if current type of column can be changed to new type passed in
     * @async
     * @function
     * @param {string} column_name - column that must be checked for type cooercion
     * @param {string} new_field_type - field type to check if column can be changed to
     * @param {string} entity_key - entity key for table in question 
     * @returns {Promise<boolean>} whether type cooercion is possible
     * @throws {ConflictError|AppError} - if database query fails or other mysql error
     */
    async checkTypeConversionPossible(column_name, new_field_type, entity_key) {
        const mysql_field_type = fieldTypeToMySQLType[new_field_type];
        const table = `m_entity_${entity_key}`;

        return await DatabaseConnector.withConnection(async db => {
            try {
                const db_config = await DatabaseConfigManager.getConfig();

                const [rows] = await db.execute(
                    `SELECT DATA_TYPE as source_type, CHARACTER_MAXIMUM_LENGTH
                     FROM INFORMATION_SCHEMA.COLUMNS
                     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
                    [db_config.database, table, column_name]
                  );

                if (rows.length === 0) throw new AppError(`Column ${column_name} not found in ${table}`, 404);

                const { source_type } = rows[0];

                const query = this.#getValidationQuery({
                    table,
                    column: column_name, 
                    source_type,
                    target_type: mysql_field_type
                });

                if (!query) {
                    return true;
                }

                const [invalidRows] = await db.query(query);

                if (invalidRows.length === 0) {
                    return true;
                } else {
                    throw new ConflictError(`Potential data conversion issues converting ${column_name} from ${source_type} to ${mysql_field_type}`);
                }


            } catch (err) {
                if (err instanceof AppError){
                    throw err;
                }
    
                const {message, status_code} = mapMySQLError(err);
                
                throw new AppError(message, status_code);
            }
        });
    }

    /**
     * Checks if column has any null values
     * @param {string} column_name - column to check
     * @param {string} entity_key - entity table to check
     * @returns {Promise<boolean>} if column has null values or not
     * @throws {AppError} error if mysql query fails
     */
    async #checkColumnForNull(column_name, entity_key) {
        return await DatabaseConnector.withConnection(async db => {
             try {
                const [rows] = await db.query(
                    `SELECT *
                    FROM \`m_entity_${entity_key}\`
                    WHERE \`${column_name}\` IS NULL;
                    `
                );

                return rows.length !== 0;

            } catch (err) {
                if (err instanceof AppError){
                    throw err;
                }
    
                const {message, status_code} = mapMySQLError(err);
                
                throw new AppError(message, status_code);
            }
        });
    }

    async #isDefaultCompatible(default_value, field_type) {
        if ( field_type == 'checkbox' || field_type == 'switch' ) {
            if ( (default_value >= 0 && default_value < 2) || default_value === null ) {
                return true;
            }
            return false;
        }  

        const mysql_field_type = fieldTypeToMySQLCastType[field_type];

        return await DatabaseConnector.withConnection(async db => {
            const [rows] = await db.query(`SELECT CAST(? AS ${mysql_field_type}) AS result`, [default_value]);
            return rows[0].result !== null;
        })
    }


    toJSON( withOldValues = false ) {
        const return_value = {
            field_name: this.field_name,
            field_type: this.field_type,
            is_db_column: this.is_db_column,
            is_queryable: this.is_queryable,
            is_required: this.is_required,
            default_value: this.default_value,
            order_index: this.order_index,
            field_config: this.field_config,
        };

        if (withOldValues) {
            return_value.old_field_location = this.old_field_location;
            return_value.old_queryable_value = this.old_queryable_value;
        }

        return return_value;
    }
}

module.exports = Field;