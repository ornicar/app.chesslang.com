import { configure, addParameters } from '@storybook/react'

import {
  INITIAL_VIEWPORTS
  // or MINIMAL_VIEWPORTS,
} from '@storybook/addon-viewport'
import '../src/tailwindcss.pcss'
import './util.css'

const customViewports = {
  kindleFire2: {
    name: 'Kindle Fire 2',
    styles: {
      width: '600px',
      height: '963px'
    }
  },
  kindleFireHD: {
    name: 'Kindle Fire HD',
    styles: {
      width: '533px',
      height: '801px'
    }
  }
}

addParameters({
  viewport: {
    viewports: {
      ...INITIAL_VIEWPORTS,
      // or ...MINIMAL_VIEWPORTS,
      ...customViewports
    }
  }
})

const req = require.context('../src/components', true, /.stories.(tsx|mdx)/)

function loadStories() {
  req.keys().forEach(req)
}

configure(loadStories, module)
