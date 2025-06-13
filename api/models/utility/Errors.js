// declaring all error types
class AppError extends Error {
    constructor(message, statusCode = 500, errorText = 'UNKNOWN_APP_ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        this.errorText = errorText;
        Error.captureStackTrace(this, this.constructor);
    }
}

class AuthenticationError extends AppError {
    constructor(message = 'Missing Authorisation') {
        super(message, 401, 'MISSING_AUTHORISATION');
    }
}

class AuthorizationError extends AppError {
    constructor(message = 'Not Authorized') {
        super(message, 403, 'INSUFFICIENT_PERMISSIONS');
    }
}

class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 404, 'NOT_FOUND');
    }
}

class ConflictError extends AppError {
    constructor(message = 'Resource has already been initialised') {
        super(message, 409, 'CONFLICTING_RESOURCES');
    }
}

class ValidationError extends AppError {
    constructor(message = 'Invalid request data', issues = []) {
        super(message, 422, 'VALIDATION_ERROR');
        this.issues = issues;
    }
}

module.exports = {
    AppError,
    AuthorizationError,
    AuthenticationError,
    NotFoundError,
    ConflictError,
    ValidationError
};