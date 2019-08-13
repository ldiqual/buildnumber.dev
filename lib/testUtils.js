'use strict'

const bookshelf = require('./bookshelf')
const Account = bookshelf.model('Account')
const App = bookshelf.model('App')
const Token = bookshelf.model('Token')
const Build = bookshelf.model('Build')

async function createAccount(params) {
    return Account.forge(params).save()
}

async function createApp(params) {
    return App.forge(params).save()
}

async function createToken(params) {
    return Token.forge(params).save()
}

async function createBuild(params) {
    return Build.forge(params).save()
}

async function resetDatabase() {
    await bookshelf.knex.raw('truncate table accounts cascade')
}

module.exports = {
    createAccount,
    createApp,
    createToken,
    createBuild,
    resetDatabase
}
