class ExtensionService {
    constructor() {
        this.events = new Map();
        this.event_types = ['trigger', 'transform'];
    }

    defineEvent( name, type = 'trigger' ) {
        if ( !this.event_types.includes( type ) ) {
            throw new Error(`Unknown event type: ${type}`);
        }
        
        if ( this.events.has( name ) ) {
            throw new Error(`Event "${name}" already defined`);
        }
        this.events.set(name, { type, handlers: [] } );
    }

    addHandler( name, handler, priority = 0 ) {
        if ( !this.events.has( name ) ) {
            throw new Error(`Event "${name}" is not defined. Event must be defined before handlers can be added`);
        }

        const { type } = this.events.get(name);

        // Enforce all handlers to be async functions
        if (handler.constructor.name !== 'AsyncFunction') {
            throw new Error(`Handler for event "${name}" must be an async function`);
        }

        if (type === 'transform' && handler.length !== 1) {
            throw new Error(`Transformer for "${name}" must take exactly one argument`);
        }

        this.events.get(name).handlers.push({handler, priority});
    }

    async runEvent( name, payload = null) {
        const event = this.events.get(name);
        if (!event) {
            throw new Error(`Event "${name}" is not defined`);
        }

        const sortedHandlers = event.handlers.sort((a, b) => b.priority - a.priority);

        switch (event.type) {
            case 'trigger':
                for (const {handler} of sortedHandlers) {
                    try {
                        const result = await handler(payload);
                        if (result) {
                            throw new Error('Trigger events should not return a result');
                        }
                    } catch (err) {
                        throw new Error(`Event "${name}" threw error in handler: ${err.message}`);
                    }
                }
                break;
            case 'transform':
                return await sortedHandlers
                    .reduce(async (promisedValue, {handler}) => {
                        const value = await promisedValue;
                        const result = handler(value);
                        if (typeof result === 'undefined') {
                            throw new Error(`Transformer handler ${index + 1} in "${name}" did not return a value.`);
                        }

                        return result;
                    }, Promise.resolve(payload));
            default:
                throw new Error('Event type is not within available event types');
        }
    }
}

const extension_service = new ExtensionService();

module.exports = extension_service;