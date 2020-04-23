import { observable, action } from 'mobx'
import { userStore } from './user'

export class GameHistoryStore {
  @observable games: any = []
  @observable selectedGame: any
  @observable hasMore = false
  @observable pageNumber = 0
  @observable loadingGames = false

  @action.bound
  async getGames(page: number) {
    this.loadingGames = true
    const res = await userStore
      .getApiCoreAxiosClient()!
      .get(`/platform-games?page=${page}`)
    if (res?.data) {
      this.games = [].concat(this.games, res.data.records)
    }
    this.loadingGames = false
    this.hasMore = res?.data.total !== 0
  }

  @action.bound
  async gameLoadMore() {
    if (this.hasMore) {
      this.pageNumber = this.pageNumber + 1
      this.getGames(this.pageNumber)
    }
  }
}

export const gameHistoryStore = new GameHistoryStore()
