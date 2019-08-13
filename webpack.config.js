'use strict'

const path = require('path')

module.exports = {
    entry: './static/js/app.js',
    output: {
        filename: 'app.js',
        path: path.resolve(__dirname, 'static/dist')
    },
    module: {
        rules: [{
            test: /\.css$/,
            use: ['style-loader', 'css-loader']
        }, {
            test: /\.(js|jsx)$/,
            exclude: /node_modules/,
            use: {
                loader: 'babel-loader'
            }
        }]
    },
    node: {
        net: 'empty',
    }
}
