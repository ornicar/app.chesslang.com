import * as jsEnv from 'browser-or-node'
import { observable, action } from 'mobx'

import { userStore } from './user'

export interface GamePreviewState {
  game: any
  loading: boolean
  error: boolean
}

export class GameboxGamePreviewStore {
  @observable game = undefined
  @observable loading = true
  @observable error = false

  constructor(initState: any = {}) {
    this.game = initState.game || null
    this.loading = initState.loading || true
    this.error = initState.error || false
  }

  @action.bound async load({ gameUuid }: { gameUuid: string }) {
    this.loading = true
    this.error = false

    try {
      const response = await userStore
        .getApiCoreAxiosClient()!
        .get(`games/${gameUuid}`)

      this.game = response.data
    } catch (e) {
      this.error = true
      return false
    } finally {
      this.loading = false
    }

    return true
  }
}

export const gameboxGamePreviewStore = new GameboxGamePreviewStore(
  jsEnv.isBrowser && (window as any).__PRELOADED_STATE__
    ? (window as any).__PRELOADED_STATE__.gameboxGamePreviewStore
    : {}
)
