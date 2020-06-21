'use strict'

module.exports = (bookshelf) => {
  const Account = bookshelf.model('Account')
  const Build = bookshelf.model('Build')

  return bookshelf.model('App', {
    tableName: 'apps',
    account() {
      return this.belongsTo(Account)
    },
    builds() {
      return this.hasMany(Build)
    },
  })
}
