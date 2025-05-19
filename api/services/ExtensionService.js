class ExtensionService {
    constructor() {
        this.events = new Map();
        this.event_types = ['trigger', 'transform'];
    }

    /**
     * Defines an event to be added to available events
     * @param {string} name - Event unique identifier. 
     * @param {string} type - Type of event ("trigger", "transform").
     * @throws {Error} If event already exists or is not the right event type i.e. "trigger" or "transform"
     */
    defineEvent( name, type = 'trigger' ) {
        if ( !this.event_types.includes( type ) ) {
            throw new Error(`Unknown event type: ${type}`);
        }
        
        if ( this.events.has( name ) ) {
            throw new Error(`Event "${name}" already defined`);
        }
        this.events.set(name, { type, handlers: [] } );
    }

    /**
     * Creates a function that will run when the event is triggered by the system.
     * @param {string} name - the name of the event to hook into.
     * @param {function} handler - The functionality to run when this event is triggered.
     * @param {int} priority - When should the function be invoked in event handler timing.
     * @throws {Error} If event is not defined, if handler is not an async function, if the type is a transform and it doesn't have at least one argument.
     */
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

    /**
     * Runs all handlers for a given event that this function triggers.
     * @param {string} name - Event unique identifier.
     * @param {*} payload - Payload that will be passed into any functions added using add_handler.
     * @returns {null|any} - Result of running transform or nothing if it is a trigger type event.
     * @throws {Error} If event is not defined, event type is not a valid event type, trigger event returns a value, transform event does not return a value, or error in handler function.
     */
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