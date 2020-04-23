import { of } from 'rxjs'
import { Observable } from 'rxjs/Observable'
import { BehaviorSubject } from 'rxjs/BehaviorSubject'
import 'rxjs/add/operator/do'
import 'rxjs/add/operator/map'
import 'rxjs/add/observable/from'
import 'rxjs/add/observable/of'
import 'rxjs/add/observable/empty'
import 'rxjs/add/operator/concatMap'
import 'rxjs/add/operator/catch'
import 'rxjs/add/operator/mergeMap'
import 'rxjs/add/operator/bufferCount'
import { forkJoin } from 'rxjs/observable/forkJoin'
import retryAxios = require('retry-axios')
import axios from 'axios'
retryAxios.attach()

import { PGNParser } from '../'

export interface Args {
  jwtProvider: () => string
  baseUrl: string
  file?: File
  pgnText?: string
  gamebaseUuid?: string
  gamebaseName?: string
  isPrivate?: boolean
  tags?: string[]
}

export interface Status {
  uploadedCount: number
  totalCount: number
  failedCount: number
  uploading: boolean
  gamebaseUuid?: string
}

export class GamesImporter {
  private baseUrl: string
  private jwtProvider: () => string
  private file: File | undefined
  private pgnText: string | undefined
  private gamebaseName: string | undefined
  private isPrivate: boolean
  private tags: string[]

  private state = {
    uploadedCount: 0,
    totalCount: 0,
    failedCount: 0,
    uploading: false
  }
  private status$ = new BehaviorSubject<Status>(this.state)

  private games: { index: number; pgnText: string }[] = []
  private failedGames: { index: number; pgnText: string }[] = []
  private gamebaseUuid = ''
  private savedGameUuids: string[] = []

  constructor(args: Args) {
    this.baseUrl = args.baseUrl
    this.jwtProvider = args.jwtProvider
    this.file = args.file!
    this.gamebaseName = args.gamebaseName
    this.gamebaseUuid = args.gamebaseUuid || ''
    this.isPrivate = (() => {
      if (args.isPrivate === true) return true
      if (args.isPrivate === false) return false
      return true
    })()
    this.tags = args.tags || []

    this.status$.subscribe(newState => {
      this.state = newState
    })
  }

  public retry() {
    if (this.failedGames.length > 0) {
      this.games = this.failedGames
      this.failedGames = []
      this.uploadGames()
    }
  }

  private uploadGames() {
    // reset status
    this.savedGameUuids = this.savedGameUuids || []
    this.status$.next({
      ...this.state,
      totalCount: this.games.length,
      uploading: true
    })

    of(...this.games)
      .bufferCount(10)
      .concatMap(gameBatch => {
        return forkJoin(
          ...gameBatch.map(game => {
            const gameArg = {
              source: this.gamebaseName,
              index: game.index,
              pgn: game.pgnText,
              tags: []
            }
            return axios({
              method: 'post',
              url: `${this.baseUrl}database/api/v1/game/`,
              headers: {
                'x-authorization': `Bearer ${this.jwtProvider()}`
              },
              data: gameArg
            })
              .then((r: any) => r.data.uuid)
              .then(uuid => {
                this.savedGameUuids.push(uuid)
                this.status$.next({
                  ...this.state,
                  uploadedCount: this.savedGameUuids.length,
                  uploading: true
                })
                return uuid
              })
              .catch(({ game }) => {
                this.failedGames.push(game)
                return of(game)
              })
          })
        )
      })
      .bufferCount(this.games.length)
      .subscribe(async () => {
        if (this.savedGameUuids.length === 0) {
          this.status$.next({ ...this.state, uploading: false })
          return
        }

        try {
          if (!this.gamebaseUuid) {
            this.gamebaseUuid = await axios({
              method: 'post',
              url: `${this.baseUrl}database/api/v1/gamebase/`,
              headers: {
                'x-authorization': `Bearer ${this.jwtProvider()}`
              },
              data: {
                name: this.gamebaseName,
                description: '',
                isPrivate: this.isPrivate,
                tags: this.tags
              }
            }).then((r: any) => {
              if (r.status >= 200 && r.status <= 205) return r.data.uuid
              throw new Error('Failed to create game')
            })
          }

          await axios({
            data: { gameUuids: [...this.savedGameUuids] },
            method: 'post',
            url: `${this.baseUrl}database/api/v1/gamebase/${this.gamebaseUuid}/game`,
            headers: {
              'x-authorization': `Bearer ${this.jwtProvider()}`
            }
          })

          this.status$.next({
            ...this.state,
            gamebaseUuid: this.gamebaseUuid,
            uploading: false
          })
        } catch (e) {
          this.status$.next({ ...this.state, uploading: false })
          this.status$.error(new Error('Error uploading games'))
        }
      })
  }

  public startUpload() {
    if (!this.state.uploading) {
      this.status$.next({ ...this.state, uploading: true })

      this.failedGames = []
      this.games = []

      if (this.file) {
        const reader = new FileReader()
        reader.onload = () => {
          console.log('test')
          this.state.uploading = false
          this.games = PGNParser.extractGames(reader.result as string).map(
            (pgnText, index) => {
              return { pgnText, index }
            }
          )
          this.uploadGames()
        }

        reader.readAsText(this.file)
      } else if (this.pgnText) {
        this.games = PGNParser.extractGames(this.pgnText).map(
          (pgnText, index) => {
            return { pgnText, index }
          }
        )
        this.uploadGames()
      } else {
        throw new Error('No input PGN file or text provided.')
      }
    }
  }

  public getStatusStream() {
    return this.status$
  }
}
