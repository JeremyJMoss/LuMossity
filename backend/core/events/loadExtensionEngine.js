const path = require('path');
const fs = require('fs');
const extension_service = require('../services/ExtensionService');

const core_events_path = path.resolve(__dirname, 'coreEventDefinitions.js');
const core_event_definitions = require(core_events_path);

core_event_definitions.forEach(({ name, type }) => {
  extension_service.defineEvent(name, type);
});

const extensions_directory = path.join(__dirname, '..', '..', 'extensions');
const extension_directories = fs.readdirSync(extensions_directory, { withFileTypes: true })
  .filter(file_or_folder => file_or_folder.isDirectory())
  .map(directory => directory.name);

extension_directories.forEach(extension_name => {
    const event_definition_path = path.join(extensions_directory, extension_name, 'event_definitions.js');
    if (fs.existsSync(event_definition_path)) {
        const event_definitions = require(event_definition_path);
        if (Array.isArray(event_definitions)) {
            if (event_definitions.length > 0 ) {
                event_definitions.forEach(({ name, type }) => {
                    extension_service.defineEvent(name, type);
                });
            }
        } else {
            console.warn(`[${extension_name}] event_definitions.js did not return an array.`);
        }
    } else {
        console.warn(`[${extension_name}] No event_definitions.js found.`);
    }

    const handlers_path = path.join(extensions_directory, extension_name, 'handlers.js');
    if (fs.existsSync(handlers_path)) {
        const register_handlers = require(handlers_path);
        if (typeof register_handlers === 'function') {
            register_handlers(extension_service);
        } else {
            console.warn(`[${extension_name}] handlers.js did not export a function.`);
        }
    } else {
        console.warn(`[${extension_name}] No handlers.js found.`);
    }
});