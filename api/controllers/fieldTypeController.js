const Field = require("../models/partials/EntityField");

module.exports.getFieldPresets = async (req, res, next) => {
    try {
        const field_presets = await Field.getFieldPresets();

        if (!field_presets) {
            throw new NotFoundError('No field presets found');
        }

        res.status(200).json({
            field_presets
        })
    } catch (err) {
        next (err);
    }
}

module.exports.getFieldSetup = async (req, res, next) => {
    const {field_type} = req.params;

    try {
        const field_setup = await Field.getFieldSetup(field_type);

        if (!field_setup) {
            throw new NotFoundError('No field setup for given field_type');
        }

        res.status(200).json({
            field_setup
        });
    } catch (err) {
        next(err);
    }
}