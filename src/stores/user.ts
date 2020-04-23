import * as jsEnv from 'browser-or-node'
import { observable, action, computed, reaction } from 'mobx'
import { decode } from 'jwt-simple'
import axios, { AxiosInstance } from 'axios'
import { analysisBoardStore } from './analysis-board-store'
import { preferencesStore } from './preferences'

export interface ChangePasswordArgs {
  currentPassword: string
  newPassword: string
  retypePassword: string
}

export interface ChangeNameArgs {
  firstname: string
  lastname: string
}

export class UserStore {
  @observable isLoggedIn = false
  @observable uuid = ''
  @observable username = ''
  @observable firstname = ''
  @observable lastname = ''
  @observable email = ''
  @observable role: 'student' | 'coach' | 'admin' | '' = ''
  isTournamentOn: boolean = false

  @observable accessToken: string | null = ''
  @observable refreshToken: string | null = ''
  @observable tokenExpiry = -1

  @observable profileLoading = true
  @observable profileError = ''
  @observable profile: any = null

  @observable changingPassword = false
  @observable changePasswordError = ''

  @observable changingName = false
  @observable changeNameError = ''
  private axiosClient: AxiosInstance | null = null
  private shortcastleAxiosClient: AxiosInstance | null = null
  private analyticsAxiosClient: AxiosInstance | null = null

  private apiCoreAxiosClient: AxiosInstance | null = axios.create({
    baseURL: process.env.API_CORE_URL,
    timeout: 30 * 1000
  })

  private apiGameServerAxiosClient: AxiosInstance | null = axios.create({
    baseURL: process.env.GAME_SERVER_URL,
    timeout: 30 * 1000
  })

  private apiCoreV3AxiosClient: AxiosInstance | null = axios.create({
    baseURL: process.env.API_CORE_URL,
    timeout: 30 * 1000
  })

  constructor(initValues: any = {}) {
    this.uuid = initValues.uuid || ''
    this.username = initValues.username || ''
    this.firstname = initValues.firstname || ''
    this.lastname = initValues.lastname || ''
    this.role = initValues.role || ''

    this.accessToken = initValues.accessToken || ''
    this.refreshToken = initValues.refreshToken || ''

    this.accessToken = localStorage.getItem('chesslang-access-token')
    this.refreshToken = localStorage.getItem('chesslang-refresh-token')

    if (this.accessToken && this.refreshToken) {
      this.consumeTokens(this.accessToken, this.refreshToken)
    }
  }

  public consumeTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken
    this.refreshToken = refreshToken

    try {
      const payload = decode(this.accessToken, '', true)
      if (payload.exp < +new Date()) {
        this.accessToken = ''
        this.refreshToken = ''
        this.logout()
        return
      }

      this.isLoggedIn = true
      this.uuid = payload.user.uuid
      this.username = payload.user.username
      this.firstname = payload.user.firstname
      this.lastname = payload.user.lastname
      if (payload.user.role <= 100) {
        this.role = 'student'
      }
      if (payload.user.role <= 50) {
        this.role = 'coach'
      }
      if (payload.user.role <= 0) {
        this.role = 'admin'
      }
      this.tokenExpiry = payload.exp
      this.isTournamentOn = payload.user.is_tournament_on
    } catch (e) {
      // this.complete = false
      // this.error = 'Error decoding the user data'
      this.logout()
    }

    if (this.accessToken && this.refreshToken) {
      localStorage.setItem('chesslang-access-token', this.accessToken)
      localStorage.setItem('chesslang-refresh-token', this.refreshToken)

      this.axiosClient = axios.create({
        baseURL: process.env.API_URL,
        timeout: 30 * 1000,
        headers: { 'X-Authorization': `Bearer ${this.accessToken}` }
      })

      // this.analyticsAxiosClient = axios.create({
      //   baseURL: process.env.ANALYTICS_API_URL,
      //   timeout: 30 * 1000,
      //   headers: { Authorization: `Bearer ${this.accessToken}` }
      // })

      this.shortcastleAxiosClient = axios.create({
        baseURL: 'https://api.shortcastle.com/',
        timeout: 30 * 1000,
        headers: { Authorization: `Bearer ${this.accessToken}` }
      })

      this.apiCoreAxiosClient = axios.create({
        baseURL: process.env.API_CORE_URL,
        timeout: 30 * 1000,
        headers: { Authorization: `Bearer ${this.accessToken}` }
      })

      this.apiCoreV3AxiosClient = axios.create({
        baseURL: process.env.API_V3_CORE_URL,
        timeout: 30 * 1000,
        headers: { Authorization: `Bearer ${this.accessToken}` }
      })

      this.apiGameServerAxiosClient = axios.create({
        baseURL: process.env.GAME_SERVER_URL,
        timeout: 30 * 1000,
        headers: { Authorization: `Bearer ${this.accessToken}` }
      })

      // axiosRetry(this.axiosClient, { retries: 3 })

      // this.axiosClient.interceptors.response.use((response) => {
      //   return response
      // }, (error) => {
      //   // TODO: If 401, attempt to get a new token
      //   // For now, redirect to login page
      //   return Promise.reject(error)
      // })
    } else {
      this.logout()
    }
  }

  logout() {
    analysisBoardStore.reset()
    localStorage.removeItem('chesslang-access-token')
    localStorage.removeItem('chesslang-refresh-token')
    this.constructor()
  }

  @action.bound
  async loadProfile(reload = false) {
    if (!this.profile || reload) {
      this.profileLoading = true
      try {
        const profile = await this.getApiCoreAxiosClient()!.get(
          '/identity/profile/me'
        )
        this.profile = profile.data
        this.profileLoading = false
        preferencesStore!.load()
      } catch (e) {
        this.profileLoading = false
        this.profileError = 'Error loading profile'
        return false
      }
    }

    return true
  }

  @action.bound
  async changePassword(args: ChangePasswordArgs) {
    this.changingPassword = true
    this.changePasswordError = ''

    try {
      await this.getApiCoreAxiosClient()!.put(
        '/identity/account/change-password',
        args
      )
      this.changingPassword = false
    } catch (e) {
      console.dir(e)
      if (e.response && e.response.status === 400) {
        this.changePasswordError = 'Current password is incorrect'
      } else {
        this.changePasswordError = 'Error changing password'
      }

      this.changingPassword = false
      return false
    }

    return true
  }

  @action.bound
  resetChangePasswordErrors() {
    this.changePasswordError = ''
  }

  @action.bound
  async changeName(args: ChangeNameArgs) {
    this.changingName = true
    this.changeNameError = ''

    try {
      await this.getApiCoreAxiosClient()!.put('identity/profile/me', args)
      this.changingName = false
    } catch (e) {
      this.changeNameError = 'Error saving changes'
      this.changingName = false
      return false
    }

    this.loadProfile(true)
    return true
  }

  @action.bound
  resetChangeNameErrors() {
    this.changeNameError = ''
  }

  getAccessToken() {
    return this.accessToken
  }

  getAxiosClient() {
    return this.axiosClient
  }

  getAnalyticsAxiosClient() {
    return this.analyticsAxiosClient
  }

  getShortcastleAxiosClient() {
    return this.shortcastleAxiosClient
  }

  getApiCoreAxiosClient() {
    return this.apiCoreAxiosClient
  }

  getGameServerAxiosClient() {
    return this.apiGameServerAxiosClient
  }

  getApiCoreV3AxiosClient() {
    return this.apiCoreV3AxiosClient
  }
  @computed get fullName() {
    return this.firstname + ' ' + this.lastname
  }
}

export const userStore = new UserStore(
  jsEnv.isBrowser && (window as any).__PRELOADED_STATE__
    ? (window as any).__PRELOADED_STATE__.userStore
    : {}
)
