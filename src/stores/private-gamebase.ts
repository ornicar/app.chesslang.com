import * as jsEnv from 'browser-or-node'
import { observable, action } from 'mobx'
import { userStore } from './user'

const TWO_MINUTES = 2 * 60 * 1000

export class PrivateGamebaseStore {
  @observable gamebases: null | any[] = null

  @observable loading = true
  @observable error = ''
  private lastLoadTime = 0

  constructor(initValues: any = {}) {
    this.gamebases = initValues.gamebases || null
    this.loading = initValues.loading || true
    this.error = initValues.error || ''
  }

  private isStale = () => {
    const current = +new Date()
    return current - this.lastLoadTime > TWO_MINUTES
  }

  @action.bound
  async load() {
    if (!this.gamebases || this.isStale()) {
      this.loading = true
      this.error = ''

      try {
        const response = await userStore
          .getApiCoreAxiosClient()!
          .get('/database/gamebase?isPrivate=true')
        this.loading = false
        this.gamebases = response.data.records
        this.lastLoadTime = +new Date()
      } catch (e) {
        this.loading = true
        this.error = 'Error loading gamebases'
        this.lastLoadTime = 0
      }
    }
  }

  @action.bound
  async refresh() {
    this.lastLoadTime = 0
    if (this.gamebases) {
      this.load()
    }
  }

  @action.bound
  async delete(uuid: string) {
    try {
      await userStore
        .getApiCoreAxiosClient()!
        .delete(`/database/gamebase/${uuid}`)
      this.refresh()
    } catch (e) {
      return false
    }

    return true
  }
}

export const privateGamebaseStore = new PrivateGamebaseStore(
  jsEnv.isBrowser && (window as any).__PRELOADED_STATE__
    ? (window as any).__PRELOADED_STATE__.privateGamebaseStore
    : {}
)
