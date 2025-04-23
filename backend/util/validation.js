module.exports.validateDbInput = ( reqBody ) => {

    const { host, user, password, database } = reqBody || {};
    
    const missing = [];
    if (!host) missing.push('host');
    if (!user) missing.push('user');
    if (!password) missing.push('password');
    if (!database) missing.push('database');
    return missing;
}

module.exports.validateEntity = ( reqBody ) => {
    const { name, fields = [] } = reqBody || {};
    const missing = [];

    if ( !name ) missing.push('name');
    return missing;
}