'use strict'

const bookshelf = require('./bookshelf')

const Build = bookshelf.Model.extend({
    tableName: 'builds'
})

module.exports = Build
