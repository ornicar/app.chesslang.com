import * as jsEnv from 'browser-or-node'
import { observable, action } from 'mobx'

export class LoginStore {
  username = ''
  password = ''

  @observable complete = false
  @observable error = ''

  constructor(initValues: any = {}) {
    this.username = initValues.username || ''
    this.password = ''

    this.complete = initValues.complete || false
    this.error = initValues.error || ''
  }

  @action.bound
  setError(error: string) {
    this.complete = false
    this.error = error
  }
}

export const loginStore = new LoginStore(
  jsEnv.isBrowser && (window as any).__PRELOADED_STATE__
    ? (window as any).__PRELOADED_STATE__.loginStore
    : {}
)
