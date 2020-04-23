import { observable, computed, action } from 'mobx'
import { userStore } from './user'

export class StudentTournamentStore {
  @observable tournaments: Array<any> = []

  @action.bound
  async load() {
    try {
      const response = await userStore
        .getApiCoreAxiosClient()!
        .get('/student-tournaments')

      this.tournaments = response.data.records.map(r => {
        return { ...r, key: r.uuid }
      })
    } catch (e) {
      console.error(e)
      return false
    }
  }

  @computed
  get activeTournaments() {
    return this.tournaments.filter(
      t => t.status == 'CURRENT' || t.status == 'UPCOMING'
    )
  }

  @action.bound
  async joinTournament(uuid: string) {
    try {
      const payload: any = {
        tournamentUuid: uuid
      }

      console.log(uuid)

      await userStore
        .getApiCoreAxiosClient()!
        .post('/student-tournaments/join', payload)

      this.load()
    } catch (e) {
      console.error(e)
      return false
    }
  }

  @action.bound
  async exitTournament(uuid: string) {
    try {
      const payload: any = {
        tournamentUuid: uuid
      }

      await userStore
        .getApiCoreAxiosClient()!
        .post('/student-tournaments/exit', payload)
    } catch (e) {
      console.error(e)
      return false
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

export const studentTournamentStore = new StudentTournamentStore()
