import * as jsEnv from 'browser-or-node'
import { observable, action } from 'mobx'
import { userStore } from './user'

export class PublicProblembaseStore {
  @observable problembases: null | any[] = null

  @observable loading = true
  @observable error = ''

  constructor(initValues: any = {}) {
    this.problembases = initValues.problembases || null
    this.loading = initValues.loading || true
    this.error = initValues.error || ''
  }

  @action.bound
  async load() {
    if (!this.problembases) {
      this.loading = true
      this.error = ''

      try {
        const problembases = await userStore
          .getApiCoreAxiosClient()!
          .get('/database/problembase?isPrivate=false')
        this.loading = false
        this.problembases = problembases.data.records
      } catch (e) {
        this.loading = true
        this.error = 'Error loading problembases'
      }
    }
  }
}

export const publicProblembaseStore = new PublicProblembaseStore(
  jsEnv.isBrowser && (window as any).__PRELOADED_STATE__
    ? (window as any).__PRELOADED_STATE__.publicProblembaseStore
    : {}
)
