import Drill from '../types/Drill'
import { action, observable } from 'mobx'
import { userStore } from './user'

const ONE_HOUR = 60 * 60 * 1000

export const SIDE_TO_PLAY_WIN = 'WIN'
export const SIDE_TO_PLAY_DRAW = 'DRAW'

export class PracticeStore {
  @observable items: Drill[] = []

  @observable loading = true
  @observable error = ''
  private lastLoadTime = 0

  constructor(initValues: any = {}) {
    this.items = initValues.items || null
    this.loading = initValues.loading || true
    this.error = initValues.error || ''
  }

  private isStale = () => {
    const current = +new Date()
    return current - this.lastLoadTime > ONE_HOUR
  }

  @action.bound
  async load() {
    if (!this.items || this.isStale() || this.error) {
      this.loading = true
      this.error = ''

      try {
        const drills = await userStore.getApiCoreAxiosClient()?.get('/drills')

        this.items = drills?.data.records
        this.loading = false
        this.lastLoadTime = +new Date()
      } catch (e) {
        this.loading = false
        if (e.response && e.response.status === 404) {
          this.items = []
          this.error = ''
        } else {
          this.error = 'Error loading practice items'
        }
        this.lastLoadTime = 0
        return false
      }

      return true
    }
  }

  @action.bound
  async createDrill(drill: Omit<Drill, 'uuid' | 'created_at' | 'updated_at'>) {
    try {
      const response = await userStore
        .getApiCoreAxiosClient()
        ?.post('/drills', drill)
      const newDrill = response?.data
      this.items.push(newDrill)
    } catch (e) {}
  }

  @action.bound
  async deleteDrill(uuid: any) {
    try {
      this.items = this.items.filter(e => e.uuid != uuid, this.items)
      const response = await userStore
        .getApiCoreAxiosClient()
        ?.delete(`/drills/${uuid}`)
    } catch (e) {}
  }
}

export const practiceStore = new PracticeStore()
