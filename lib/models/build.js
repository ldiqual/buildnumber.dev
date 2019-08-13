'use strict'

module.exports = bookshelf => {
    
    const App = bookshelf.model('App')
    
    return bookshelf.model('Build', {
        tableName: 'builds',
        account() {
            return this.belongsTo(App)
        },
    })
}
