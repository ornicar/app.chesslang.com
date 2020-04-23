import * as jsEnv from 'browser-or-node'
import { observable, action } from 'mobx'
import { userStore } from './user'

const TWO_MINUTES = 2 * 60 * 1000

export class PrivateProblembaseStore {
  @observable problembases: null | any[] = null

  @observable loading = true
  @observable error = ''
  private lastLoadTime = 0

  constructor(initValues: any = {}) {
    this.problembases = initValues.problembases || null
    this.loading = initValues.loading || true
    this.error = initValues.error || ''
  }

  private isStale = () => {
    const current = +new Date()
    return current - this.lastLoadTime > TWO_MINUTES
  }

  @action.bound
  async load() {
    if (!this.problembases || this.isStale()) {
      this.loading = true
      this.error = ''

      try {
        const problembases = await userStore
          .getApiCoreAxiosClient()!
          .get('database/problembase?isPrivate=true')
        this.loading = false
        this.problembases = problembases.data.records
        this.lastLoadTime = +new Date()
      } catch (e) {
        this.loading = true
        this.error = 'Error loading problembases'
        this.lastLoadTime = 0
      }
    }
  }

  @action.bound
  async refresh() {
    this.lastLoadTime = 0
    if (this.problembases) {
      this.load()
    }
  }

  @action.bound
  async delete(uuid: string) {
    try {
      await userStore
        .getApiCoreAxiosClient()!
        .delete(`/database/problembase/${uuid}`)
      this.refresh()
    } catch (e) {
      return false
    }

    return true
  }

  @action.bound
  async edit(uuid: string, name: string) {
    console.log('Edit Store function called', uuid, name)
    try {
      await userStore
        .getApiCoreAxiosClient()!
        .put(`/database/problembase/${uuid}`, { name })
      this.refresh()
    } catch (e) {
      return false
    }
    return true
  }
}

export const privateProblembaseStore = new PrivateProblembaseStore(
  jsEnv.isBrowser && (window as any).__PRELOADED_STATE__
    ? (window as any).__PRELOADED_STATE__.privateProblembaseStore
    : {}
)
