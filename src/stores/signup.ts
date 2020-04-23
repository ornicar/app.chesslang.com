import * as jsEnv from 'browser-or-node'
import { observable } from 'mobx'

export class SignupStore {
  @observable firstname = ''
  @observable lastname = ''
  @observable username = ''
  @observable phone = ''
  @observable gender: 'M' | 'F' | '' = 'M'
  @observable email = ''
  @observable dateOfBirth = 0
  @observable password = ''
  @observable retypePassword = ''

  @observable complete = false
  @observable error = ''

  constructor(initValues: any = {}) {
    this.username = initValues.username || ''
    this.phone = initValues.phone || ''
    this.email = initValues.email || ''
    this.password = ''
    this.retypePassword = ''

    this.complete = initValues.complete || false
    this.error = initValues.error || ''
  }
}

export const signupStore = new SignupStore(
  jsEnv.isBrowser && (window as any).__PRELOADED_STATE__
    ? (window as any).__PRELOADED_STATE__.signupStore
    : {}
)
