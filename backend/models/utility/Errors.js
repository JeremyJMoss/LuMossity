class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 404);
    }
}

class ConflictError extends AppError {
    constructor(message = 'Resource has already been initialised') {
        super(message, 409);
    }
}

class ValidationError extends AppError {
    constructor(message = 'Invalid request data', issues = []) {
        super(message, 422);
        this.issues = issues;
    }
}

module.exports = {
    AppError,
    NotFoundError,
    ConflictError,
    ValidationError
};