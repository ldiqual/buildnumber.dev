'use strict'

const { initServer } = require('../server')
const expect = require('chai').expect
let server = null

before(async() => {
    server = await initServer()
})

describe('POST /tokens', async() => {
    it('fails if no email', async() => {
        const response = await server.inject({
            method: 'POST',
            url: '/api/tokens',
            payload: {
                appIdentifier: 'com.example.myapp'
            }
        })
        expect(response.statusCode).to.equal(400)
    })
    
    it('fails if invalid email', async() => {
        const response = await server.inject({
            method: 'POST',
            url: '/api/tokens',
            payload: {
                email: 'invalidemail',
                appIdentifier: 'com.example.myapp'
            }
        })
        expect(response.statusCode).to.equal(400)
    })
    
    it('fails if no app identifier', async() => {
        const response = await server.inject({
            method: 'POST',
            url: '/api/tokens',
            payload: {
                email: 'me@example.com',
            }
        })
        expect(response.statusCode).to.equal(400)
    })
    
    it('fails if invalid app identifier', async() => {
        const response = await server.inject({
            method: 'POST',
            url: '/api/tokens',
            payload: {
                email: 'me@example.com',
                appIdentifier: 'aa'
            }
        })
        expect(response.statusCode).to.equal(400)
    })
    
    it('fails if same email + app identifier was used', async() => {
        await server.inject({
            method: 'POST',
            url: '/api/tokens',
            payload: {
                email: 'me@example.com',
                appIdentifier: 'com.example.myapp'
            }
        })
        const response = await server.inject({
            method: 'POST',
            url: '/api/tokens',
            payload: {
                email: 'me@example.com',
                appIdentifier: 'com.example.myapp'
            }
        })
        expect(response.statusCode).to.equal(409)
    })
    
    it('succeeds with proper email + app identifier', async() => {
        const response = await server.inject({
            method: 'POST',
            url: '/api/tokens',
            payload: {
                email: 'me@example.com',
                appIdentifier: 'com.example.myapp'
            }
        })
        expect(response.statusCode).to.equal(201)
    })
})
