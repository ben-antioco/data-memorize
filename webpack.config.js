const webpack           = require('webpack');
const path              = require('path');
const folder            = __dirname;
const dev               = process.env.NODE_ENV === "dev"
const UglifyJSPlugin    = require('uglifyjs-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const CleanWebpackPlugin = require('clean-webpack-plugin')

let pathToClean = [
    './build/*.*'
]

let cleanOptions = {
    root: folder,
    exclude: ['index.js'],
    verbose: true,
    dry: false
}

let cssLoader = [
    { loader: 'css-loader', options: { importLoaders: 1, minimize: !dev } }
]


if( !dev ){
    cssLoader.push({
        loader: 'postcss-loader', options :{
            plugins: (loader) => [
                require('autoprefixer')({
                    browsers: ['last 2 versions']
                })
            ]
        }
    })
}

const config = {
  entry: './assets/js/index.js',
  watch: dev,
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'index.bundle.js',
    publicPath: "/build/"
  },
  devtool: dev ? 'cheap-module-eval-source-map' : false,
  module: {
    rules: [
    {
      test: /\.css$/,
      use: ExtractTextPlugin.extract({
        fallback: 'style-loader',
        use: cssLoader
      })
    },
    {
        test: /\.(sass|scss)$/,
        use: ExtractTextPlugin.extract({
            fallback: "style-loader",
            use: [ ...cssLoader, 'sass-loader' ]
        })
    },
    {
      test: /\.(png|woff|woff2|eot|ttf|svg)$/,
      loader: 'url-loader?limit=100000'
    },
    {
      test: /\.(png|jpg|gif)$/,
      use: [
        {
          loader: 'file-loader',
          options: {}
        }
      ]
    },
    {
       test: /\.js$/,
       loader: 'babel-loader',
       exclude: /node_modules/,
       query: {
           presets: ['env']
       }
    }
    ]
  },
  plugins: [
    new ExtractTextPlugin({
        filename: 'style.css',
        disable: dev
    }),
    new CleanWebpackPlugin(pathToClean, cleanOptions)
  ]
};

 if(!dev){
    config.plugins.push(new UglifyJSPlugin({
        sourceMap: false
    }))
 }

module.exports = config;
