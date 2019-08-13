'use strict'

const Boom = require('@hapi/boom')
const Promise = require('bluebird')
const crypto = Promise.promisifyAll(require('crypto'))
const Hapi = require('@hapi/hapi')
const hapiBasic = require('@hapi/basic')
const inert = require('@hapi/inert')
const Joi = require('@hapi/joi')
const mailgunApi = require('mailgun-js')
const nunjucks = require('nunjucks')
const path = require('path')

const config = require('./lib/config')
const bookshelf = require('./lib/bookshelf')
const Account = bookshelf.model('Account')
const App = bookshelf.model('App')
const Token = bookshelf.model('Token')
const Build = bookshelf.model('Build')

const mailgun = mailgunApi({
    apiKey: config.mailgun.secretApiKey,
    domain: config.mailgun.domain
})

// Token value is the basic auth username
const validateToken = async(request, tokenValue, password, h) => {
    
    // Ensure token is of appropriate length
    try {
        Joi.assert(tokenValue, Joi.string().min(32).required())
    } catch (err) {
        return { credentials: null, isValid: false }
    }
    
    // Fetch token with same value
    const token = await Token.forge({ value: tokenValue }).fetch({ withRelated: ['account', 'app'] })
    if (token === null) {
        return { credentials: null, isValid: false }
    }

    const account = token.related('account')
    const app = token.related('app')
    
    const credentials = { accountId: account.id, appId: app.id }

    return { isValid: true, credentials }
}

const initServer = async() => {

    const server = new Hapi.Server({
        port: process.env.PORT || 3000,
        host: '0.0.0.0',
        debug: { request: ['error'] }
    })

    await server.register(inert)
    await server.register(hapiBasic)
    server.auth.strategy('simple', 'basic', { validate: validateToken })

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
        server.route({ ...params, path: `/api${params.path}` })
        server.route({ ...params, vhost: 'api.buildnumber.dev' })
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
            const similarAppsCount = await App.where({
                'account_id': account.id,
                'bundle_identifier': bundleIdentifier
            }).count()
            
            // Ensure bundle identifier is unique for this account
            if (similarAppsCount > 0) {
                throw Boom.conflict('There is already an app with the same bundle identifier for this account')
            }
            
            const app = await App.forge({
                accountId: account.id,
                bundleIdentifier
            }).save()
            
            // Token
            const randomString = (await crypto.randomBytes(32)).toString('hex')
            const tokenValue = `${bundleIdentifier}-${randomString}`
            await Token.forge({
                accountId: account.id,
                appId: app.id,
                value: tokenValue,
            }).save()
            
            // Email templates
            const emailTextContent = nunjucks.render('./email-templates/welcome-email.txt', { tokenValue })
            const emailHtmlContent = nunjucks.render('./email-templates/welcome-email-inlined.html', { tokenValue })
            
            const emailData = {
                from: 'buildnumber.dev <welcome@buildnumber.dev>',
                to: emailAddress,
                subject: 'Your buildnumber.dev API token',
                text: emailTextContent,
                html: emailHtmlContent,
            }
            await mailgun.messages().send(emailData)
            
            return h.response({}).code(201)
        }
    })
    
    // Create new build
    addRoute({
        method: 'POST',
        path: '/builds',
        options: {
            auth: 'simple',
            validate: {
                payload: {
                    metadata: Joi.object().optional()
                }
            }
        },
        handler: async(request, h) => {
            
            const appId = request.auth.credentials.appId
            const metadata = request.payload.metadata || {}
            const lastBuild = await Build.forge({ appId: appId }).orderBy('build_number', 'DESC').fetch()
            
            let build = null
            if (lastBuild) {
                const buildNumber = Number(lastBuild.get('buildNumber')) + 1
                build = await Build.forge({
                    appId,
                    buildNumber,
                    metadata
                }).save()
            } else {
                build = await Build.forge({
                    appId,
                    buildNumber: 1,
                    metadata
                }).save()
            }
            
            return h.response({
                buildNumber: build.get('buildNumber'),
                metadata: build.get('metadata')
            }).code(201)
        }
    })
    
    // Get last build
    addRoute({
        method: 'GET',
        path: '/builds/last',
        options: {
            auth: 'simple',
        },
        handler: async(request, h) => {
            
            const appId = request.auth.credentials.appId
            const lastBuild = await Build.forge({ appId }).orderBy('build_number', 'DESC').fetch()
            
            if (!lastBuild) {
                throw Boom.notFound("Couldn't find a build for this application")
            }
            
            const buildNumber = Number(lastBuild.get('buildNumber'))
            const metadata = lastBuild.get('metadata')
            
            return {
                buildNumber,
                metadata
            }
        }
    })
    
    // Get last build
    addRoute({
        method: 'GET',
        path: '/builds/{buildNumber}',
        options: {
            auth: 'simple',
            validate: {
                params: {
                    buildNumber: Joi.number().integer().min(1).required()
                }
            }
        },
        handler: async(request, h) => {
            
            const appId = request.auth.credentials.appId
            const buildNumber = request.params.buildNumber
            const build = await Build.forge({ appId, buildNumber }).fetch()
            
            if (!build) {
                throw Boom.notFound("Couldn't find a build with this build number")
            }
            
            const metadata = build.get('metadata')
            
            return {
                buildNumber,
                metadata
            }
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
