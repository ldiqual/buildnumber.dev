'use strict'

require('dotenv').config()

const debug = process.env.DEBUG === 'true'

let pgConnectionString = null
if (process.env.NODE_ENV === 'development') {
    pgConnectionString = 'postgres://postgres:@localhost:5432/buildnumber-dev'
} else if (process.env.NODE_ENV === 'test') {
    pgConnectionString = 'postgres://postgres:@localhost:5432/buildnumber-test'
}

module.exports = {
    debug,
    pgConnectionString,
    mailgun: {
        secretApiKey: process.env.MAILGUN_SECRET_API_KEY,
        domain: process.env.MAILGUN_DOMAIN
    }
}
