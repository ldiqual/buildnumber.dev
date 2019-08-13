'use strict'

let pgConnectionString = null
if (process.env.NODE_ENV === 'development') {
    pgConnectionString = 'postgres://postgres:@localhost:5432/buildnumber-dev'
} else if (process.env.NODE_ENV === 'test') {
    pgConnectionString = 'postgres://postgres:@localhost:5432/buildnumber-test'
}

module.exports = {
    pgConnectionString
}
