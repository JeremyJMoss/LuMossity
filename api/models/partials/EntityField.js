const DatabaseConnector = require("../../services/DatabaseConnector");
const { validateFieldConfig } = require( "../../util/validation");
const { mapMySQLError } = require( "../../util/helpers");
const { AppError } = require( "../utility/Errors");

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
    }

    static async create(config) {
        if (Object.hasOwn(config, 'field_config') && Object.hasOwn(config, 'field_name')) {
            try {
                await Field.checkFieldConfig(config.field_config, config.field_type);
            } catch (err) {
                throw err;
            }
            return new Field(config);
        }
    }

    async update(config) {    
        if (!this.is_db_column) {
            if (Object.hasOwn(config, 'is_db_column')) this.is_db_column = config.is_db_column;
            if (Object.hasOwn(config, 'field_type')) this.field_type = config.field_type;
            if (Object.hasOwn(config, 'is_queryable')) this.is_queryable = config.is_queryable;
            if (Object.hasOwn(config, 'is_required')) this.is_required = config.is_required;
            if (Object.hasOwn(config, 'default_value')) this.default_value = config.default_value;
        }
        if (Object.hasOwn(config, 'display_label')) this.display_label = config.display_label;
        if (Object.hasOwn(config, 'order_index')) this.order_index = config.order_index;

        if (Object.hasOwn(config, 'field_config')) {
            try {
                await Field.checkFieldConfig(config.field_config, this.field_type);
            } catch (err) {
                throw err;
            }
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