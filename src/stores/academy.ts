import * as jsEnv from 'browser-or-node'
import { observable, action, computed } from 'mobx'
import { userStore } from './user'
import { Rating } from '../types/Rating'
import { studentsGroupsStore } from './students-groups'

const TWO_MINUTES = 2 * 60 * 1000

export class AcademyStore {
  @observable academy: any = null

  @observable loading = true
  @observable error = ''
  private lastLoadTime = 0

  @observable creating = false
  @observable createError = ''

  @observable editing = false
  @observable editError = ''

  constructor(initValues: any = {}) {
    this.academy = initValues.academy || null
    this.loading = initValues.loading || true
    this.error = initValues.error || ''
  }

  private isStale = () => {
    const current = +new Date()
    return current - this.lastLoadTime > TWO_MINUTES
  }

  @action.bound
  async load() {
    if (!this.academy || this.isStale() || this.error) {
      this.loading = true
      this.error = ''
      try {
        const response = await userStore
          .getApiCoreV3AxiosClient()!
          .get('/academies')
        this.academy = response.data.records && response.data.records[0]
        this.loading = false
        this.lastLoadTime = +new Date()
      } catch (e) {
        this.loading = false
        if (e.response && e.response.status === 404) {
          this.academy = null
          this.error = ''
        } else {
          this.error = 'Error loading academy'
        }
        this.lastLoadTime = 0
      }
    }
  }

  @action.bound
  async resetPassword(uuid: string, password: string) {
    console.log('Edit Store function called', uuid, password)
    try {
      await userStore
        .getApiCoreV3AxiosClient()!
        .put(`students/reset-password/${uuid}`, { password })
      this.refresh()
    } catch (e) {
      return false
    }
    return true
  }

  @action.bound
  async updateRatings(
    uuid: string,
    ratings: Pick<Rating, 'ratingSystemId' | 'value'>[]
  ) {
    try {
      const response = await userStore
        .getApiCoreAxiosClient()!
        .post(`ratings/${uuid}`, ratings)
      return response.data.records
    } catch (e) {
      return false
    }
  }

  @action.bound
  async resetDetails(
    uuid: string,
    username: string,
    firstname: string,
    lastname: string
  ) {
    console.log(
      'Edit Store function called',
      uuid,
      username,
      firstname,
      lastname
    )
    try {
      const response = await userStore
        .getApiCoreV3AxiosClient()!
        .put(`students/reset-details/${uuid}`, {
          username,
          firstname,
          lastname
        })

      studentsGroupsStore.load(true)
      return response.data
    } catch (e) {
      console.log(e.response)
      return e.response.data
    }
    return true
  }

  @action.bound
  async refresh() {
    this.lastLoadTime = 0
    this.academy = null
    this.load()
  }

  @action.bound
  async create(academy: any) {
    this.creating = true
    this.createError = ''

    try {
      await userStore.getApiCoreV3AxiosClient()!.post('/academies', academy)
      this.creating = false
      this.refresh()
    } catch (e) {
      this.creating = false

      if (e.response && e.response.data && e.response.data.error) {
        this.createError = e.response.data.error
      } else {
        this.createError = 'Failed to create academy'
      }

      return false
    }

    return true
  }

  @action.bound
  async edit(uuid: string, academy: any) {
    this.editing = true
    this.editError = ''

    try {
      await userStore.getApiCoreAxiosClient()!.put(`/academy/${uuid}`, academy)
      this.editing = false
      this.refresh()
    } catch (e) {
      this.editing = false
      this.editError = 'Failed to update academy'

      return false
    }

    return true
  }

  @computed
  get id() {
    return this.academy && this.academy.id
  }
}

export const academyStore = new AcademyStore(
  jsEnv.isBrowser && (window as any).__PRELOADED_STATE__
    ? (window as any).__PRELOADED_STATE__.academyStore
    : {}
)
