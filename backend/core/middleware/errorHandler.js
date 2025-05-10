module.exports = (err, req, res, next) => {
    const status = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    const issues = err.issues || null;

    res.status(status).json({
        success: false,
        error: message,
        issues
    });
};