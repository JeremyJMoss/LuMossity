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
