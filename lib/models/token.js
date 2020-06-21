'use strict'

module.exports = (bookshelf) => {
  const Account = bookshelf.model('Account')
  const App = bookshelf.model('App')

  return bookshelf.model('Token', {
    tableName: 'tokens',
    account() {
      return this.belongsTo(Account)
    },
    app() {
      return this.belongsTo(App)
    },
  })
}
