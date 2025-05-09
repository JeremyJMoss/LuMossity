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
    }

    update(config) {
        if (Object.hasOwn(config, 'display_label')) {
            this.display_label = config.display_label;
        }
        if (!this.is_db_column) {
            if (Object.hasOwn(config, 'is_db_column')) this.is_db_column = config.is_db_column;
            if (Object.hasOwn(config, 'field_type')) this.field_type = config.field_type;
            if (Object.hasOwn(config, 'is_queryable')) this.is_queryable = config.is_queryable;
            if (Object.hasOwn(config, 'is_required')) this.is_required = config.is_required;
            if (Object.hasOwn(config, 'default_value')) this.default_value = config.default_value;
        }
        if (Object.hasOwn(config, 'order_index')) {
            this.order_index = config.order_index;
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
            order_index: this.order_index
        };
    }
}

module.exports = Field;