import * as R from 'ramda'
import { observable, action } from 'mobx'

import { userStore } from './user'

const TWO_MINUTES = 2 * 60 * 1000

export class StudentsGroupsStore {
  @observable students: any = null
  @observable groups: any = null

  @observable loading: boolean = true
  @observable error: string = ''
  private lastLoadTime = 0

  @observable creating = false
  @observable createError = ''

  @observable editing = false
  @observable editError = ''

  constructor(initValues: any = {}) {
    if (initValues.students && initValues.groups) {
      this.loading = false
      this.students = initValues.students
      this.groups = initValues.groups
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
    if (forceRefresh || !this.students || !this.groups || this.isStale()) {
      this.error = ''
      this.loading = !forceRefresh
      this.lastLoadTime = +new Date()

      try {
        const response = await userStore
          .getApiCoreV3AxiosClient()!
          .get('/students/all-by-coachId/')
        // Transform students into uuid->value key-value pairs
        this.students = R.compose(
          R.fromPairs,
          R.map((s: any) => [s.uuid, s] as [string, {}])
        )(response.data.records)

        const groups = await userStore
          .getApiCoreV3AxiosClient()!
          .get('/groups/all-by-coachId/')
        // Transform groups into uuid->value key-value pairs
        this.groups = R.compose(
          R.fromPairs,
          R.map((g: any) => [g.uuid, g] as [string, {}])
        )(groups.data.records)

        this.loading = false
      } catch (e) {
        this.loading = false
        this.error = 'Error loading students and groups'
        this.students = null
        this.groups = null
      }
    }
  }

  @action.bound
  async refresh() {
    this.lastLoadTime = 0
    if (this.groups) {
      this.load(true)
    }
  }

  @action.bound
  async edit(uuid: string, group: any) {
    this.editing = true
    this.editError = ''
    try {
      await userStore.getApiCoreV3AxiosClient()!.put('/groups/', {
        uuid: uuid,
        ownerUuid: userStore.uuid,
        ...group,
        groupType: 'academy',
        purpose: 'student'
      })

      this.editing = false
      this.refresh()
    } catch (e) {
      this.editing = false
      this.editError = 'Failed to edit group'

      return false
    }

    return true
  }

  @action.bound
  async create(group: any) {
    this.creating = true
    this.createError = ''
    try {
      console.log('--> creating: ', group)
      await userStore.getApiCoreV3AxiosClient()!.post('/groups/', {
        ownerUuid: userStore.uuid,
        ...group,
        groupType: 'academy',
        purpose: 'student'
      })

      this.creating = false
      this.refresh()
    } catch (e) {
      this.creating = false
      this.createError = 'Failed to create group'

      return false
    }

    return true
  }

  @action.bound
  async delete(uuid: string) {
    try {
      await userStore.getApiCoreV3AxiosClient()!.delete(`/groups/${uuid}`)
      this.refresh()
    } catch (e) {
      return false
    }

    return true
  }

  @action.bound
  updateStudentRatings(id: string, ratings: any) {
    this.students[id].ratings = ratings
  }
}

export const studentsGroupsStore = new StudentsGroupsStore()
