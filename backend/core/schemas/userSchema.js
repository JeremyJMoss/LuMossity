const { z } = require('zod');

const createUserSchema = z.object({
    first_name: z.string().min(1),
    last_name: z.string().min(1),
    email: z.string().min(1).email(),
    password: z.string().min(10)
})

module.exports = {
    createUserSchema
}