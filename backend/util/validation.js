const { ValidationError } = require('../models/utility/Errors');

module.exports.validateBodySchema = ( schema, req_body = {} ) => {
    const parsed = schema.safeParse(req_body);
    if ( !parsed.success) {
        const issues = parsed.error.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message
        }));
        throw new ValidationError('Validation failed', issues);
    }
}