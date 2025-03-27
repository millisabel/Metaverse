const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const isDevelopment = process.env.NODE_ENV === 'development';

module.exports = {
  mode: isDevelopment ? 'development' : 'production',
  entry: ['./src/js/index.js', './src/scss/main.scss'],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'js/[name].js',
    clean: true,
    publicPath: '/'
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
      watch: {
        ignored: /node_modules/,
        usePolling: true,
        interval: 1000
      }
    },
    watchFiles: {
      paths: ['src/**/*'],
      options: {
        usePolling: true,
        interval: 1000
      }
    },
    compress: true,
    port: 3001,
    host: 'localhost',
    hot: false,
    liveReload: true,
    open: true,
    client: {
      logging: 'warn',
      overlay: true
    }
  },
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: [
          'style-loader',
          'css-loader',
          'postcss-loader',
          'sass-loader'
        ]
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html'
    }),
    new MiniCssExtractPlugin({
      filename: 'css/[name].css'
    }),
    new CopyWebpackPlugin({
      patterns: [
        { 
          from: 'src/manifest.json',
          to: 'manifest.json'
        },
        {
          from: 'src/assets/icons/favicon*.png',
          to: 'assets/icons/[name][ext]'
        },
        {
          from: 'src/assets/icons/apple-touch-icon.png',
          to: 'assets/icons/apple-touch-icon.png'
        },
        {
          from: 'src/assets/icons/Logo.svg',
          to: 'assets/icons/Logo.svg'
        }
      ]
    })
  ]
}; 