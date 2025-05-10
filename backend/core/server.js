const express = require("express");
const bodyParser = require('body-parser');
const cors = require("cors");
const setupRouter = require('./routes/setup');
const entityRouter = require('./routes/entity');
const userRouter = require('./routes/user');
const notFoundHandler = require('./middleware/notFoundHandler');
const errorHandler = require('./middleware/errorHandler');

const server = express();
server.use(cors());

server.use(bodyParser.json());

server.use('/api/setup', setupRouter);
server.use('/api/user', userRouter);
server.use('/api/entities', entityRouter);
server.use(notFoundHandler);
server.use(errorHandler);

server.listen(4000, () => {
    console.log("server listening on port 4000");
})