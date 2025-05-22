const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

const isDevelopment = process.env.NODE_ENV === 'development';
const repoName = 'Metaverse'; // Имя вашего репозитория

module.exports = {
  mode: isDevelopment ? 'development' : 'production',
  entry: ['./src/js/index.js', './src/scss/main.scss'],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'js/[name].js',
    clean: true,
    publicPath: isDevelopment ? '/' : './',
    assetModuleFilename: 'assets/[name][ext]'
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist')
    },
    port: 3002,
    host: '0.0.0.0',
    hot: false,
    liveReload: true,
    open: true,
    watchFiles: ['src/**/*'],
    client: {
      webSocketURL: 'auto://0.0.0.0:0/ws'
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
      },
      {
        test: /\.svg$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/svg/[name][ext]'
        }
      },
      {
        test: /\.(glsl|vs|fs|vert|frag)$/,
        use: 'raw-loader'
      }
    ]
  },
  optimization: {
    minimize: !isDevelopment,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            pure_funcs: ['console.log', 'console.info'],
          },
        },
        extractComments: false,
      }),
    ],
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
          from: 'src/assets/icons',
          to: 'assets/icons'
        },
        {
          from: 'src/assets/images',
          to: 'assets/images'
        }
      ]
    })
  ]
}; 