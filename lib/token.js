'use strict'

const bookshelf = require('./bookshelf')

const Token = bookshelf.Model.extend({
    tableName: 'tokens'
})

module.exports = Token
