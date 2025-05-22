const { z } = require('zod');

const initializeDatabaseSchema = z.object({
    user: z.string().min(1),
    password: z.string().min(1),
    database: z.string().min(1)
});

module.exports = {
    initializeDatabaseSchema
}