import * as R from 'ramda'
import * as jsEnv from 'browser-or-node'
import { observable, action } from 'mobx'

import { userStore } from './user'

const TWO_MINUTES = 2 * 60 * 1000

export class CoachNetworkStore {
  @observable coaches: any = null

  @observable loading: boolean = true
  @observable error: string = ''
  private lastLoadTime = 0

  constructor(initValues: any = {}) {
    if (initValues.coaches) {
      this.loading = false
      this.coaches = initValues.coaches
    } else {
      this.loading = true
    }
    this.error = initValues.error
  }

  private isStale = () => {
    const current = +new Date()
    return current - this.lastLoadTime > TWO_MINUTES
  }

  @action.bound
  async load(forceRefresh = false) {
    if (forceRefresh || !this.coaches || this.isStale()) {
      this.error = ''
      this.loading = !forceRefresh
      this.lastLoadTime = +new Date()

      try {
        const coaches = await userStore
          .getApiCoreV3AxiosClient()!
          .get('/coaches/all/')
        // Transform students into uuid->value key-value pairs
        this.coaches = R.uniqBy(R.prop('uuid') as any, coaches.data.records)

        this.loading = false
      } catch (e) {
        this.loading = false
        this.error = 'Error loading students and groups'
        this.coaches = []
      }
    }
  }

  @action.bound
  async refresh() {
    this.lastLoadTime = 0
    if (this.coaches) {
      this.load(true)
    }
  }
}

export const coachNetworkStore = new CoachNetworkStore(
  jsEnv.isBrowser && (window as any).__PRELOADED_STATE__
    ? (window as any).__PRELOADED_STATE__.coachNetworkStore
    : {}
)
