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

server.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
}));
server.use(bodyParser.json());
server.use(cookie_parser());

server.use(addExtensions);
server.use('/api/auth', authRouter);
server.use('/api/setup', setupRouter);
server.use('/api/user', userRouter);
server.use('/api/entities', entityRouter);
server.use('/api/field-types', fieldTypeRouter);
server.use(notFoundHandler);
server.use(errorHandler);

server.listen(4000, () => {
    extension_service.runEvent('core.server.after.start');
    logger.info("server started at http://localhost:4000");
})