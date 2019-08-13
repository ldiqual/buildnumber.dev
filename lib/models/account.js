'use strict'

module.exports = bookshelf => {
    
    const App = bookshelf.model('App')
    const Token = bookshelf.model('Token')
    
    return bookshelf.model('Account', {
        tableName: 'accounts',
        apps() {
            return this.hasMany(App)
        },
        tokens() {
            return this.hasMany(Token)
        }
    })
}
