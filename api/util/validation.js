const Ajv = require('ajv');
const ajv = new Ajv();
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

module.exports.validateFieldConfig = (fieldSchema, config) => {
  
  // Compile the schema using AJV
  const validate = ajv.compile(fieldSchema);
  
  const isValid = validate(config);

  if (!isValid) {
    throw new ValidationError('Invalid field config', [ajv.errorsText(validate.errors)]);
  }
  return true;
}