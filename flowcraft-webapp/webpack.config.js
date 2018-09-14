const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
    devtool: 'cheap-module-source-map',
    resolve: {
        alias: {
            // 'lodash': 'lodash/core',
            // 'moment': 'moment/src/moment',
        },
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader"
                }
            },
            {
                test: /\.css$/,
                use: [ "style-loader", "css-loader" ]
            },
            {
                test: /\.(png|woff|woff2|eot|ttf|svg)$/,
                loader: "url-loader"
            }
        ]
    },
    // plugins: [
    //     new UglifyJsPlugin()
    // ],
    mode: "production",
    // optimization: {
    //     minimizer: [
    //         new UglifyJsPlugin()
    //     ]
    // }
};


