import * as R from 'ramda'
import * as jsEnv from 'browser-or-node'

export interface BasicUserDetails {
  uuid: string
  username: string
  role: string
  firstname: string
  lastname: string
}

export class MixpanelStore {
  private token: string = ''
  private path: string = ''
  private hostname: string = ''
  private ip: string = ''

  private user: BasicUserDetails | null = null

  constructor(initValues: any = {}) {
    this.token = initValues.token || ''
    this.path = initValues.path || ''
    this.hostname = initValues.hostname || ''
    this.ip = initValues.ip || ''
  }

  init(user: BasicUserDetails) {
    if (jsEnv.isBrowser && window.mixpanel && this.token) {
      this.user = { ...user }
      this._init()
    }
  }

  private _init(n = 0) {
    if (window.mixpanel.identify) {
      if (this.user) {
        window.mixpanel.identify(this.user.uuid)
        window.mixpanel.people.set(R.dissoc('uuid', this.user))
      }
      window.mixpanel.track('serverRender', {
        path: this.path,
        hostname: this.hostname,
        ip: this.ip
      })
    } else if (n < 10) {
      setTimeout(() => this._init(n + 1), 1000)
    }
  }

  getMixpanel() {
    return jsEnv.isBrowser && window.mixpanel && window.mixpanel.__loaded
      ? window.mixpanel
      : null
  }
}

export const mixpanelStore = new MixpanelStore(
  jsEnv.isBrowser && (window as any).__PRELOADED_STATE__
    ? (window as any).__PRELOADED_STATE__.mixpanelStore
    : {}
)
