'use strict'

const _ = require('lodash')
const Hapi = require('@hapi/hapi')
const inert = require('@hapi/inert')
const Joi = require('@hapi/joi')
const moment = require('moment-timezone')
const path = require('path')

const user = {
    id: 'gusty',
    name: 'gusty',
    password: 'gusty'
}

const init = async() => {

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
        handler: async(request, h) => {
            return {}
        }
    })
    
    addRoute({
        method: 'POST',
        path: '/builds',
        handler: async(request, h) => {
            return {}
        }
    })

    await server.start()
    console.log('Server running on %ss', server.info.uri)
}

process.on('unhandledRejection', (err) => {
    console.log(err)
    process.exit(1)
})

init()
