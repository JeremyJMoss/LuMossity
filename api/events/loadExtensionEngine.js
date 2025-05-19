// module dependencies
const path = require('path');
const fs = require('fs');
const extension_service = require('../services/ExtensionService');
const logger = require("../models/utility/Logger");

// core event config 
const core_events_path = path.resolve(__dirname, 'coreEventDefinitions.js');
const core_event_definitions = require(core_events_path);

// define extensions directory path
const extensions_directory = path.join(__dirname, '..', '..', 'extensions');
const extension_directories = fs.readdirSync(extensions_directory, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name);

// Register core events
core_event_definitions.forEach(({ name, type }) => {
    extension_service.defineEvent(name, type);
});

extension_directories.forEach(extension_name => {
    const extension_path = path.join(extensions_directory, extension_name);
    const manifest_path = path.join(extension_path, 'manifest.json');

    if (!fs.existsSync(manifest_path)) {
        logger.info(`[${extension_name}] Missing manifest.json — skipping extension.`);
        return;
    }

    let manifest;
    try {
        manifest = JSON.parse(fs.readFileSync(manifest_path, 'utf-8'));
    } catch (err) {
        logger.info(`[${extension_name}] Failed to parse manifest.json: File not in correct format`);
        return;
    }

    // check if the extension has defined event definitions in manifest.json
    const event_definitions_path = manifest.entry?.api?.event_definitions 
        ? path.join(extension_path, manifest.entry.api.event_definitions) : null;

    // Enqueue user defined event definitions
    if ( event_definitions_path && fs.existsSync(event_definitions_path) ) {
        const event_definitions = require(event_definitions_path);
        if ( Array.isArray(event_definitions) ) {
            event_definitions.forEach(({ name, type }) => {
                extension_service.defineEvent(name, type);
            });
        } else {
            logger.info(`[${extension_name}] Event definitions must export an array.`);
            return;
        }
    } else {
        logger.info(`[${extension_name}] No valid event_definitions path in manifest.`);
        return;
    }

    // check if the extension has a handler defined in manifest.json
    const handlers_path = manifest.entry?.api?.event_handlers
        ? path.join(extension_path, manifest.entry.api.event_handlers) : null;

    // enqueue user defined event handlers
    if ( handlers_path && fs.existsSync(handlers_path) ) {
        let register_handlers;
        try {
            register_handlers = require(handlers_path);
        } catch (err) {
            logger.info(`[${extension_name}] Failed to load handlers: ${err.message}`);
            return;
        }
        if ( typeof register_handlers === 'function' ) {
            // call functions defined by user passing in the extension engine
            register_handlers(extension_service);
        } else {
            logger.info(`[${extension_name}] Handlers file must export a function.`);
            return;
        }
    } else {
        logger.info(`[${extension_name}] No valid handlers path in manifest.`);
        return;
    }
});
