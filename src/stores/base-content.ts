import * as jsEnv from 'browser-or-node'
import { observable, action } from 'mobx'

import { userStore } from './user'
import { ChessTypes } from '@chesslang/chess'

export interface Problem {
  loading: boolean
  content: null | ChessTypes.Game
  error: string
}

export class BaseContentStore {
  @observable content: {
    [uuid: string]: Problem
  } = {}

  constructor(initValues: any = {}) {
    this.content = initValues.content || {}
  }

  @action.bound
  async load(uuid: string, baseType: 'game' | 'problem' = 'problem') {
    if (!this.content[uuid] || this.content[uuid].error) {
      this.content[uuid] = {
        loading: true,
        content: null,
        error: ''
      }

      try {
        const response = await userStore
          .getApiCoreAxiosClient()!
          .get(`/database/${baseType}/` + uuid)
        this.content[uuid] = {
          loading: false,
          content: response.data as ChessTypes.Game,
          error: ''
        }
      } catch (e) {
        this.content[uuid] = {
          loading: false,
          content: null,
          error: `Error loading ${baseType} ${uuid}`
        }
      }
    }
  }
}

export const baseContentStore = new BaseContentStore(
  jsEnv.isBrowser && (window as any).__PRELOADED_STATE__
    ? (window as any).__PRELOADED_STATE__.baseContentStore
    : {}
)
