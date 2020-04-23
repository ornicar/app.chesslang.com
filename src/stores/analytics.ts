import * as jsEnv from 'browser-or-node'
import { observable, action } from 'mobx'
import { userStore } from './user'
import { studentsGroupsStore } from './students-groups'

export class AnalyticsStore {
  @observable startDate = ''
  @observable endDate = ''

  @observable analyticsData = {}
  @observable allGroupsObj = []
  @observable groups = []
  @observable currGroup = ''
  @observable currGroupObj = {}

  @observable loading = false
  @observable errors = ''

  constructor(initValues: any = {}) {
    this.analyticsData = initValues.analyticsData || {}
    this.allGroupsObj = initValues.allGroupsObj || []
    this.groups = initValues.groups || ['all']
    this.currGroup = initValues.currGroup || 'all'
    this.currGroupObj = initValues.currGroupObj || {}

    this.startDate = initValues.startDate || ''
    this.endDate = initValues.endDate || ''

    this.loading = initValues.loading || true
    this.errors = initValues.errors || ''
  }

  @action.bound
  async load(
    startDate: string,
    endDate: string,
    group: string = this.currGroup
  ) {
    this.loading = true
    this.errors = ''

    this.currGroup = group
    if (this.currGroup !== 'all') {
      this.currGroupObj = this.allGroupsObj.filter(ele => {
        return ele['name'] === this.currGroup
      })

      this.currGroupObj = this.currGroupObj[0]
    }
    let res = null
    try {
      if (this.currGroup === 'all') {
        res = await userStore
          .getApiCoreAxiosClient()!
          // .get(`/api/v1/analytics/984a1a78-180b-4323-a9d4-15de0401834e?startDate=${startDate}&endDate=${endDate}`)
          .get(
            `/report/${
              userStore.uuid
            }?startDate=${startDate}&endDate=${endDate}`
          )
      } else {
        res = await userStore
          .getApiCoreAxiosClient()!
          // .get(`/api/v1/analytics/984a1a78-180b-4323-a9d4-15de0401834e?startDate=${startDate}&endDate=${endDate}&groupId=${this.currGroupObj['uuid']}`)
          .get(
            `/report/${
              userStore.uuid
            }?startDate=${startDate}&endDate=${endDate}&groupId=${
              this.currGroupObj['uuid']
            }`
          )
      }
      this.analyticsData = res['data']

      this.analyticsData['table_data'] = this.analyticsData['table_data'].map(
        obj => {
          return {
            ...obj,
            key: obj['studentId']
          }
        }
      )

      this.loading = false
    } catch (e) {
      this.loading = false
      this.errors = e
    }
  }

  @action.bound
  async loadGroups() {
    this.groups = ['all']
    await studentsGroupsStore!.load(true)
    this.allGroupsObj = Object.values(studentsGroupsStore.groups)
    this.allGroupsObj.map((ele: any, i: any) => {
      this.groups.push(ele['name'])
    })
  }
}
export const analyticsStore = new AnalyticsStore()
