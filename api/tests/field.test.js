const Field = require('../models/partials/EntityField');
const DatabaseConnector = require('../services/DatabaseConnector');
const {ValidationError} = require('../models/utility/Errors');

// Mock the static method
DatabaseConnector.withConnection = jest.fn();

describe('checkFieldConfig', () => {

    it('should return true if field config is accurate', async () => {
        
        DatabaseConnector.withConnection.mockImplementation(async (cb) => {
            return await cb({
                query: async () => [[{ 
                    config: {
                        type: "object",
                        properties: {
                            label: { type: "string" },
                            placeholder: { type: "string" },
                            maxLength: { type: "integer" },
                            minLength: { type: "integer" },
                            required: { type: "boolean" }
                        },
                        required: ["label"]
                    }
                }]]
            });
        });

        const result = await Field['checkFieldConfig']({ label: "test" }, "text");
        expect(result).toBe(true);
    });

    it ('should throw ValidationError if field config does not match schema', async () => {
        DatabaseConnector.withConnection.mockImplementation(async (cb) => {
            return await cb({
                query: async () => [[{ 
                    config: {
                        type: "object",
                        properties: {
                            label: { type: "string" },
                            placeholder: { type: "string" },
                            maxLength: { type: "integer" },
                            minLength: { type: "integer" },
                            required: { type: "boolean" }
                        },
                        required: ["label"]
                    }
                }]]
            });
        });

        await expect(
            Field['checkFieldConfig']({pants: "not worn"}, 'text')
        ).rejects
        .toThrow(ValidationError);

    })

});


describe('checkTypeConversionPossible', () => {
    let field;

    beforeEach(() => {
        field = new Field({
            field_name: 'test', 
            display_label: 'test', 
            field_type: 'text', 
            is_db_column: true, 
            is_queryable: true, 
            is_required: true, 
            order_index: 1, 
            field_config: {
                label: "test"
            } 
        });
    });

    it('should return true when all values can be cast', async () => {
        (DatabaseConnector.withConnection).mockImplementation(async (cb) => {
            return await cb({
                query: async () => [[]]  // No rows = safe to cast
            });
        });

        const result = await field['checkTypeConversionPossible']('age', 'integer', 'test');
        expect(result).toBe(true);
    });

    it('should return false when some values cannot be cast', async () => {
        (DatabaseConnector.withConnection).mockImplementation(async (cb) => {
            return await cb({
                query: async () => [[{ age: 'not-a-number' }]] // returning any kind of row returns false
            });
        });

        const result = await field['checkTypeConversionPossible']('age', 'integer', 'test');
        expect(result).toBe(false);
    });
});


