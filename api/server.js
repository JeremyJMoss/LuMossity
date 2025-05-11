const express = require("express");
const bodyParser = require('body-parser');
const cors = require("cors");
const setupRouter = require('./routes/setup');
const entityRouter = require('./routes/entity');
const userRouter = require('./routes/user');
const addExtensions = require('./middleware/extensions');
const notFoundHandler = require('./middleware/notFoundHandler');
const errorHandler = require('./middleware/errorHandler');
const extension_service = require("./services/ExtensionService");

// Load extension handlers
require('./events/loadExtensionEngine');

const server = express();

server.use(cors());
server.use(bodyParser.json());

server.use(addExtensions);
server.use('/api/setup', setupRouter);
server.use('/api/user', userRouter);
server.use('/api/entities', entityRouter);
server.use(notFoundHandler);
server.use(errorHandler);

server.listen(4000, () => {
    extension_service.runEvent('core.after.startService');
    console.log("server listening on port 4000");
})