import * as R from 'ramda'
import * as jsEnv from 'browser-or-node'
import { observable, action, computed, runInAction } from 'mobx'

import { userStore } from './user'
import { gameboxDatabaseGameStore } from './gamebox-database-game'
import {
  convertDbFormatToPgn,
  getPgnWithMeta,
  downloadFile
} from '../utils/utils'

interface UploadArgs {
  file: File
  create?: string
  merge?: string
}

export interface GameboxDatabaseState {
  databases: any[]
  loading: boolean
  error: boolean
}

export interface UpdateArgs {
  uuid: string
  name: string
  sharedWith: any[]
}

export class GameboxDatabaseStore {
  @observable databases = [] as any[]
  @observable recentEvents = [] as string[]

  @observable loading = true
  @observable error = false

  @observable uploading = false
  @observable uploadProgressPercent = 0
  @observable uploadError = false

  @observable creating = false
  @observable createError = false

  @observable updating = false
  @observable updateError = false

  @observable deleting = false
  @observable deleteError = false

  @computed get myDatabases() {
    return R.filter(d => d.ownerUuid === userStore.uuid, this.databases)
  }

  @computed get sharedWithMeDatabases() {
    return R.filter(
      d =>
        (
          d.sharedWith.filter((sw: any) => sw.user_uuid === userStore.uuid) ||
          []
        ).length > 0,
      this.databases
    )
  }

  constructor(initState: any = {}) {
    this.databases = initState.databases || []
    this.loading = initState.loading || true
    this.error = initState.error || false
  }

  findByUuid(uuid: string) {
    return R.find(R.propEq('uuid', uuid), this.databases)
  }

  @action.bound async load() {
    this.loading = true
    this.error = false

    try {
      this.databases = await this.getDatabases()
      this.recentEvents = await this.getRecentEvents()
    } catch (e) {
      this.error = true
      return false
    } finally {
      this.loading = false
    }

    return true
  }

  @action.bound
  async getDatabases() {
    const response = await userStore
      .getApiCoreAxiosClient()!
      .get(`game-collections`)
    return response.data.records
  }

  @action.bound
  async getRecentEvents() {
    const response = await userStore
      .getApiCoreAxiosClient()!
      .get(`games/recent-events`)

    return response.data.records
  }

  @action.bound
  async createDatabase(name: string) {
    const response = await userStore
      .getApiCoreAxiosClient()!
      .post(`game-collections`, {
        name: name
      })

    return response.data
  }

  @action.bound async upload({ file, create, merge }: UploadArgs) {
    if (typeof window !== 'undefined') {
      this.uploading = true
      this.uploadError = false

      const formData = new FormData()
      formData.append('pgn', file)
      if (create) {
        formData.append('create', create)
      }
      if (merge) {
        formData.append('merge', merge)
      }

      try {
        await new Promise((resolve, reject) => {
          userStore.getApiCoreAxiosClient()!({
            method: 'post',
            url: '/pgn/upload',
            headers: { 'Content-Type': 'multipart/form-data' },
            data: formData,
            onUploadProgress: ({ loaded, total }) => {
              this.uploadProgressPercent = (loaded / total) * 100
              if (this.uploadProgressPercent >= 95.0) {
                resolve()
              }
            }
          })
            .then(response => {
              this.uploadProgressPercent = 0
              this.uploading = false
              if (response.data) {
                this.databases = [response.data, ...this.databases]
                this.load()
              }
            })
            .catch(e => {
              reject(e)
            })
        })
      } catch (e) {
        this.uploadError = true
        return false
      }

      return true
    }

    return false
  }

  @action.bound async download(uuid: string) {
    const selectedDatabase = this.findByUuid(uuid)

    if (selectedDatabase) {
      // load db games
      await gameboxDatabaseGameStore.load(
        {
          databaseUuid: uuid
        },
        true
      )

      let allPgn: string = ''
      gameboxDatabaseGameStore!.games.forEach((game: any) => {
        const gamePgn = convertDbFormatToPgn(game)
        allPgn += getPgnWithMeta(gamePgn, game.meta) + '\n'
      })

      downloadFile(selectedDatabase.name, allPgn)
    }
  }

  @action.bound async deleteDb({ uuid }: { uuid: string }) {
    if (typeof window !== 'undefined') {
      this.deleting = true
      this.deleteError = false

      try {
        const response = await userStore
          .getApiCoreAxiosClient()!
          .delete(`game-collections/${uuid}`)

        this.databases = R.reject(R.propEq('uuid', uuid), this.databases)
        return true
      } catch (e) {
        this.deleteError = true
        return false
      } finally {
        this.deleting = false
      }
    }

    return false
  }
}

export const gameboxDatabaseStore = new GameboxDatabaseStore(
  jsEnv.isBrowser && (window as any).__PRELOADED_STATE__
    ? (window as any).__PRELOADED_STATE__.gameboxDatabaseStore
    : {}
)
