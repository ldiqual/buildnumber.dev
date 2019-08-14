'use strict'

const Promise = require('bluebird')
const crypto = Promise.promisifyAll(require('crypto'))

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
    const tokenValue = (await crypto.randomBytes(32)).toString('hex').substring(0, 15)
    return Token.forge({ ...params, value: params.value || tokenValue }).save()
}

async function createBuild(params) {
    return Build.forge(params).save()
}

async function resetDatabase() {
    await bookshelf.knex.raw('truncate table accounts cascade')
}

function getAuthHeaderForTokenValue(tokenValue) {
    return 'Basic ' + Buffer.from(tokenValue + ':', 'utf8').toString('base64')
}

module.exports = {
    createAccount,
    createApp,
    createToken,
    createBuild,
    resetDatabase,
    getAuthHeaderForTokenValue,
}
