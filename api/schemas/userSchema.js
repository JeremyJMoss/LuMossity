const { z } = require('zod');

const createUserSchema = z.object({
    first_name: z.string().min(1),
    last_name: z.string().min(1),
    email: z.string().min(1).email(),
    password: z.string().min(10)
})

const loginUserSchema = z.object({
    email: z.string().min(1).email(),
    password: z.string().min(1)
})

module.exports = {
    createUserSchema,
    loginUserSchema
}