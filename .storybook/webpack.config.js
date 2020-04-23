const path = require('path')
module.exports = ({ config }) => {
  config.module.rules.push({
    test: /\.(ts|tsx)$/,
    use: [
      {
        loader: require.resolve('awesome-typescript-loader'),
        options: {
          presets: [
            [
              'react-app',
              {
                flow: false,
                typescript: true
              }
            ]
          ],
          configFileName: './.storybook/tsconfig.json'
        }
      },
      {
        loader: require.resolve('react-docgen-typescript-loader')
      }
    ]
  })
  config.module.rules.push({
    test: /\.css$/,
    loaders: [
      {
        loader: 'postcss-loader',
        options: {
          sourceMap: true,
          config: {
            path: './.storybook'
          }
        }
      }
    ],
    include: path.resolve(__dirname, '../')
  })
  config.module.rules.push({
    test: /\.pcss$/,
    loaders: [
      {
        loader: 'postcss-loader',
        options: {
          sourceMap: true,
          config: {
            path: './.storybook'
          }
        }
      }
    ],
    include: path.resolve(__dirname, '../')
  })
  config.resolve.extensions.push('.ts', '.tsx')
  return config
}
