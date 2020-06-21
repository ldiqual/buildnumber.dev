'use strict'

module.exports = function (knex) {
  return {
    pk: function (table) {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
    },

    createdAt: function (table) {
      table
        .specificType('created_at', 'timestamp(3) with time zone')
        .notNullable()
        .defaultTo(knex.raw('now()'))
    },

    ts: function (table, columnName) {
      return table.specificType(columnName, 'timestamp(3) with time zone')
    },
  }
}
