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
