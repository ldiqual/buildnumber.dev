'use strict'

var path = require('path')
var config = require('./lib/config')

var knexConfig = {
    client: 'pg',
    connection: config.pgConnectionString,
    migrations: {
        directory: path.join(__dirname, '/migrations'),
        tableName: 'knex_migrations'
    },
    debug: (process.env.hasOwnProperty('DEBUG'))
}

// hack:
exports.development = exports.production = exports.test = knexConfig