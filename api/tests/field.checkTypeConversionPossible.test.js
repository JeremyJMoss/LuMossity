const { Entity } = require('../models/Entity');
const { DatabaseConnector } = require('../services/DatabaseConnector');

jest.mock('../services/DatabaseConnector', () => ({
    DatabaseConnector: {
        withConnection: jest.fn()
    }
}));

describe('checkTypeConversionPossible', () => {
    let entity;

    beforeEach(() => {
        entity = new Entity('test');
    });

    it('should return true when all values can be cast', async () => {
        (DatabaseConnector.withConnection).mockImplementation(async (cb) => {
            return await cb({
                query: async () => [[]]  // No rows = safe to cast
            });
        });

        const result = await entity['checkTypeConversionPossible']('age', 'integer', 'test');
        expect(result).toBe(true);
    });

    it('should return false when some values cannot be cast', async () => {
        (DatabaseConnector.withConnection).mockImplementation(async (cb) => {
            return await cb({
                query: async () => [[{ age: 'not-a-number' }]]
            });
        });

        const result = await entity['checkTypeConversionPossible']('age', 'integer', 'test');
        expect(result).toBe(false);
    });
});


