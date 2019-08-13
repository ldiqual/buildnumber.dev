'use strict'

// Load .env if not in prod
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

// Look for debug flag
const isDebug = process.env.DEBUG === 'true'
const isTest = process.env.NODE_ENV === 'test'
const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'

// All config
module.exports = {
    isDebug,
    isTest,
    isDevelopment,
    isProduction,
    pgConnectionString: isTest ? process.env.DATABASE_URL_TEST : process.env.DATABASE_URL,
    mailgun: {
        secretApiKey: process.env.MAILGUN_SECRET_API_KEY,
        domain: isTest ? process.env.MAILGUN_DOMAIN_TEST : process.env.MAILGUN_DOMAIN
    }
}
