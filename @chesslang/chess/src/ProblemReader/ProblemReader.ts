import { BehaviorSubject } from 'rxjs/BehaviorSubject'
import 'rxjs/add/operator/do'
import 'rxjs/add/observable/from'
import 'rxjs/add/observable/empty'
import 'rxjs/add/operator/concatMap'
import 'rxjs/add/operator/catch'
import axios from 'axios'

import { Chess, ChessTypes, Util } from '../'

export interface Args {
  jwtProvider: () => string
  baseUrl: string
  uuid: string
}

export interface MoveArgs {
  from: ChessTypes.SquareLabel
  to: ChessTypes.SquareLabel
  promotion?: ChessTypes.PromotionPiece
}

export interface Status {
  loading: boolean
  problem: ChessTypes.Game | null
  nextMove: string | null
  solved: boolean
}

export interface InternalStatus {
  fen: string | null
  currentPath: ChessTypes.PlyPath | null
  loading: boolean
  problem: ChessTypes.Game | null
  solved: boolean
}

export class ProblemReader {
  private baseUrl: string
  private jwtProvider: () => string
  private problem: ChessTypes.Game

  private state: Status
  private internalState: InternalStatus
  private status$: BehaviorSubject<Status>

  constructor(args: Args) {
    this.internalState = {
      fen: null,
      currentPath: null,
      loading: true,
      problem: null,
      solved: false
    }
    this.status$ = new BehaviorSubject<Status>({
      loading: true,
      problem: null,
      nextMove: null,
      solved: false
    })
    this.baseUrl = args.baseUrl
    this.jwtProvider = args.jwtProvider
    this.status$.subscribe(state => {
      this.state = state
    })
    this.fetchProblem(args.uuid)
  }

  private fetchProblem(uuid: string) {
    axios({
      method: 'get',
      url: `${this.baseUrl}database/api/v1/problem/${uuid}`,
      headers: {
        'x-authorization': `Bearer ${this.jwtProvider()}`
      }
    }).then((r: any) => {
      if (r.status === 200) {
        this.problem = r.data
        this.internalState = {
          ...this.internalState,
          loading: false,
          problem: this.problem,
          currentPath: this.problem.mainline[0].path,
          fen: this.getFENAtPath(this.problem.mainline[0].path)
        }
        this.status$.next({
          ...this.state,
          loading: false,
          problem: this.problem
        })
      } else {
        // TODO: better handling
        console.log('error in fetching data')
      }
    })
  }

  private getMoveAtPath(path: ChessTypes.PlyPath) {
    for (const move of this.problem.mainline) {
      if (move.path.length === path.length) {
        for (const p of move.path) {
          if (p[0] === path[0][0] && p[1] === path[0][1]) {
            return move
          }
        }
        // TODO: enhance for variation support
      }
    }
    return null
  }

  private getFENAtPath(path: ChessTypes.PlyPath) {
    let currentLine = this.problem.mainline
    let traversedVariation: ChessTypes.Variation = []
    let branchingPoint
    for (let i = 0; i < path.length; i += 1) {
      if (i === 0) {
        currentLine = this.problem.mainline
      } else {
        currentLine = branchingPoint.variation[path[i][0]]
      }

      // Traverse till variation point and then point to the variation
      traversedVariation = [
        ...traversedVariation,
        ...currentLine.slice(0, path[i][1])
      ]
      branchingPoint = currentLine[path[i][1]]
    }

    return Util.getFenAtEndOfVariation(
      this.problem.startFen || new Chess().fen(),
      traversedVariation
    )
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

  move(args: MoveArgs) {
    const move:
      | ChessTypes.Move
      | ChessTypes.NullMove
      | null = this.getMoveAtPath(this.internalState.currentPath!)
    const nextMove:
      | ChessTypes.Move
      | ChessTypes.NullMove
      | null = this.getMoveAtPath(
      Util.addOneToPath(this.internalState.currentPath!)
    )
    if (move !== null) {
      if (move!.from === args.from && move!.to === args.to) {
        if (nextMove === null) {
          this.internalState = {
            ...this.internalState,
            solved: true
          }
          this.status$.next({
            ...this.state,
            nextMove: null,
            solved: true
          })
        } else {
          this.internalState = {
            ...this.internalState,
            currentPath: Util.addNumberOfStepsToPath(
              this.internalState.currentPath!,
              2
            ),
            fen: this.getFENAtPath(
              Util.addNumberOfStepsToPath(this.internalState.currentPath!, 2)
            )
          }
          this.status$.next({
            ...this.state,
            nextMove: nextMove ? nextMove!.san : null,
            solved:
              this.getMoveAtPath(this.internalState.currentPath!) === null
                ? true
                : false
          })
        }
        return true
      }
    } else {
      this.internalState = {
        ...this.internalState,
        solved: true
      }
      this.status$.next({
        ...this.state,
        nextMove: null,
        solved: true
      })
    }

    return false
  }
}
