'use strict'

module.exports = bookshelf => {
    
    const Account = bookshelf.model('Account')
    
    return bookshelf.model('Token', {
        tableName: 'tokens',
        account() {
            return this.belongsTo(Account)
        },
    })
}
