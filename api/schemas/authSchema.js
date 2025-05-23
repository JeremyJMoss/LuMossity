const { z } = require('zod');

const loginUserSchema = z.object({
    email: z.string().min(1).email(),
    password: z.string().min(1)
})

module.exports = {
    loginUserSchema
}