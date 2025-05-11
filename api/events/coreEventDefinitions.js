module.exports = [
    { name: 'core.server.after.start', type: 'trigger' },
    { name: 'core.entity.after.create', type: 'trigger' },
    { name: 'core.entity.after.update', type: 'trigger' },
    { name: 'core.entity.after.getAll.query', type: 'transform' }
]