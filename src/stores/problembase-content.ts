import * as R from 'ramda'
import * as jsEnv from 'browser-or-node'
import { observable, action } from 'mobx'

import { userStore } from './user'

export interface ProblembaseContent {
  loading: boolean
  problems: any[]
  error: string
  currentPage: number
}

export class ProblembaseContentStore {
  @observable content: {
    [baseUuid: string]: ProblembaseContent
  } = {}

  constructor(initValues: any = {}) {
    this.content = initValues.content || {}
  }

  @action.bound
  async load(uuid: string) {
    if (!this.content[uuid] || this.content[uuid].error) {
      this.content[uuid] = {
        loading: true,
        problems: [],
        error: '',
        currentPage: !this.content[uuid] ? 0 : this.content[uuid].currentPage
      }

      try {
        const response = await userStore
          .getApiCoreAxiosClient()!
          .get('/database/problembase/' + uuid + '/problems')
        this.content[uuid] = {
          loading: false,
          problems: response.data.records,
          error: '',
          currentPage: 1
        }
      } catch (e) {
        this.content[uuid] = {
          ...this.content[uuid],
          error: `Error loading problembase ${uuid}`
        }
      }
    }
  }

  async loadMore(uuid: string, page: number) {
    if (this.content[uuid] && page >= this.content[uuid].currentPage) {
      try {
        const response = await userStore
          .getApiCoreAxiosClient()!
          .get(
            '/database/problembase/' +
              uuid +
              '/problems?page=' +
              this.content[uuid].currentPage
          )
        this.content[uuid] = {
          ...this.content[uuid],
          problems: R.uniqBy(p => p.uuid, [
            ...this.content[uuid].problems,
            ...response.data.records
          ]),
          currentPage: this.content[uuid].currentPage + 1
        }

        return response.data.total
      } catch (e) {
        this.content[uuid] = {
          ...this.content[uuid],
          error: `Error loading problembase ${uuid}`
        }
      }
    }
    return 0
  }

  async loadAllUuids(uuid: string) {
    try {
      const response = await userStore
        .getApiCoreAxiosClient()!
        .get('/database/problembase/' + uuid + '/problems/all')
      // console.log(response.data.records[0].uuid)
      return response.data.records
    } catch (e) {
      return e
    }
  }
}

export const problembaseContentStore = new ProblembaseContentStore(
  jsEnv.isBrowser && (window as any).__PRELOADED_STATE__
    ? (window as any).__PRELOADED_STATE__.problembaseContentStore
    : {}
)
