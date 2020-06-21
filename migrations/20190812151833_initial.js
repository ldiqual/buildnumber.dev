'use strict'

exports.up = function (knex) {
  const columns = require('../lib/columnTypes')(knex)

  return knex.schema
    .raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    .createTable('accounts', function (t) {
      columns.pk(t)
      columns.createdAt(t)
      t.string('email_address', 255).unique().notNullable()
    })
    .createTable('apps', function (t) {
      columns.pk(t)
      columns.createdAt(t)
      t.uuid('account_id').references('accounts.id').notNullable()
      t.string('bundle_identifier', 255).notNullable()
      t.unique(['account_id', 'bundle_identifier'])
    })
    .createTable('tokens', function (t) {
      columns.pk(t)
      columns.createdAt(t)
      t.uuid('account_id').references('accounts.id').notNullable()
      t.uuid('app_id').references('apps.id').notNullable()
      t.string('value', 16).unique().notNullable()
    })
    .createTable('builds', function (t) {
      columns.pk(t)
      columns.createdAt(t)
      t.uuid('app_id').references('apps.id').notNullable()
      t.bigInteger('build_number').notNullable()
      t.json('metadata').defaultTo('{}')
      t.unique(['app_id', 'build_number'])
    })
}

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('accounts')
    .dropTableIfExists('apps')
    .dropTableIfExists('tokens')
    .dropTableIfExists('builds')
}
