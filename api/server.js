// Dependencies
const express = require("express");
const bodyParser = require('body-parser');
const cors = require("cors");
const cookie_parser = require("cookie-parser");
const logger = require("./models/utility/Logger");
const setupRouter = require('./routes/setup');
const entityRouter = require('./routes/entity');
const userRouter = require('./routes/user');
const authRouter = require('./routes/auth');
const fieldTypeRouter = require('./routes/field_types');
const addExtensions = require('./middleware/extensions');
const notFoundHandler = require('./middleware/notFoundHandler');
const errorHandler = require('./middleware/errorHandler');
const extension_service = require("./services/ExtensionService");

// Load extension handlers
require('./events/loadExtensionEngine');

const server = express();

// Setup configuration
server.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
}));
server.use(bodyParser.json());
server.use(cookie_parser());

// Add extensions to request
server.use(addExtensions);
//Routers
server.use('/api/auth', authRouter);
server.use('/api/setup', setupRouter);
server.use('/api/user', userRouter);
server.use('/api/entities', entityRouter);
server.use('/api/field-types', fieldTypeRouter);
// 404 page
server.use(notFoundHandler);
// Errors Handler
server.use(errorHandler);

// Start express server
server.listen(4000, () => {
    extension_service.runEvent('core.server.after.start');
    logger.info("server started at http://localhost:4000");
})