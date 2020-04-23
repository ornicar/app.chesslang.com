import * as jsEnv from 'browser-or-node'
import { observable, action } from 'mobx'
import { userStore } from './user'

const TWO_MINUTES = 2 * 60 * 1000

export class PaymentSubscriptionStore {
  @observable subscriptions: any = null

  @observable loading = true
  @observable error = ''
  private lastLoadTime = 0

  @observable creating = false
  @observable created = false
  @observable createError = ''

  @observable cancelling = false
  @observable cancelled = false
  @observable cancelError = ''

  constructor(initValues: any = {}) {
    this.subscriptions = initValues.subscriptions || null
    this.loading = initValues.loading || true
    this.error = initValues.error || ''
  }

  private isStale = () => {
    const current = +new Date()
    return current - this.lastLoadTime > TWO_MINUTES
  }

  @action.bound
  async load() {
    if (!this.subscriptions || this.isStale()) {
      this.loading = true
      this.error = ''
      try {
        const subscriptions = await userStore
          .getAxiosClient()!
          .get('/payment/api/v1/subscription')
        this.subscriptions = (subscriptions.data || []).map(s => ({
          ...s,
          gatewayDetails: JSON.parse(s.gatewayDetails)
        }))
        this.loading = false
        this.lastLoadTime = +new Date()
      } catch (e) {
        this.loading = false
        if (e.response && e.response.status === 404) {
          this.subscriptions = null
          this.error = ''
        } else {
          this.error = 'Error loading subscriptions'
        }
        this.lastLoadTime = 0
        return false
      }
    }

    return true
  }

  @action.bound
  refresh() {
    this.lastLoadTime = 0
    this.load()
  }

  @action.bound
  async cancel(subscriptionUuid: string) {
    this.cancelling = true
    try {
      await userStore
        .getAxiosClient()!
        .delete(`/payment/api/v1/subscription/${subscriptionUuid}`)
      this.cancelling = false
      this.cancelled = true
      this.refresh()
      return true
    } catch (e) {
      this.cancelling = false
      this.cancelError = 'Error cancellign subscription'
      return false
    }
  }

  @action.bound
  async createStripe({
    academyShortName,
    planId,
    stripeToken,
    stripeEmail,
    coupon
  }) {
    this.creating = true
    try {
      await userStore.getAxiosClient()!.post(`/payment/api/v1/subscription`, {
        academyShortName,
        gateway: 'stripe',
        planId,
        stripeToken,
        stripeEmail,
        coupon
      })
      this.creating = false
      this.created = true
      this.refresh()
      return true
    } catch (e) {
      this.createError = 'Error creating subscription'
      this.creating = false
      return false
    }
  }
}

export const paymentSubscriptionStore = new PaymentSubscriptionStore(
  jsEnv.isBrowser && (window as any).__PRELOADED_STATE__
    ? (window as any).__PRELOADED_STATE__.paymentSubscriptionStore
    : {}
)
