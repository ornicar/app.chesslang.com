import { BehaviorSubject } from 'rxjs/BehaviorSubject'
import 'rxjs/add/operator/do'
import 'rxjs/add/observable/from'
import 'rxjs/add/observable/empty'
import 'rxjs/add/operator/concatMap'
import 'rxjs/add/operator/catch'
import axios from 'axios'
import { dropLast } from 'ramda'

import { Chess, ChessTypes, Util } from '../'

export interface Args {
  jwtProvider: () => string
  baseUrl: string
  uuid: string
}

export interface Status {
  fen: string | null
  currentPath: ChessTypes.PlyPath | null
  loading: boolean
  game: ChessTypes.Game | null
  preAnnotations?: ChessTypes.Annotation[]
}

export class GameReader {
  private baseUrl: string
  private jwtProvider: () => string
  private game: ChessTypes.Game

  private state: Status
  private status$: BehaviorSubject<Status>

  constructor(args: Args) {
    this.status$ = new BehaviorSubject<Status>({
      fen: null,
      currentPath: null,
      loading: true,
      game: null
    })
    this.baseUrl = args.baseUrl
    this.jwtProvider = args.jwtProvider
    this.status$.subscribe(state => {
      this.state = state
    })
    this.fetchGame(args.uuid)
  }

  private fetchGame(uuid: string) {
    axios({
      method: 'get',
      url: `${this.baseUrl}database/api/v1/game/${uuid}`,
      headers: {
        'x-authorization': `Bearer ${this.jwtProvider()}`
      }
    }).then((r: any) => {
      if (r.status === 200) {
        this.game = r.data
        this.status$.next({
          ...this.state,
          loading: false,
          game: this.game,
          currentPath: this.game.mainline[0].path,
          fen: this.getFENAtPath(this.game.mainline[0].path)
        })
      } else {
        // TODO: better handling
        console.log('error in fetching data')
      }
    })
  }

  private getFENAtPath(path: ChessTypes.PlyPath): ChessTypes.FEN {
    let currentLine = this.game.mainline
    let branchingPoint: ChessTypes.Move | undefined
    for (let i = 0; i < path.length; i += 1) {
      if (i === 0) {
        currentLine = this.game.mainline
      } else {
        if (branchingPoint && branchingPoint.variations) {
          currentLine = branchingPoint.variations[path[i][0]]
        } else {
          return new Chess().fen()
        }
      }

      // Traverse till variation point and then point to the variation
      branchingPoint = currentLine[path[i][1]] as ChessTypes.Move
    }

    return branchingPoint!.fen
  }

  /**
   * Go to next move in the variation
   */
  next() {
    const nextPath: ChessTypes.PlyPath = this.state.currentPath
      ? Util.addOneToPath(this.state.currentPath)
      : [[0, 0]]
    try {
      this.goToPath(nextPath)
    } catch (e) {}
  }

  /**
   * Go to the prev move in the variation. Jump to the parent variation if at the beginning of current variation
   */
  prev() {
    // Jump to parent path if the current path ends at [x, 0]
    if (this.state.currentPath) {
      if (
        this.state.currentPath.length > 1 &&
        this.state.currentPath[this.state.currentPath.length - 1][1] === 0
      ) {
        this.goToPath(dropLast(1, this.state.currentPath))
      } else {
        const prevPath: ChessTypes.PlyPath = Util.subtractOneFromPath(
          this.state.currentPath
        )
        this.goToPath(prevPath)
      }
    }
  }

  /**
   * Go to the specified path. Throws an error if path doesn't exist.
   * @param path The path to which the current state should represent
   */
  goToPath(path: ChessTypes.PlyPath | null) {
    // TODO: Validate the path
    this.status$.next({
      ...this.state,
      currentPath: path,
      fen: path
        ? this.getFENAtPath(path)
        : this.game.startFen || new Chess().fen()
    })
  }

  getSideToMove(fen: String) {
    return fen.split(' ')[1]
  }

  getFullMoveNumber(fen: string) {
    return fen.split(' ')[5]
  }

  /**
   * Get the status stream
   */
  getStatusStream() {
    return this.status$
  }
}
