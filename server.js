'use strict'

const _ = require('lodash')
const Promise = require('bluebird')
const crypto = Promise.promisifyAll(require('crypto'))
const Hapi = require('@hapi/hapi')
const inert = require('@hapi/inert')
const Joi = require('@hapi/joi')
const moment = require('moment-timezone')
const path = require('path')

const bookshelf = require('./lib/bookshelf')
const Account = bookshelf.model('Account')
const App = bookshelf.model('App')
const Token = bookshelf.model('Token')

const user = {
    id: 'gusty',
    name: 'gusty',
    password: 'gusty'
}

const initServer = async() => {

    const server = new Hapi.Server({
        port: process.env.PORT || 3000,
        host: '0.0.0.0',
        debug: { request: ['error'] }
    })

    await server.register(inert)

    server.route({
        method: 'GET',
        path: '/{param*}',
        handler: {
            directory: {
                path: path.join(__dirname, 'static'),
                index: 'index.html'
            }
        }
    })
    
    const addRoute = (params) => {
        server.route({...params, path: `/api${params.path}`})
        server.route({...params, vhost: 'api.buildnumber.io'})
    }
    
    // Tokens 1-n Builds
    addRoute({
        method: 'POST',
        path: '/tokens',
        options: {
            validate: {
                payload: {
                    email: Joi.string().email().required(),
                    bundleIdentifier: Joi.string().min(3).required()
                }
            }
        },
        handler: async(request, h) => {
            
            const email = request.payload.email
            const bundleIdentifier = request.payload.bundleIdentifier
            
            await bookshelf.transaction(async txn => {
                const account = await Account.forge({ email_address: email }).save(null, { transacting: txn })
                const app = await App.forge({ account_id: account.id, bundle_identifier: bundleIdentifier }).save(null, { transacting: txn })
                const randomString = (await crypto.randomBytes(32)).toString('hex')
                const tokenValue = `${bundleIdentifier}-${randomString}`
                const token = await Token.forge({
                    account_id: account.id,
                    app_id: app.id,
                    value: tokenValue,
                }).save(null, { transacting: txn })
            })
            
            return h.response({}).code(201)
        }
    })
    
    addRoute({
        method: 'POST',
        path: '/builds',
        handler: async(request, h) => {
            return {}
        }
    })

    return server
}

module.exports = {
    initServer
}

if (require.main === module) {
    initServer()
    .then(async server => {
        await server.start()
        console.log('Server running on %ss', server.info.uri)
    })
    .catch(err => {
        console.log(err.stack)
        process.exit(1)
    })
}
