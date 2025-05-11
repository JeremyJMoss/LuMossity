const { z } = require('zod');

const createEntitySchema = z.object({
    name: z.string().min(1),
    entity_key: z.string().optional().nullable()
});

const updateEntitySchema = z.object({
    name: z.string().min(1)
});

const updateEntityFieldsSchema = z.object({
    fields: z.array(z.object({
        field_name: z.string(),
        field_type: z.string(),
        display_label: z.string().optional(),
        is_db_column: z.boolean().optional(),
        is_required: z.boolean().optional(),
        is_queryable: z.boolean().optional(),
        default_value: z.any().optional(),
        order_index: z.number().positive().int()
    }))
});

const deleteFieldsSchema = z.object({
    fields: z.array(z.string())
})

const createEntityFieldsSchema = z.object({
    fields: z.array(z.object({
        field_name: z.string(),
        field_type: z.string(),
        display_label: z.string().optional(),
        is_db_column: z.boolean().optional(),
        is_required: z.boolean().optional(),
        is_queryable: z.boolean().optional(),
        default_value: z.any().optional(),
        order_index: z.number().positive().int()
    }))
})

module.exports = {
    createEntitySchema,
    createEntityFieldsSchema,
    updateEntitySchema,
    updateEntityFieldsSchema,
    deleteFieldsSchema
};