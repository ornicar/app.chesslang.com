const path = require('path')
import '@storybook/addon-viewport/register'
import '@storybook/addon-docs/register'

module.exports = {
  stories: ['../src/components/**/*.stories.(tsx|mdx)'],
  addons: [
    {
      name: '@storybook/addon-docs',
      options: {
        configureJSX: true
      }
    }
  ]
}
