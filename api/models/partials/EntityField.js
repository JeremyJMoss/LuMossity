const DatabaseConnector = require("../../services/DatabaseConnector");
const { validateFieldConfig } = require( "../../util/validation");
const { mapMySQLError } = require( "../../util/helpers");
const { AppError, ConflictError } = require( "../utility/Errors");
const { fieldTypeToMySQLType } = require("../../util/constants");

class Field {
    constructor(config) {
        this.field_name = config.field_name;
        this.display_label = config.display_label || null;
        this.field_type = config.field_type;
        this.is_db_column = !!config.is_db_column;
        this.is_queryable = !!config.is_queryable;
        this.is_required = !!config.is_required;
        this.default_value = config.default_value || null;
        this.order_index = config.order_index;
        this.field_config = config.field_config;
        this.old_field_location = null;
    }

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

    async update(config, entity_key) {
        const changed = (key) => Object.hasOwn(config, key);

        // Handle change between DB column and meta field
        if (changed('is_db_column') && config.is_db_column !== this.is_db_column) {
            this.old_field_location = this.is_db_column ? 'db' : 'meta';
            this.is_db_column = config.is_db_column;
        }

        if (!this.is_db_column) {
            if (changed('field_type')) this.field_type = config.field_type;
            if (changed('is_required')) this.is_required = config.is_required;
            if (changed('default_value')) this.default_value = config.default_value;
        } else {
            if (changed('is_db_column') && !config.is_db_column) {
                this.old_field_location = 'db';
                if (changed('field_type')) this.field_type = config.field_type;
                if (changed('is_required')) this.is_required = config.is_required;
                if (changed('default_value')) this.default_value = config.default_value;
            } else {
                // Type change
                if (changed('field_type') && config.field_type !== this.field_type) {
                    const canConvert = await this.checkTypeConversionPossible(this.field_name, config.field_type, entity_key);
                    if (!canConvert) {
                        const mysql_type = fieldTypeToMySQLType[config.field_type];
                        throw new ConflictError(`Cannot convert column "${this.field_name}" to type "${mysql_type}": some values are incompatible with this type.`);
                    }
                    this.field_type = config.field_type;
                }

                // Required flag change
                if (changed('is_required') && config.is_required !== this.is_required) {
                    if (config.is_required) {
                        const hasNoNulls = await this.#checkColumnForNull(this.field_name, entity_key);
                        if (!hasNoNulls) {
                            throw new ConflictError(`Cannot convert column "${this.field_name}" to a required field: some values are set to null.`);
                        }
                    }
                    this.is_required = config.is_required;
                }

                // Default value validation
                if (changed('default_value')) {
                    const targetType = changed('field_type') ? config.field_type : this.field_type;

                    if (config.default_value !== null) {
                        const isValid = await this.#isDefaultCompatible(config.default_value, targetType);
                        if (!isValid) {
                            const mysql_type = fieldTypeToMySQLType[targetType];
                            throw new ConflictError(`Cannot set default for "${this.field_name}": value is not compatible with type "${mysql_type}".`);
                        }
                    }
                    
                    this.default_value = config.default_value;
                }
            }
        }

        // Shared properties
        if (changed('is_queryable')) this.is_queryable = config.is_queryable;
        if (changed('display_label')) this.display_label = config.display_label;
        if (changed('order_index')) this.order_index = config.order_index;

        // Field config
        if (changed('field_config')) {
            await Field.checkFieldConfig(config.field_config, this.field_type);
            this.field_config = config.field_config;
        }
    }


    static async checkFieldConfig(config, field_type) {
        try {
            return await DatabaseConnector.withConnection( async (db) => {
                const [field_config] = await db.query(`SELECT config FROM field_types WHERE name = ?`, field_type);
                const field_schema = field_config[0].config;
                
                return validateFieldConfig(field_schema, config);
            })
        } catch (err) {
            if (err instanceof AppError){
                throw err;
            }

            const {message, status_code} = mapMySQLError(err);
            
            throw new AppError(message, status_code);
        }
    }

    async checkTypeConversionPossible(column_name, new_field_type, entity_key) {
        const mysql_field_type = fieldTypeToMySQLType[new_field_type];

        return await DatabaseConnector.withConnection(async db => {
            const [rows] = await db.query(
                `SELECT \`${column_name}\` 
                FROM \`m_entity_${entity_key}\`
                WHERE CAST(\`${column_name}\` AS ${mysql_field_type}) IS NULL 
                AND \`${column_name}\` IS NOT NULL;
                `
            );

            return rows.length === 0;
        });
    }

    async #checkColumnForNull(column_name, entity_key) {
        return await DatabaseConnector.withConnection(async db => {
            const [rows] = await db.query(
                `SELECT *
                FROM \`m_entity_${entity_key}\`
                WHERE \`${column_name}\` IS NULL;
                `
            );

            return rows.length !== 0;
        });
    }

    async #isDefaultCompatible(default_value, field_type) {
    const mysql_field_type = fieldTypeToMySQLType[field_type];

    return await DatabaseConnector.withConnection(async db => {
        const [rows] = await db.query(`SELECT CAST(? AS ${mysql_field_type}) AS result`, [default_value]);
        return rows[0].result !== null;
    })
}


    toJSON() {
        return {
            field_name: this.field_name,
            display_label: this.display_label,
            field_type: this.field_type,
            is_db_column: this.is_db_column,
            is_queryable: this.is_queryable,
            is_required: this.is_required,
            default_value: this.default_value,
            order_index: this.order_index,
            field_config: this.field_config
        };
    }
}

module.exports = Field;