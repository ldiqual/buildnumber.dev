'use strict'

const _ = require('lodash')
const requireTree = require('require-tree')

const config = require('./config')

const knex = require('knex')({
  client: 'pg',
  connection: config.pgConnectionString,
  debug: config.isDebug,
})

const bookshelf = require('bookshelf')(knex)
bookshelf.plugin('registry')
bookshelf.plugin('bookshelf-camelcase')

const models = requireTree('./models')
_.forEach(models, (modelModule, filename) => {
  bookshelf.model(filename, modelModule(bookshelf))
})

module.exports = bookshelf
