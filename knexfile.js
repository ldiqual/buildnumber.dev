'use strict'

const path = require('path')
const config = require('./lib/config')

const knexConfig = {
  client: 'pg',
  connection: config.pgConnectionString,
  migrations: {
    directory: path.join(__dirname, '/migrations'),
    tableName: 'knex_migrations',
  },
  debug: config.isDebug,
}

// hack:
exports.development = exports.production = exports.test = knexConfig
