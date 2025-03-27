const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const isDevelopment = process.env.NODE_ENV === 'development';

module.exports = {
  mode: isDevelopment ? 'development' : 'production',
  target: isDevelopment ? 'web' : 'browserslist',
  entry: {
    main: './src/js/index.js',
    styles: './src/scss/main.scss'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'js/[name].[contenthash].js',
    clean: true,
    assetModuleFilename: 'assets/[hash][ext][query]',
    publicPath: '/'
  },
  devtool: isDevelopment ? 'eval-source-map' : 'source-map',
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    historyApiFallback: true,
    open: true,
    compress: true,
    hot: false,
    port: 3001,
    host: 'localhost',
    client: {
      overlay: {
        errors: true,
        warnings: false,
      },
      progress: true,
    },
  },
  stats: 'minimal',
  infrastructureLogging: {
    level: 'warn',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
      {
        test: /\.scss$/,
        use: [
          isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              sourceMap: isDevelopment
            }
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: isDevelopment,
              implementation: require('sass'),
            },
          },
        ],
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/images/[hash][ext][query]'
        }
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/fonts/[hash][ext][query]'
        }
      },
      {
        test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/media/[hash][ext][query]'
        }
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      inject: true
    }),
    new MiniCssExtractPlugin({
      filename: isDevelopment ? '[name].css' : '[name].[contenthash].css',
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
          from: 'src/assets/images/svg/Logo.svg',
          to: 'assets/icons/Logo.svg'
        }
      ]
    })
  ],
  optimization: {
    moduleIds: 'deterministic',
    runtimeChunk: 'single',
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
  },
}; 