module.exports.validateFields = (reqBody = {}, requiredFields = []) => {
    const missing = [];

    for (const field of requiredFields) {
        if (reqBody[field] === undefined || reqBody[field] === null || reqBody[field] === '') {
            missing.push(field);
        }
    }

    return missing;
};