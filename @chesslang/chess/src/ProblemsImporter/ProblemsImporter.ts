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
import { forkJoin } from 'rxjs/observable/forkJoin'
import axios from 'axios'

import { PGNParser } from '../'

export interface Args {
  jwtProvider: () => string
  baseUrl: string
  file?: File
  pgnText?: string
  problembaseUuid?: string
  problembaseName?: string
  isPrivate?: boolean
  tags?: string[]
}

export interface Status {
  uploadedCount: number
  totalCount: number
  failedCount: number
  uploading: boolean
  problembaseUuid?: string
}

export class ProblemsImporter {
  private baseUrl: string
  private jwtProvider: () => string
  private file: File | undefined
  private pgnText: string | undefined
  private problembaseName: string | undefined
  private isPrivate: boolean
  private tags: string[]

  private state = {
    uploadedCount: 0,
    totalCount: 0,
    failedCount: 0,
    uploading: false
  }
  private status$ = new BehaviorSubject<Status>(this.state)

  private problems: { index: number; pgnText: string }[] = []
  private failedProblems: { index: number; pgnText: string }[] = []
  private problembaseUuid = ''
  private savedProblemUuids: string[] = []

  constructor(args: Args) {
    this.baseUrl = args.baseUrl
    this.jwtProvider = args.jwtProvider
    this.file = args.file!
    this.problembaseName = args.problembaseName
    this.problembaseUuid = args.problembaseUuid || ''
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
    if (this.failedProblems.length > 0) {
      this.problems = this.failedProblems
      this.failedProblems = []
      this.uploadProblems()
    }
  }

  private uploadProblems() {
    // reset status
    this.savedProblemUuids = this.savedProblemUuids || []
    this.status$.next({
      ...this.state,
      totalCount: this.problems.length,
      uploading: true
    })

    forkJoin(
      ...this.problems.map(problem => {
        const problemArg = {
          source: this.problembaseName,
          index: problem.index,
          pgn: problem.pgnText,
          tags: []
        }
        return axios({
          method: 'post',
          url: `${this.baseUrl}database/api/v1/problem/`,
          headers: {
            'x-authorization': `Bearer ${this.jwtProvider()}`
          },
          data: problemArg
        })
          .then((r: any) => r.data.uuid)
          .then(uuid => {
            this.savedProblemUuids.push(uuid)
            this.status$.next({
              ...this.state,
              uploadedCount: this.savedProblemUuids.length
            })
            return uuid
          })
          .catch(({ problem }) => {
            this.failedProblems.push(problem)
            return Observable.empty()
          })
      })
    ).subscribe(async () => {
      if (this.savedProblemUuids.length === 0) {
        this.status$.next({ ...this.state, uploading: false })
        return
      }

      try {
        if (!this.problembaseUuid) {
          this.problembaseUuid = await axios({
            method: 'post',
            url: `${this.baseUrl}database/api/v1/problembase/`,
            headers: {
              'x-authorization': `Bearer ${this.jwtProvider()}`
            },
            data: {
              name: this.problembaseName,
              description: '',
              isPrivate: this.isPrivate,
              tags: this.tags
            }
          }).then((r: any) => {
            if (r.status >= 200 && r.status <= 205) return r.data.uuid
            throw new Error('Failed to create problem')
          })
        }

        await axios({
          data: { problemUuids: [...this.savedProblemUuids] },
          method: 'post',
          url: `${this.baseUrl}database/api/v1/problembase/${this.problembaseUuid}/problem`,
          headers: {
            'x-authorization': `Bearer ${this.jwtProvider()}`
          }
        })

        this.status$.next({
          ...this.state,
          problembaseUuid: this.problembaseUuid,
          uploading: false
        })
      } catch (e) {
        this.status$.next({ ...this.state, uploading: false })
        this.status$.error(new Error('Error uploading problems'))
      }
    })
  }

  public startUpload() {
    if (!this.state.uploading) {
      this.status$.next({ ...this.state, uploading: true })

      this.failedProblems = []
      this.problems = []

      if (this.file) {
        const reader = new FileReader()
        reader.onload = () => {
          this.state.uploading = false
          this.problems = PGNParser.extractGames(reader.result as string).map(
            (pgnText, index) => {
              return { pgnText, index }
            }
          )

          this.uploadProblems()
        }

        reader.readAsText(this.file)
      } else if (this.pgnText) {
        this.problems = PGNParser.extractGames(this.pgnText).map(
          (pgnText, index) => {
            return { pgnText, index }
          }
        )
        this.uploadProblems()
      } else {
        throw new Error('No input PGN file or text provided.')
      }
    }
  }

  public getStatusStream() {
    return this.status$
  }
}
