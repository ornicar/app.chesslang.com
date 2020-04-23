import * as jsEnv from 'browser-or-node'
import { observable, action } from 'mobx'

import { userStore } from './user'
import { ChessTypes } from '@chesslang/chess'

export interface AssignmentCompletionDetail {
  loading: boolean
  data: any
  error: string
}

export class CoachAssignmentCompletionDetailsStore {
  @observable content: {
    [uuid: string]: AssignmentCompletionDetail
  } = {}

  constructor(initValues: any = {}) {
    this.content = initValues.content || {}
  }

  @action.bound
  async load(uuid: string) {
    if (!this.content[uuid] || this.content[uuid].error) {
      this.content[uuid] = {
        loading: true,
        data: null,
        error: ''
      }

      try {
        const result = await userStore
          .getApiCoreAxiosClient()!
          .get(`/exercise/assignment/coach/completion-details/${uuid}`)
        this.content[uuid] = {
          loading: false,
          data: result.data,
          error: ''
        }
      } catch (e) {
        this.content[uuid] = {
          loading: false,
          data: null,
          error: `Error loading completion details`
        }
      }
    }
  }
}

export const coachAssignmentCompletionDetailsStore = new CoachAssignmentCompletionDetailsStore(
  jsEnv.isBrowser && (window as any).__PRELOADED_STATE__
    ? (window as any).__PRELOADED_STATE__.coachAssignmentCompletionDetailsStore
    : {}
)
