const express = require("express");
const bodyParser = require('body-parser');
const cors = require("cors");
const setupRouter = require('./routes/init/setup');
const entityRouter = require('./routes/entity/entity');

const server = express();
server.use(cors());

server.use(bodyParser.json());

server.use('/api/setup', setupRouter);
server.use('/api/entity', entityRouter);

server.listen(4000, () => {
    console.log("server listening on port 4000");
})