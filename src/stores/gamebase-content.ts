import * as R from 'ramda'
import * as jsEnv from 'browser-or-node'
import { observable, action } from 'mobx'

import { userStore } from './user'

export interface GamebaseContent {
  loading: boolean
  games: any[]
  error: string
  currentPage: number
}

export class GamebaseContentStore {
  @observable content: {
    [baseUuid: string]: GamebaseContent
  } = {}

  constructor(initValues: any = {}) {
    this.content = initValues.content || {}
  }

  @action.bound
  async load(uuid: string) {
    if (!this.content[uuid] || this.content[uuid].error) {
      this.content[uuid] = {
        loading: true,
        games: [],
        error: '',
        currentPage: !this.content[uuid] ? 0 : this.content[uuid].currentPage
      }

      try {
        const response = await userStore
          .getApiCoreAxiosClient()!
          .get('/database/gamebase/' + uuid + '/games')

        const games = response.data.records
        this.content[uuid] = {
          loading: false,
          games: games,
          error: '',
          currentPage: 1
        }
      } catch (e) {
        this.content[uuid] = {
          ...this.content[uuid],
          error: `Error loading gamebase ${uuid}`
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
            '/database/gamebase/' +
              uuid +
              '/games?page=' +
              this.content[uuid].currentPage
          )
        this.content[uuid] = {
          ...this.content[uuid],
          games: R.uniqBy(p => p.uuid, [
            ...this.content[uuid].games,
            ...response.data.records
          ]),
          currentPage: this.content[uuid].currentPage + 1
        }
      } catch (e) {
        this.content[uuid] = {
          ...this.content[uuid],
          error: `Error loading gamebase ${uuid}`
        }
      }
    }
  }
}

export const gamebaseContentStore = new GamebaseContentStore(
  jsEnv.isBrowser && (window as any).__PRELOADED_STATE__
    ? (window as any).__PRELOADED_STATE__.gamebaseContentStore
    : {}
)
