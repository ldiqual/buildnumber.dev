'use strict'

const { initServer } = require('../server')
const expect = require('chai').expect
const testUtils = require('../lib/testUtils')
let server = null

before(async() => {
    server = await initServer()
})

beforeEach(async() => {
    await testUtils.resetDatabase()
})

describe('POST /tokens', async() => {
    it('fails if no email', async() => {
        const response = await server.inject({
            method: 'POST',
            url: '/api/tokens',
            payload: {
                bundleIdentifier: 'com.example.myapp'
            }
        })
        expect(response.statusCode).to.equal(400)
    })
    
    it('fails if invalid email', async() => {
        const response = await server.inject({
            method: 'POST',
            url: '/api/tokens',
            payload: {
                emailAddress: 'invalidemail',
                bundleIdentifier: 'com.example.myapp'
            }
        })
        expect(response.statusCode).to.equal(400)
    })
    
    it('fails if no bundle indentifier', async() => {
        const response = await server.inject({
            method: 'POST',
            url: '/api/tokens',
            payload: {
                emailAddress: 'buildnumber-dev-test@yopmail.com',
            }
        })
        expect(response.statusCode).to.equal(400)
    })
    
    it('fails if invalid bundle indentifier', async() => {
        const response = await server.inject({
            method: 'POST',
            url: '/api/tokens',
            payload: {
                emailAddress: 'buildnumber-dev-test@yopmail.com',
                bundleIdentifier: 'aa'
            }
        })
        expect(response.statusCode).to.equal(400)
    })
    
    it('fails if same email + bundle indentifier was used', async() => {
        
        const account = await testUtils.createAccount({ emailAddress: 'buildnumber-dev-test@yopmail.com' })
        await testUtils.createApp({ bundleIdentifier: 'com.example.myapp1', accountId: account.id })
        
        const response1 = await server.inject({
            method: 'POST',
            url: '/api/tokens',
            payload: {
                emailAddress: 'buildnumber-dev-test@yopmail.com',
                bundleIdentifier: 'com.example.myapp1'
            }
        })
        expect(response1.statusCode).to.equal(409)
        
        const response2 = await server.inject({
            method: 'POST',
            url: '/api/tokens',
            payload: {
                emailAddress: 'buildnumber-dev-test@yopmail.com',
                bundleIdentifier: 'com.example.myapp2'
            }
        })
        expect(response2.statusCode).to.equal(201)
    })
    
    it('succeeds with proper email + bundle indentifier', async() => {
        const response = await server.inject({
            method: 'POST',
            url: '/api/tokens',
            payload: {
                emailAddress: 'buildnumber-dev-test@yopmail.com',
                bundleIdentifier: 'com.example.myapp'
            }
        })
        expect(response.statusCode).to.equal(201)
    })
})

describe('POST /builds', async() => {
    it('fails if no token provided', async() => {
        const response = await server.inject({
            method: 'POST',
            url: '/api/builds',
            headers: { authorization: '' },
        })
        expect(response.statusCode).to.equal(401)
    })
    
    it('fails if invalid token provided', async() => {
        const response = await server.inject({
            method: 'POST',
            url: '/api/builds',
            headers: {
                authorization: testUtils.getAuthHeaderForTokenValue('does-not-exist-but-is-long-enough')
            },
        })
        expect(response.statusCode).to.equal(401)
    })
    
    it('succeeds if valid token provided', async() => {
        
        const account = await testUtils.createAccount({ emailAddress: 'buildnumber-dev-test@yopmail.com' })
        const app = await testUtils.createApp({ bundleIdentifier: 'com.example.myapp', accountId: account.id })
        const token = await testUtils.createToken({ appId: app.id, accountId: account.id })
        
        const response = await server.inject({
            method: 'POST',
            url: '/api/builds',
            headers: {
                authorization: testUtils.getAuthHeaderForTokenValue(token.get('value'))
            },
            payload: {}
        })
        
        expect(response.statusCode).to.equal(201)
        expect(response.result).to.deep.equal({
            buildNumber: 1,
            metadata: {}
        })
    })
    
    it('is sequential', async() => {
        
        const account = await testUtils.createAccount({ emailAddress: 'buildnumber-dev-test@yopmail.com' })
        const app = await testUtils.createApp({ bundleIdentifier: 'com.example.myapp', accountId: account.id })
        const token = await testUtils.createToken({ appId: app.id, accountId: account.id })
        const build = await testUtils.createBuild({ appId: app.id, buildNumber: 10 })
        
        const response = await server.inject({
            method: 'POST',
            url: '/api/builds',
            headers: {
                authorization: testUtils.getAuthHeaderForTokenValue(token.get('value'))
            },
            payload: {}
        })
        expect(response.statusCode).to.equal(201)
        expect(response.result).to.deep.equal({
            buildNumber: build.get('buildNumber') + 1,
            metadata: {}
        })
    })
    
    it('allows providing metadata', async() => {
        
        const account = await testUtils.createAccount({ emailAddress: 'buildnumber-dev-test@yopmail.com' })
        const app = await testUtils.createApp({ bundleIdentifier: 'com.example.myapp', accountId: account.id })
        const token = await testUtils.createToken({ appId: app.id, accountId: account.id })
        
        const response = await server.inject({
            method: 'POST',
            url: '/api/builds',
            headers: {
                authorization: testUtils.getAuthHeaderForTokenValue(token.get('value'))
            },
            payload: {
                metadata: {
                    head: 'abcdef'
                }
            }
        })
        expect(response.statusCode).to.equal(201)
        expect(response.result).to.deep.equal({
            buildNumber: 1,
            metadata: {
                head: 'abcdef'
            }
        })
    })
})

describe('GET /builds/last', async() => {
    it('fails if no token provided', async() => {
        const response = await server.inject({
            method: 'GET',
            url: '/api/builds/last',
            headers: { authorization: '' },
        })
        expect(response.statusCode).to.equal(401)
    })
    
    it('fails if invalid token provided', async() => {
        const response = await server.inject({
            method: 'GET',
            url: '/api/builds/last',
            headers: {
                authorization: testUtils.getAuthHeaderForTokenValue('does-not-exist-but-is-long-enough')
            },
        })
        expect(response.statusCode).to.equal(401)
    })
    
    it('returns 404 if there is no build for this app', async() => {
        
        const account = await testUtils.createAccount({ emailAddress: 'buildnumber-dev-test@yopmail.com' })
        const app = await testUtils.createApp({ bundleIdentifier: 'com.example.myapp', accountId: account.id })
        const token = await testUtils.createToken({ appId: app.id, accountId: account.id })
        
        const response = await server.inject({
            method: 'GET',
            url: '/api/builds/last',
            headers: {
                authorization: testUtils.getAuthHeaderForTokenValue(token.get('value'))
            },
            payload: {}
        })
        
        expect(response.statusCode).to.equal(404)
    })
    
    it('works without metadata', async() => {
        
        const account = await testUtils.createAccount({ emailAddress: 'buildnumber-dev-test@yopmail.com' })
        const app = await testUtils.createApp({ bundleIdentifier: 'com.example.myapp', accountId: account.id })
        const token = await testUtils.createToken({ appId: app.id, accountId: account.id })
        await testUtils.createBuild({ appId: app.id, buildNumber: 10 })
        
        const response = await server.inject({
            method: 'GET',
            url: '/api/builds/last',
            headers: {
                authorization: testUtils.getAuthHeaderForTokenValue(token.get('value'))
            },
            payload: {}
        })
        
        expect(response.statusCode).to.equal(200)
        expect(response.result).to.deep.equal({
            buildNumber: 10,
            metadata: {}
        })
    })
    
    it('works with metadata', async() => {
        
        const account = await testUtils.createAccount({ emailAddress: 'buildnumber-dev-test@yopmail.com' })
        const app = await testUtils.createApp({ bundleIdentifier: 'com.example.myapp', accountId: account.id })
        const token = await testUtils.createToken({ appId: app.id, accountId: account.id })
        await testUtils.createBuild({ appId: app.id, buildNumber: 10, metadata: { head: 'abcdef' }})
        
        const response = await server.inject({
            method: 'GET',
            url: '/api/builds/last',
            headers: {
                authorization: testUtils.getAuthHeaderForTokenValue(token.get('value'))
            },
            payload: {}
        })
        
        expect(response.statusCode).to.equal(200)
        expect(response.result).to.deep.equal({
            buildNumber: 10,
            metadata: { head: 'abcdef' }
        })
    })
    
    it('only returns the highest build number, even if created before another one', async() => {
        
        const account = await testUtils.createAccount({ emailAddress: 'buildnumber-dev-test@yopmail.com' })
        const app = await testUtils.createApp({ bundleIdentifier: 'com.example.myapp', accountId: account.id })
        const token = await testUtils.createToken({ appId: app.id, accountId: account.id })
        await testUtils.createBuild({ appId: app.id, buildNumber: 9 })
        await testUtils.createBuild({ appId: app.id, buildNumber: 11 })
        await testUtils.createBuild({ appId: app.id, buildNumber: 10 })
        
        const response = await server.inject({
            method: 'GET',
            url: '/api/builds/last',
            headers: {
                authorization: testUtils.getAuthHeaderForTokenValue(token.get('value'))
            },
            payload: {}
        })
        
        expect(response.statusCode).to.equal(200)
        expect(response.result).to.deep.equal({
            buildNumber: 11,
            metadata: {}
        })
    })
})
