import * as jsEnv from 'browser-or-node'
import * as R from 'ramda'
import {
  observable,
  action,
  computed,
  runInAction,
  autorun,
  reaction,
  toJS
} from 'mobx'
import { Firebase } from '../firebaseInit'
import { Util, GameEditor, ChessTypes } from '@chesslang/chess'

import { Chess } from 'chess.js'

import 'firebase/firestore'
import { userStore } from './user'
import { hydrateWithDerviedFields } from '../utils/utils'
import { TextAnnotation } from '@chesslang/chess/build/ChessTypes/ChessTypes'

export class AnalysisBoardStore {
  // @observable fen: string = Util.DEFAULT_START_FEN
  // @observable mainline
  // @observable currentPath

  @observable editor: GameEditor.GameEditor = new GameEditor.GameEditor()
  @observable state: any
  @observable fen: any
  @observable savedGameDetails: any = null
  undoStack: any = []

  // ref: any
  // unsub: any

  constructor() {
    this.reset()
  }

  @action.bound
  async reset() {
    this.savedGameDetails = null
    this.editor = new GameEditor.GameEditor()
    this.updateState()
  }

  async updateState() {
    this.state = this.editor.getState()
    if (this.state.currentPath === null) {
      this.fen = this.state.startFen || Util.DEFAULT_START_FEN
    }

    const move = this.editor.getMoveAtPath(this.state.currentPath)
    this.fen = move ? move.fen : this.fen
  }

  @action.bound
  move(move: ChessTypes.ChessJSVerboseInputMove) {
    var state = this.editor.getState()
    this.undoStack.push(JSON.stringify(state))
    this.editor.addMove(move /*, this.allowIllegalMoves */)
    this.updateState()
    // this.updateFirestore()
  }

  calcMovable() {
    // console.log('Calculating possible moves')
    const dests: any = {}

    const chess = new Chess(this.fen)

    chess.SQUARES.forEach(s => {
      const ms = chess.moves({ square: s, verbose: true })
      if (ms.length) dests[s] = ms.map(m => m.to)
    })
    const ret = {
      free: false,
      dests,
      color: chess.turn() == 'b' ? 'black' : 'white'
    }

    return ret
  }

  @action.bound async loadGame(gameUuid: string) {
    try {
      const response = await userStore
        .getApiCoreAxiosClient()!
        .get(`games/${gameUuid}`)

      this.savedGameDetails = response.data

      var gameInLegacyFormat = hydrateWithDerviedFields(
        response.data.meta,
        response.data.content
      )

      this.editor.setGame(gameInLegacyFormat)

      this.updateState()
    } catch (e) {
      return console.error('Error loading game')
    }
  }

  @action.bound async loadPublicGame(gameUuid: string) {
    try {
      const response = await userStore
        .getApiCoreAxiosClient()!
        .get(`public-games/${gameUuid}`)

      if (response.status == 404) {
        // game not found
        return false
      }

      this.savedGameDetails = response.data

      var gameInLegacyFormat = hydrateWithDerviedFields(
        response.data.meta,
        response.data.content
      )

      this.editor.setGame(gameInLegacyFormat)
      this.updateState()
    } catch (e) {
      console.error('Error loading game')
      return false
    }

    return true
  }

  @action.bound
  async saveGame(meta: any, databaseUuid: string) {
    console.log('Saving game to sharebox', databaseUuid)
    var game = stripDerivableFields(toJS(this.state))

    try {
      const response = await userStore.getApiCoreAxiosClient()!.post(`games`, {
        meta: meta,
        content: game,
        databaseUuid: databaseUuid
      })

      this.savedGameDetails = response.data
      console.log('Game created ', this.savedGameDetails.uuid)
      return this.savedGameDetails.uuid
    } catch (e) {
      // this.error = true
      // return false
    } finally {
      // this.loading = false
    }
  }

  @action.bound
  async updateGame() {
    var game = stripDerivableFields(toJS(this.state))

    try {
      const response = await userStore
        .getApiCoreAxiosClient()!
        .post(`games/${this.savedGameDetails.uuid}`, {
          meta: this.savedGameDetails.meta,
          content: game
        })

      this.savedGameDetails = response.data
      console.log('Game updated ', this.savedGameDetails.uuid)
    } catch (e) {
      // this.error = true
      return false
    } finally {
      // this.loading = false
    }

    return true
  }

  @action.bound
  async setIsPublic(checked: boolean) {
    try {
      const response = await userStore
        .getApiCoreAxiosClient()!
        .post(`games/${this.savedGameDetails.uuid}/is-public`, {
          isPublic: checked
        })

      this.savedGameDetails = response.data
      console.log('Game updated ', this.savedGameDetails.uuid)
    } catch (e) {
      return false
    }

    return true
  }

  resetGame() {
    this.loadGame(this.savedGameDetails.uuid)
  }

  @action.bound
  async newGame() {
    this.reset()
  }

  @action.bound
  async duplicateGame() {
    this.savedGameDetails = null
    return true
  }

  @computed
  get isPublic() {
    if (this.savedGameDetails != null) {
      return this.savedGameDetails.is_public || false
    }

    return false
  }

  @computed
  get isGameSaved() {
    return this.savedGameDetails != null
  }

  @computed
  get gameName() {
    if (this.savedGameDetails != null) {
      console.log(this.savedGameDetails)
      var meta = this.savedGameDetails.meta
      return `${meta.white} - ${meta.black} ${meta.result} ( ${meta.event} )`
    } else {
      return 'New Game'
    }
  }

  async convertToPgn() {
    console.log('Converting to PGN')

    var game = stripDerivableFields(toJS(this.state))
    console.log('Game', game)

    //     var chessJsGame = new Chess()
    //     game.mainline.forEach(move => {
    //       console.log('from: ', move.from, 'to: ', move.to)
    //       chessJsGame.move({ from: move.from, to: move.to })
    //     })

    //     const pgn = `
    // [Event "Chesslang Analysis Board"]

    // ${chessJsGame.pgn()}  *
    // `

    //     console.log(pgn)
    //     await gameboxDatabaseStore!.upload({
    //       file: new File([pgn], 'analysis-board.pgn'),
    //       create: 'test11'
    //     })
  }

  // @action.bound
  // toggleAllowIllegalMoves() {
  //   this.allowIllegalMoves = !this.allowIllegalMoves
  // }

  // @action.bound
  // togglePawnStructure() {
  //   this.isPawnStructureVisible = !this.isPawnStructureVisible
  //   this.updateFirestore()
  // }

  // @action.bound
  // toggleBlindTool() {
  //   this.isBlindToolOn = !this.isBlindToolOn
  //   this.updateFirestore()
  // }

  // @action.bound
  // setAnnotationsAtPath(path, annotations) {
  //   this.editor.setAnnotationsAtPath(path, annotations)
  //   this.updateState()
  //   this.updateFirestore()
  // }

  // @action.bound
  // setArrows(arrows) {
  //   this.arrows = arrows
  //   this.updateFirestore()
  // }

  // @action.bound
  // setSquareHighlights(squareHighlights) {
  //   this.squareHighlights = squareHighlights
  //   this.updateFirestore()
  // }

  // @action.bound
  // setIsPawnStructureVisible(val: boolean) {
  //   this.isPawnStructureVisible = val
  //   this.updateFirestore()
  // }

  // clearAnnotations() {
  //   this.setArrows([])
  //   this.setSquareHighlights([])
  //   this.setIsPawnStructureVisible(false)
  // }

  gotoPath(path: ChessTypes.PlyPath | null) {
    this.editor.gotoPath(path)
    this.updateState()
    // this.updateFirestore()
  }

  promoteVariation(path: ChessTypes.PlyPath) {
    this.editor.promoteVariationIntersecting(path)
    this.updateState()
  }

  deleteVariation(path: ChessTypes.PlyPath) {
    this.editor.deleteVariationIntersecting(path)
    this.updateState()
  }

  handleAddComment(path: ChessTypes.PlyPath, text: string) {
    this.editor.setAnnotationsAtPath(path, [
      {
        type: 'TEXT',
        body: text
      } as TextAnnotation
    ])
    this.updateState()
  }

  handleDeleteComment(path: ChessTypes.PlyPath) {
    this.editor.setAnnotationsAtPath(path, [])

    this.updateState()
  }

  @action.bound
  prev() {
    this.editor.prev()
    this.updateState()
  }

  @action.bound
  next() {
    this.editor.next()
    this.updateState()
  }

  @action.bound
  backward() {
    try {
      for (let i = 0; i < 5; i++) this.editor.prev()
    } catch {}
    this.updateState()
  }

  @action.bound
  forward() {
    try {
      for (let i = 0; i < 5; i++) this.editor.next()
    } catch {}
    this.updateState()
  }

  @action.bound
  undo() {
    if (this.undoStack.length == 0) {
      return
    }

    var state = JSON.parse(this.undoStack.pop())

    this.editor.setGame(state)
    this.editor.gotoPath(state.currentPath)

    this.updateState()
    // this.updateFirestore()
  }

  // @action.bound
  // toggleHideStudentMoves() {
  //   this.areMovesHiddenForStudents = !this.areMovesHiddenForStudents
  //   this.updateFirestore()
  // }

  // @action.bound
  // setAreMovesHiddenForStudents(val: boolean) {
  //   this.areMovesHiddenForStudents = val
  //   this.updateFirestore()
  // }

  @action.bound
  loadFen(fen: ChessTypes.FEN) {
    const valid = new Chess(fen)
    if (valid) {
      this.editor = new GameEditor.GameEditor(fen)
      this.updateState()
      return true
    }
    return false
  }

  // @computed
  // get annotationsAtCurrentPath() {
  //   if (this.currentPath) {
  //     const move = this.editor.getMoveAtPath(this.currentPath)
  //     if (move) {
  //       return move.annotations || []
  //     }
  //   }

  //   return []
  //   // return this.currentStatus!.preAnnotations || []
  // }

  @computed
  get sideToPlay() {
    const g = new Chess(this.fen)
    return g.turn() == 'w' ? 'white' : 'black'
  }

  // TODO: purge later
  // @computed
  // get hasPawnStructureAnnotations() {
  //   const annotations = this.annotationsAtCurrentPath || []
  //   return annotations.filter(a => a.type === 'PAWN_STRUCTURE').length > 0
  // }

  // @computed
  // get squareHighlightAnnotations() {
  //   return (this.annotationsAtCurrentPath.filter(
  //     a => a.type === 'SQUARE_HIGHLIGHT'
  //   ) || []) as ChessTypes.SquareHighlightAnnotation[]
  // }

  // @computed
  // get arrowAnnotations() {
  //   return (this.annotationsAtCurrentPath.filter(a => a.type === 'ARROW') ||
  //     []) as ChessTypes.ArrowAnnotation[]
  // }
}

export function stripDerivableFields(game: ChessTypes.Game) {
  const stripFromVariation = (
    variation: ChessTypes.Variation
  ): ChessTypes.Variation =>
    R.map(m => {
      if (m.variations) {
        return {
          ...R.pick(['from', 'to', 'promotion', 'annotations'], m),
          variations: R.map(stripFromVariation, m.variations)
        } as ChessTypes.Move
      }

      return R.pick(
        ['from', 'to', 'promotion', 'annotations'],
        m
      ) as ChessTypes.Move
    }, variation)

  return {
    ...game,
    mainline: stripFromVariation(game.mainline)
  } as ChessTypes.Game
}

export const analysisBoardStore = new AnalysisBoardStore()
