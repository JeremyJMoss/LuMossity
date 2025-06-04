module.exports.isValidDatabaseName = (name) => {
    const mysqlReservedWords = ['select', 'drop', 'insert', 'update', 'delete', 'from', 'where', 'table', 'create'];

    const isSafe = /^[a-zA-Z0-9_]+$/.test(name);
    const isReserved = mysqlReservedWords.includes(name.toLowerCase());
    return isSafe && !isReserved;
};

module.exports.toSnakeCase = (str) => {
    return str
        .replace(/([a-z0-9])([A-Z])/g, '$1_$2')          // handle camelCase & PascalCase
        .replace(/[\s\-]+/g, '_')                        // convert spaces and dashes to underscores
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')       // handle acronyms
        .replace(/__+/g, '_')                            // collapse multiple underscores
        .toLowerCase()
        .trim();
}

/**
 * Get message and status code based on mysql error.
 * @function
 * @param {Error} err - Error object.
 * @returns {{message: string, statusCode: int}} message and status code of mysql error
 */
module.exports.mapMySQLError = (err) => {
    const errorMap = {
        'ECONNREFUSED': {
            message: 'Database connection was refused.',
            statusCode: 503
        },
        'PROTOCOL_CONNECTION_LOST': {
            message: 'Lost connection to the database.',
            statusCode: 503
        },
        'ER_NO_SUCH_TABLE': {
            message: 'Expected table is missing in the database.',
            statusCode: 500
        },
        'ER_BAD_FIELD_ERROR': {
            message: 'Invalid field in the SQL query.',
            statusCode: 500
        },
        'ER_PARSE_ERROR': {
            message: 'SQL syntax error.',
            statusCode: 500
        },
        'ER_ACCESS_DENIED_ERROR': {
            message: 'Access to the database was denied.',
            statusCode: 403
        },
        'ER_DUP_ENTRY': {
            message: 'Duplicate entry violates unique constraint.',
            statusCode: 400
        }
    };

    const fallback = {
        message: 'An unexpected database error occurred.',
        statusCode: 500
    };

    return errorMap[err.code] || fallback;
}

const convertPascalCaseToTitle = (pascalCaseTitle) => {
    const result = pascalCaseTitle.replace(/([A-Z])/g, ' $1').trim();
    
    return result.charAt(0).toUpperCase() + result.slice(1);
}

module.exports.fieldTypesToFieldObjects = function(field_types) {
    const fields = field_types.map(({name, config}) => {
        const default_config_schema = config.properties;
        const required = new Set(config.required || []);
        const fieldConfigs = [];

        for (const [property, schema] of Object.entries(default_config_schema)) {
            let inputType = "text";
            let options = [];
            let defaultValue = schema.default ?? null;
            let enumOptions = schema.enum ?? null;

            switch (schema.type) {
                case "string":
                    inputType = enumOptions ? "select" : "text";
                    if (enumOptions) {
                        options = enumOptions.map(opt => ({ label: opt, value: opt }));
                    }
                    break;
                case "boolean":
                    inputType = "checkbox";
                    break;
                case "integer":
                case "number":
                    inputType = "number";
                    break;
                case "array":
                    if (schema.items && schema.items.enum) {
                        inputType = "multi_select";
                        options = schema.items.enum.map(opt => ({ label: opt, value: opt }));
                    } else {
                        inputType = "create_options";
                    }
                    break;
                case "object":
                    inputType = "object"; // placeholder for complex/nested objects
                    break;
                default:
                    inputType = "text";
            }

            fieldConfigs.push({
                key: property,
                label: convertPascalCaseToTitle(property),
                type: inputType,
                required: required.has(property),
                defaultValue,
                options: options.length ? options : undefined,
            });
        }

        return {
            name,
            fields: fieldConfigs,
        };
    });

    return fields;
};