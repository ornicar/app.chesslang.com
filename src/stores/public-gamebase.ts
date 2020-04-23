import * as jsEnv from 'browser-or-node'
import { observable, action } from 'mobx'
import { userStore } from './user'

export class PublicGamebaseStore {
  @observable gamebases: null | any[] = null

  @observable loading = true
  @observable error = ''

  constructor(initValues: any = {}) {
    this.gamebases = initValues.gamebases || null
    this.loading = initValues.loading || true
    this.error = initValues.error || ''
  }

  @action.bound
  async load() {
    if (!this.gamebases) {
      this.loading = true
      this.error = ''

      try {
        const response = await userStore
          .getApiCoreAxiosClient()!
          .get('/database/gamebase?isPrivate=false')
        this.loading = false
        this.gamebases = response.data.records
      } catch (e) {
        this.loading = true
        this.error = 'Error loading gamebases'
      }
    }
  }
}

export const publicGamebaseStore = new PublicGamebaseStore(
  jsEnv.isBrowser && (window as any).__PRELOADED_STATE__
    ? (window as any).__PRELOADED_STATE__.publicGamebaseStore
    : {}
)
