'use strict'

const { initServer } = require('../server')
const expect = require('chai').expect
const testUtils = require('../lib/testUtils')
let server = null

before(async() => {
    server = await initServer()
})

// Would love this to be automatic :(
after(async() => {
    await testUtils.closeDatabaseConnection()
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
    
    it('fails if no bundle identifier', async() => {
        const response = await server.inject({
            method: 'POST',
            url: '/api/tokens',
            payload: {
                emailAddress: 'buildnumber-dev-test@yopmail.com',
            }
        })
        expect(response.statusCode).to.equal(400)
    })
    
    it('fails if bundle identifier is too short', async() => {
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
    
    it('fails if bundle identifier contains special characters', async() => {
        const response = await server.inject({
            method: 'POST',
            url: '/api/tokens',
            payload: {
                emailAddress: 'buildnumber-dev-test@yopmail.com',
                bundleIdentifier: 'com.example.my_awesome-app2*'
            }
        })
        expect(response.statusCode).to.equal(400)
    })
    
    it('succeeds if bundle identifier is valid', async() => {
        const response = await server.inject({
            method: 'POST',
            url: '/api/tokens',
            payload: {
                emailAddress: 'buildnumber-dev-test@yopmail.com',
                bundleIdentifier: 'com.example.my_awesome-app2'
            }
        })
        expect(response.statusCode).to.equal(201)
    })
    
    it('fails if same email + bundle identifier was used', async() => {
        
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
    
    it('succeeds with proper email + bundle identifier', async() => {
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
                authorization: testUtils.getAuthHeaderForTokenValue('does-not-exist--')
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
        await testUtils.createBuild({ appId: app.id, buildNumber: 10 })
        
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
            buildNumber: 11,
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
    
    it('outputs the build number directly when asked', async() => {
        const account = await testUtils.createAccount({ emailAddress: 'buildnumber-dev-test@yopmail.com' })
        const app = await testUtils.createApp({ bundleIdentifier: 'com.example.myapp', accountId: account.id })
        const token = await testUtils.createToken({ appId: app.id, accountId: account.id })
        
        const response = await server.inject({
            method: 'POST',
            url: '/api/builds?output=buildNumber',
            headers: {
                authorization: testUtils.getAuthHeaderForTokenValue(token.get('value'))
            },
            payload: {}
        })
        
        expect(response.statusCode).to.equal(201)
        expect(response.result).to.equal('1')
    })
    
    it('rejects invalid output query params', async() => {
        const account = await testUtils.createAccount({ emailAddress: 'buildnumber-dev-test@yopmail.com' })
        const app = await testUtils.createApp({ bundleIdentifier: 'com.example.myapp', accountId: account.id })
        const token = await testUtils.createToken({ appId: app.id, accountId: account.id })
        await testUtils.createBuild({ appId: app.id, buildNumber: 10, metadata: { head: 'abcdef' }})
        
        const response = await server.inject({
            method: 'POST',
            url: '/api/builds?output=metadata',
            headers: {
                authorization: testUtils.getAuthHeaderForTokenValue(token.get('value'))
            },
            payload: {}
        })
        
        expect(response.statusCode).to.equal(400)
    })
    
    it('accepts an empty payload', async() => {
        const account = await testUtils.createAccount({ emailAddress: 'buildnumber-dev-test@yopmail.com' })
        const app = await testUtils.createApp({ bundleIdentifier: 'com.example.myapp', accountId: account.id })
        const token = await testUtils.createToken({ appId: app.id, accountId: account.id })
        await testUtils.createBuild({ appId: app.id, buildNumber: 10, metadata: { head: 'abcdef' }})
        
        const response = await server.inject({
            method: 'POST',
            url: '/api/builds',
            headers: {
                authorization: testUtils.getAuthHeaderForTokenValue(token.get('value'))
            },
            payload: null
        })
        
        expect(response.statusCode).to.equal(201)
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
            }
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
            }
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
            }
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
            }
        })
        
        expect(response.statusCode).to.equal(200)
        expect(response.result).to.deep.equal({
            buildNumber: 11,
            metadata: {}
        })
    })
    
    it('outputs the build number directly when asked', async() => {
        const account = await testUtils.createAccount({ emailAddress: 'buildnumber-dev-test@yopmail.com' })
        const app = await testUtils.createApp({ bundleIdentifier: 'com.example.myapp', accountId: account.id })
        const token = await testUtils.createToken({ appId: app.id, accountId: account.id })
        await testUtils.createBuild({ appId: app.id, buildNumber: 10, metadata: { head: 'abcdef' }})
        
        const response = await server.inject({
            method: 'GET',
            url: '/api/builds/last?output=buildNumber',
            headers: {
                authorization: testUtils.getAuthHeaderForTokenValue(token.get('value'))
            }
        })
        
        expect(response.statusCode).to.equal(200)
        expect(response.result).to.equal('10')
    })
    
    it('rejects invalid output query params', async() => {
        const account = await testUtils.createAccount({ emailAddress: 'buildnumber-dev-test@yopmail.com' })
        const app = await testUtils.createApp({ bundleIdentifier: 'com.example.myapp', accountId: account.id })
        const token = await testUtils.createToken({ appId: app.id, accountId: account.id })
        await testUtils.createBuild({ appId: app.id, buildNumber: 10, metadata: { head: 'abcdef' }})
        
        const response = await server.inject({
            method: 'GET',
            url: '/api/builds/last?output=metadata',
            headers: {
                authorization: testUtils.getAuthHeaderForTokenValue(token.get('value'))
            }
        })
        
        expect(response.statusCode).to.equal(400)
    })
})

describe('GET /builds/{buildNumber}', async() => {
    it('fails if no token provided', async() => {
        const response = await server.inject({
            method: 'GET',
            url: '/api/builds/10',
            headers: { authorization: '' },
        })
        expect(response.statusCode).to.equal(401)
    })
    
    it('fails if invalid token provided', async() => {
        const response = await server.inject({
            method: 'GET',
            url: '/api/builds/10',
            headers: {
                authorization: testUtils.getAuthHeaderForTokenValue('does-not-exist-but-is-long-enough')
            },
        })
        expect(response.statusCode).to.equal(401)
    })
    
    it('returns 404 if there is no such build number for this app', async() => {
        
        const account = await testUtils.createAccount({ emailAddress: 'buildnumber-dev-test@yopmail.com' })
        const app = await testUtils.createApp({ bundleIdentifier: 'com.example.myapp', accountId: account.id })
        const token = await testUtils.createToken({ appId: app.id, accountId: account.id })
        await testUtils.createBuild({ appId: app.id, buildNumber: 9 })
        await testUtils.createBuild({ appId: app.id, buildNumber: 11 })
        
        const response = await server.inject({
            method: 'GET',
            url: '/api/builds/10',
            headers: {
                authorization: testUtils.getAuthHeaderForTokenValue(token.get('value'))
            }
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
            url: '/api/builds/10',
            headers: {
                authorization: testUtils.getAuthHeaderForTokenValue(token.get('value'))
            }
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
            url: '/api/builds/10',
            headers: {
                authorization: testUtils.getAuthHeaderForTokenValue(token.get('value'))
            }
        })
        
        expect(response.statusCode).to.equal(200)
        expect(response.result).to.deep.equal({
            buildNumber: 10,
            metadata: { head: 'abcdef' }
        })
    })
    
    it('outputs the build number directly when asked', async() => {
        const account = await testUtils.createAccount({ emailAddress: 'buildnumber-dev-test@yopmail.com' })
        const app = await testUtils.createApp({ bundleIdentifier: 'com.example.myapp', accountId: account.id })
        const token = await testUtils.createToken({ appId: app.id, accountId: account.id })
        await testUtils.createBuild({ appId: app.id, buildNumber: 10, metadata: { head: 'abcdef' }})
        
        const response = await server.inject({
            method: 'GET',
            url: '/api/builds/10?output=buildNumber',
            headers: {
                authorization: testUtils.getAuthHeaderForTokenValue(token.get('value'))
            }
        })
        
        expect(response.statusCode).to.equal(200)
        expect(response.result).to.equal('10')
    })
    
    it('rejects invalid output query params', async() => {
        const account = await testUtils.createAccount({ emailAddress: 'buildnumber-dev-test@yopmail.com' })
        const app = await testUtils.createApp({ bundleIdentifier: 'com.example.myapp', accountId: account.id })
        const token = await testUtils.createToken({ appId: app.id, accountId: account.id })
        await testUtils.createBuild({ appId: app.id, buildNumber: 10, metadata: { head: 'abcdef' }})
        
        const response = await server.inject({
            method: 'GET',
            url: '/api/builds/10?output=metadata',
            headers: {
                authorization: testUtils.getAuthHeaderForTokenValue(token.get('value'))
            },
        })
        
        expect(response.statusCode).to.equal(400)
    })
})

describe('CORS in production', async() => {
    it('allows www.buildnumber.dev to query api.buildnumber.dev', async() => {
        
        async function validateEndpoint({ method, endpoint }) {
            const response = await server.inject({
                method: 'OPTIONS',
                url: endpoint,
                headers: {
                    'Host': 'api.buildnumber.dev',
                    'Access-Control-Request-Method': method,
                    'Origin': 'https://www.buildnumber.dev',
                }
            })
            
            expect(response.headers['access-control-allow-origin']).to.equal('https://www.buildnumber.dev')
            expect(response.headers['access-control-allow-methods']).to.equal(method)
            expect(response.headers).to.contain.key('access-control-allow-headers')
        }
                
        await validateEndpoint({ method: 'POST', endpoint: '/tokens' })
        await validateEndpoint({ method: 'POST', endpoint: '/builds' })
        await validateEndpoint({ method: 'GET', endpoint: '/builds/last' })
        await validateEndpoint({ method: 'GET', endpoint: '/builds/10' })
    })
})

describe('the routing system', async() => {
    it('only delivers static files on www', async() => {
        
        const staticResponse = await server.inject({
            method: 'GET',
            url: '/index.html',
            headers: {
                'Host': 'www.buildnumber.dev',
            }
        })
        expect(staticResponse.statusCode).to.equal(200)
        
        const apiResponse = await server.inject({
            method: 'OPTIONS',
            url: '/api/tokens',
            headers: {
                'Host': 'www.buildnumber.dev',
                'Access-Control-Request-Method': 'POST',
                'Origin': 'https://www.buildnumber.dev',
            }
        })
        expect(apiResponse.statusCode).to.equal(404)
    })
    
    it('only serves the api on api.buildnumber.dev', async() => {
        
        const staticResponse = await server.inject({
            method: 'GET',
            url: '/index.html',
            headers: {
                'Host': 'api.buildnumber.dev',
            }
        })
        expect(staticResponse.statusCode).to.equal(404)
        
        const apiResponse = await server.inject({
            method: 'OPTIONS',
            url: '/tokens',
            headers: {
                'Host': 'api.buildnumber.dev',
                'Access-Control-Request-Method': 'POST',
                'Origin': 'https://www.buildnumber.dev',
            }
        })
        expect(apiResponse.statusCode).to.equal(200)
    })
    
    it('delivers both api and static files locally', async() => {
        
        const staticResponse = await server.inject({
            method: 'GET',
            url: '/index.html',
            headers: {
                'Host': server.info.host,
            }
        })
        expect(staticResponse.statusCode).to.equal(200)
        
        const apiResponse = await server.inject({
            method: 'OPTIONS',
            url: '/api/tokens',
            headers: {
                'Host': server.info.host,
                'Access-Control-Request-Method': 'POST',
                'Origin': 'https://www.buildnumber.dev',
            }
        })
        expect(apiResponse.statusCode).to.equal(200)
    })
    
    it('redirects root requests to www', async() => {
        
        const response = await server.inject({
            method: 'GET',
            url: '/index.html',
            headers: {
                'Host': 'buildnumber.dev',
            }
        })
        expect(response.statusCode).to.equal(301)
        expect(response.headers.location).to.equal('https://www.buildnumber.dev/index.html')
    })
})
