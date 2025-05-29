// handles errors thrown in routes
module.exports = (err, req, res, next) => {
    const status = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    const issues = err.issues || null;

    const err_obj = {
        message,
    }

    if (issues !== null) {
        err_obj.issues = issues;
    }

    res.status(status).json(err_obj);
};