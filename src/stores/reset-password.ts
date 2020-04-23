import * as jsEnv from 'browser-or-node'
import { observable } from 'mobx'

export class ResetPasswordStore {
  @observable email = ''

  @observable complete = false
  error = ''

  constructor(initValues: any = {}) {
    this.email = initValues.email || ''

    this.complete = initValues.complete || false
    this.error = initValues.error || ''
  }
}

export const resetPasswordStore = new ResetPasswordStore(
  jsEnv.isBrowser && (window as any).__PRELOADED_STATE__
    ? (window as any).__PRELOADED_STATE__.resetPasswordStore
    : {}
)
