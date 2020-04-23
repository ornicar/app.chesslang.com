import * as R from 'ramda'
import * as jsEnv from 'browser-or-node'
import { observable, action, computed } from 'mobx'

import { userStore } from './user'

const TWO_MINUTES = 2 * 60 * 1000

export class PreferencesStore {
  static BOARD_THEME_CHOICES = [
    ['#f0d9b5', '#b58863', 'brown'],
    ['#dee3e6', '#8ca2ad', 'gray'],
    ['#ffffdd', '#86a666', 'green'],
    ['#9f90b0', '#7d4a8d', 'purple']
  ]

  static BRAND_COLOR_CHOICES = [
    '#CACACA',
    '#1D3461',
    '#1F487E',
    '#376996',
    '#119DA4',
    '#0C7489',
    '#13505B',
    '#CC444B',
    '#DA5552',
    '#6320EE'
  ]

  @observable preferences: {
    [key: string]: any
  } = {}

  @observable loading: boolean = true
  @observable error: string = ''
  private lastLoadTime = 0

  constructor(initValues: any = {}) {
    if (initValues.preferences) {
      this.preferences = initValues.preferences
    }
    this.loading = initValues.loading || true
    this.error = initValues.error || ''
  }

  hexToRGB = (hex: string, alpha: string | number) => {
    var r = parseInt(hex.slice(1, 3), 16),
      g = parseInt(hex.slice(3, 5), 16),
      b = parseInt(hex.slice(5, 7), 16)

    if (alpha) {
      return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')'
    } else {
      return 'rgb(' + r + ', ' + g + ', ' + b + ')'
    }
  }

  private isStale = () => {
    const current = +new Date()
    return current - this.lastLoadTime > TWO_MINUTES
  }

  @action.bound
  async load() {
    if (!this.hasData || this.isStale()) {
      this.loading = true
      this.error = ''

      try {
        const prefs = await userStore
          .getApiCoreAxiosClient()!
          .get('/identity/preferences/')
        this.preferences = { ...prefs.data }

        this.loading = false
        this.lastLoadTime = +new Date()
      } catch (e) {
        this.loading = false
        this.error = 'Failed to load the preferences'
      }
    }
  }

  @action.bound
  async save(newPrefs: {}) {
    this.preferences = { ...newPrefs }
    this.loading = true

    try {
      await userStore
        .getApiCoreAxiosClient()!
        .put('/identity/preferences/', { ...newPrefs })
      this.loading = false
    } catch (e) {
      this.loading = false
      return false
    }

    return true
  }

  @computed get hasData() {
    return R.keys(this.preferences).length > 0
  }

  @computed get primaryColorRaw() {
    return this.preferences['com.chesslang.brandColorPrimary']
  }

  @computed get primaryColor() {
    return this.hexToRGB(
      this.preferences['com.chesslang.brandColorPrimary'] || '#CACACA',
      1
    )
  }
  @computed get primaryLightColor() {
    return this.hexToRGB(
      this.preferences['com.chesslang.brandColorPrimary'] || '#CACACA',
      0.2
    )
  }
}

export const preferencesStore = new PreferencesStore(
  jsEnv.isBrowser && (window as any).__PRELOADED_STATE__
    ? (window as any).__PRELOADED_STATE__.preferencesStore
    : {}
)
