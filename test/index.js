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
                emailAddress: 'me@example.com',
            }
        })
        expect(response.statusCode).to.equal(400)
    })
    
    it('fails if invalid bundle indentifier', async() => {
        const response = await server.inject({
            method: 'POST',
            url: '/api/tokens',
            payload: {
                emailAddress: 'me@example.com',
                bundleIdentifier: 'aa'
            }
        })
        expect(response.statusCode).to.equal(400)
    })
    
    it('fails if same email + bundle indentifier was used', async() => {
        
        const account = await testUtils.createAccount({ emailAddress: 'me@example.com' })
        await testUtils.createApp({ bundleIdentifier: 'com.example.myapp', accountId: account.id })
        
        const response = await server.inject({
            method: 'POST',
            url: '/api/tokens',
            payload: {
                emailAddress: 'me@example.com',
                bundleIdentifier: 'com.example.myapp'
            }
        })
        expect(response.statusCode).to.equal(409)
    })
    
    it('succeeds with proper email + bundle indentifier', async() => {
        const response = await server.inject({
            method: 'POST',
            url: '/api/tokens',
            payload: {
                emailAddress: 'me@example.com',
                bundleIdentifier: 'com.example.myapp'
            }
        })
        expect(response.statusCode).to.equal(201)
    })
})
