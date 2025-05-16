const Ajv = require('ajv');
const ajv = new Ajv({allErrors: true, strictTypes: true});
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
    throw new ValidationError('Invalid field config', formatAjvErrors(validate.errors));
  }
  return true;
}

function formatAjvErrors(errors) {
  return errors.map(err => {
    if (err.keyword === 'required') {
      const field = err.params.missingProperty.replace('.', '');
      return `The field '${field}' is required.`;
    } else if (err.keyword === 'type' && err.instancePath ) {
      return `The field '${err.instancePath.slice(1)}' should be of type '${err.params.type}'.`;
    } else if (err.keyword === 'type' && err.dataPath ) {
      return `The field '${err.dataPath.slice(1)}' should be of type '${err.params.type}'.`;
    } else if (err.keyword === 'if') {
      return null;
    } else {
      return `${err.instancePath} ${err.message}`;
    }
  }).filter(err => err !== null);
}