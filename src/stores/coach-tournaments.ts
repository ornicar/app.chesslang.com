import { observable, computed, action } from 'mobx'
import { userStore } from './user'
import * as R from 'ramda'

export class CoachTournamentStore {
  @observable tournaments: Array<any> = []

  @action.bound
  async load() {
    try {
      const response = await userStore
        .getApiCoreAxiosClient()!
        .get('/coach-tournaments')

      this.tournaments = response.data.records.map(r => {
        return { ...r, key: r.uuid }
      })
    } catch (e) {
      console.error(e)
      return false
    }
  }

  @action.bound
  async delete(tournamentUuid: string) {
    if (this.tournaments) {
      this.tournaments = R.filter(
        e => e.uuid != tournamentUuid,
        this.tournaments
      )
      try {
        await userStore
          .getApiCoreAxiosClient()!
          .delete(`/coach-tournaments/${tournamentUuid}`)
      } catch (e) {
        return false
      }

      return true
    }
  }

  @computed
  get currentTournaments() {
    return this.tournaments.filter(t => t.status == 'CURRENT')
  }

  @computed
  get pastTournaments() {
    return this.tournaments.filter(t => t.status == 'PAST')
  }

  @computed
  get upcomingTournments() {
    return this.tournaments.filter(t => t.status == 'UPCOMING').reverse()
  }
}

export const coachTournamentStore = new CoachTournamentStore()
