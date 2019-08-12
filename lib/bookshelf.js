'use strict'

const knex = require('knex')({
    client: 'mysql',
    connection: {
        host: '127.0.0.1',
        user: 'postgres',
        password: '',
        database: 'buildnumber',
    }
})

const bookshelf = require('bookshelf')(knex)

module.exports = bookshelf