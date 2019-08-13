'use strict'

const _ = require('lodash')
const Boom = require('@hapi/boom')
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
                    emailAddress: Joi.string().email().required(),
                    bundleIdentifier: Joi.string().min(3).required()
                }
            }
        },
        handler: async(request, h) => {
            
            const emailAddress = request.payload.emailAddress.toLowerCase()
            const bundleIdentifier = request.payload.bundleIdentifier.toLowerCase()
            
            let account = await Account.forge({ emailAddress }).fetch()
            if (!account) {
                account = await Account.forge({ emailAddress }).save()
            }
            
            // App
            const app = await App.forge({
                accountId: account.id,
                bundleIdentifier
            })
            
            // Ensure bundle identifier is unique for this account
            if (await app.count() > 0) {
                throw Boom.conflict('There is already an app with the same bundle identifier for this account')
            }
            
            await app.save()
            
            // Token
            const randomString = (await crypto.randomBytes(32)).toString('hex')
            const tokenValue = `${bundleIdentifier}-${randomString}`
            const token = await Token.forge({
                accountId: account.id,
                appId: app.id,
                value: tokenValue,
            }).save()
            
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
