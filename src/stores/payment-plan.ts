import * as jsEnv from 'browser-or-node'
import { observable, action } from 'mobx'
import { userStore } from './user'

const TWO_MINUTES = 2 * 60 * 1000

export class PaymentPlanStore {
  @observable plans: any = null

  @observable loading = true
  @observable error = ''
  private lastLoadTime = 0

  constructor(initValues: any = {}) {
    this.plans = initValues.plans || null
    this.loading = initValues.loading || true
    this.error = initValues.error || ''
  }

  private isStale = () => {
    const current = +new Date()
    return current - this.lastLoadTime > TWO_MINUTES
  }

  @action.bound
  async load() {
    if (!this.plans || this.isStale()) {
      this.loading = true
      this.error = ''
      try {
        const plans = await userStore
          .getAxiosClient()!
          .get('/payment/api/v1/plan/')
        this.plans = plans.data
        this.loading = false
        this.lastLoadTime = +new Date()
      } catch (e) {
        this.loading = false
        if (e.response && e.response.status === 404) {
          this.plans = null
          this.error = ''
        } else {
          this.error = 'Error loading payment plans'
        }
        this.lastLoadTime = 0
      }
    }
  }
}

export const paymentPlanStore = new PaymentPlanStore(
  jsEnv.isBrowser && (window as any).__PRELOADED_STATE__
    ? (window as any).__PRELOADED_STATE__.paymentPlanStore
    : {}
)
