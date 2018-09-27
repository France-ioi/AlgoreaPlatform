var path = require('path');
var webpack = require('webpack');
var UglifyPlugin = require('uglifyjs-webpack-plugin');
var MiniCssExtractPlugin = require("mini-css-extract-plugin");
var OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
var BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = function(env) {
    var production = process.env.NODE_ENV === 'production';

    var plugins = [
        new webpack.ProvidePlugin({
            '$': 'jquery',
            'jQuery': 'jquery',
            'window.jQuery': 'jquery',
            'window.$': 'jquery',
            '_': 'lodash',
        }),
        new MiniCssExtractPlugin({
            filename: "[name].css",
        }),
        new OptimizeCssAssetsPlugin({
            cssProcessor: require('cssnano'),
            cssProcessorPluginOptions: {
              preset: ['default', { discardComments: { removeAll: true } }],
            },
            canPrint: true
        }),
        new webpack.DefinePlugin({
            WEBPACK_ENV: {
                USE_FORUM: !!process.env.USE_FORUM,
                USE_MAP: !!process.env.USE_MAP,
                DEFAULT_LOCALE: JSON.stringify(process.env.DEFAULT_LOCALE || 'fr-fr')
            }
        }),
        //new BundleAnalyzerPlugin()
    ];

    if(production) {
        plugins.push(
            new UglifyPlugin({
                //sourceMap: true,
                parallel: true
            })
        )
    }

    return {
        devtool: production ? false : 'cheap-module-source-map',
        entry: {
            app: './src/app.js',
            templates: './src/templates.js'
        },
        watchOptions: {
            ignored: [
                /node_modules/,
                /bower_components/
            ],
        },
        output: {
            path: path.resolve(__dirname, 'assets'),
            filename: '[name].js'
        },
        plugins: plugins,
        optimization: {
            splitChunks: {
                cacheGroups: {
                    vendor: {
                        test: /[\\/]node_modules|bower_components[\\/]/,
                        name: 'vendor',
                        chunks: 'all'
                    }
                }
            }
        },
        module: {
            rules: [
                {
                    test: /\.(css)$/,
                    use: [
                        {
                            loader: MiniCssExtractPlugin.loader
                        },
                        'css-loader'
                    ]
                },
                {
                    test: /\.(png|jpg|gif)$/,
                    loader: 'file-loader?name=images/[name].[ext]'
                },
                {
                    test: /\.(eot|svg|ttf|woff|woff2)$/,
                    loader: 'file-loader?name=fonts/[name].[ext]'
                },
                {
                    test: /\.html$/,
                    use: [
                        {
                            loader: 'ngtemplate-loader',
                            options: {
                                relativeTo: __dirname
                            }
                        },
                        'html-loader'
                    ]

                }
            ]
        }
    }
};