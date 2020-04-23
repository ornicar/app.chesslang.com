import { observable, action, computed, autorun } from 'mobx'
import { userStore } from './user'
import _ from 'lodash'
import { Chess } from 'chess.js'
import { RpcGameState, RpcGameMove, IRpcGame } from '../business-logic/IRpcGame'
import RpcGame from '../business-logic/RpcGame'
import { getTimeInSeconds, formattedResult } from '../utils/utils'
import { GameResult, GameStatus } from '../types'
import { liveGameStore } from './live-game'
import accurateInterval from 'accurate-interval'
import { invitationStore } from './invitation-store'
import getAbly from '../ablyInit'

const TIME_GRANULARITY = 1000
const MAX_RETRY_COUNT = 10

export class SyncedGameStore {
  @observable fen = ''
  @observable lastMove: string[] = []
  @observable result: GameResult = {
    status: GameStatus.IN_PROGRESS,
    white: 0,
    black: 0,
    text: ''
  }

  @observable resultModalVisiblity = false

  @observable playerColor = 'white'
  @observable isDrawOffered: boolean = false
  @observable isRematchOffered: boolean = false

  @observable blackTime: number = 0
  @observable whiteTime: number = 0
  @observable playerName: string = ''
  @observable opponentName: string = ''
  opponentUuid: string = ''
  timeControl: number = 0
  increment: number = 0

  @observable isClockRunning: boolean = false
  @observable turn: string = 'white'
  @observable dests: any = {}
  @observable connectionStatus: string = ''

  @observable loading: boolean = false

  ticker: any

  serverAckTicker: ReturnType<typeof setTimeout> | null = null

  // constructor(initValues: any = {}) {}

  private rpcGame?: IRpcGame | null

  constructor() {
    autorun(() => {
      if (this.isClockRunning) {
        this.startTicker()
      } else {
        this.stopTicker()
      }
    })

    getAbly().connection.on(stateChange => {
      this.updateConnectionStatus(stateChange.current)
    })
  }

  @action.bound
  async initGame(gameId: string) {
    this.reset()

    console.log({ gameId })

    try {
      const response = await userStore
        .getGameServerAxiosClient()!
        .get(`live-games/${gameId}`)

      const state: RpcGameState = response.data

      if (state.result.status == GameStatus.IN_PROGRESS) {
        this.loading = true
        this.rpcGame = new RpcGame(gameId)
        this.rpcGame.onConnect(this.onConnect)
      }

      this.setGameState(response.data)
    } catch (ex) {
      console.log('game not found, clearing current game')
      liveGameStore.clearCurrentGame()
    }
  }

  @action.bound
  updateConnectionStatus(status: string) {
    this.connectionStatus = status
  }

  @action
  onConnect = (gameState: RpcGameState) => {
    console.log(this.rpcGame?.gameId, 'onConnect of synced game store called')
    this.loading = false
    this.setGameState(gameState)
    this.rpcGame!.onMove(this.onMove)
    this.rpcGame!.onGameOver(this.onGameOver)
    this.rpcGame!.onOfferDraw(this.onOfferDraw)
    this.rpcGame!.onOfferRematch(this.onOfferRematch)
  }

  @action.bound
  reset() {
    this.clearServerAckTimer()
    this.fen = ''
    this.lastMove = []
    this.result = {
      status: GameStatus.IN_PROGRESS,
      white: 0,
      black: 0,
      text: ''
    }

    this.resultModalVisiblity = false

    this.playerColor = 'white'
    this.isDrawOffered = false
    this.blackTime = 0
    this.whiteTime = 0
    this.playerName = ''
    this.opponentName = ''

    this.isClockRunning = false
    this.turn = 'white'
    this.dests = {}

    if (this.rpcGame) {
      // FIXME: disabling since this call is not returning a promise. Make this sync using async await
      // this.rpcGame.teardown()
      this.rpcGame = null
    }
  }

  @action.bound
  onGameOver = (result: GameResult) => {
    this.result = result
    this.resultModalVisiblity = true
    this.isClockRunning = false
    this.clearServerAckTimer()
  }

  @computed
  get isGameInProgress() {
    return this.result.status === GameStatus.IN_PROGRESS
  }

  @action.bound
  setGameState = (gameState: RpcGameState) => {
    console.log({ gameState })
    if (userStore.uuid == gameState.whiteUuid) {
      this.playerColor = 'white'
      this.playerName = gameState.whiteName
      this.opponentName = gameState.blackName
      this.opponentUuid = gameState.blackUuid
    } else if (userStore.uuid == gameState.blackUuid) {
      this.playerColor = 'black'
      this.playerName = gameState.blackName
      this.opponentName = gameState.whiteName
      this.opponentUuid = gameState.whiteUuid
    }
    this.whiteTime = gameState.whiteTime
    this.blackTime = gameState.blackTime
    this.turn = gameState.turn
    this.isClockRunning = gameState.isClockRunning
    this.fen = gameState.fen
    this.result = gameState.result
    this.dests = gameState.dests
    this.timeControl = gameState.timeControl
    this.increment = gameState.increment
  }

  @action.bound
  clearServerAckTimer() {
    if (this.serverAckTicker) {
      console.log('Clearing server ack timer')
      clearInterval(this.serverAckTicker)
      this.serverAckTicker = null
    }
  }

  @action.bound
  onMove = (gameMove: RpcGameMove) => {
    this.clearServerAckTimer()
    this.fen = gameMove.fen
    this.blackTime = gameMove.blackTime
    this.whiteTime = gameMove.whiteTime
    this.isClockRunning = gameMove.isClockRunning
    this.turn = gameMove.turn
    this.dests = gameMove.dests
    this.lastMove = [
      gameMove.move.orig,
      gameMove.move.dest,
      gameMove.move.promotion
    ]
  }

  onOfferDraw = (playerColor: string) => {
    // TODO: make sure player color is not set for viewers
    // to ensure the notification doesn't show up for viewers
    if (this.playerColor != playerColor) {
      this.setIsDrawOffered(true)
    }
  }

  onOfferRematch = (playerColor: string) => {
    if (this.playerColor != playerColor) {
      this.setIsRematchOffered(true)
    }
  }

  @computed
  get blackTimeInSeconds() {
    return getTimeInSeconds(this.blackTime)
  }

  @computed
  get whiteTimeInSeconds() {
    return getTimeInSeconds(this.whiteTime)
  }

  @computed
  get isGameOver() {
    return this.result.status != GameStatus.IN_PROGRESS
  }

  @action.bound
  stopTicker() {
    if (this.ticker != null) {
      this.ticker.clear() // First clear the previous timer
      this.ticker = null
    }
  }

  startTicker() {
    if (this.ticker != null) {
      console.log('Ticker already started. Ignoring timer start call')
      // Timer should only be started once per session
      return
    }

    console.log('Starting ticker')
    // Setup timers
    this.ticker = accurateInterval(this.updateClock, TIME_GRANULARITY, {
      aligned: true,
      immediate: true
    })
  }

  @action.bound
  updateClock = () => {
    if (!this.isClockRunning) {
      return
    }

    if (this.turn == 'white') {
      this.whiteTime = Math.max(this.whiteTime - TIME_GRANULARITY, 0)
    } else {
      this.blackTime = Math.max(this.blackTime - TIME_GRANULARITY, 0)
    }
  }

  @action.bound
  async makeMove(orig: string, dest: string, metadata: any) {
    if (this.isGameOver) {
      return
    }

    const chess = new Chess(this.fen)
    const promotion = metadata && metadata.promotion
    const move: any = {
      from: orig,
      to: dest,
      promotion
    }
    chess.move(move)

    // Temporary client side state for immediate feedback
    // Later will be overriden by server state
    this.fen = chess.fen()
    this.lastMove = [orig, dest, promotion]
    this.dests = []
    this.turn = this.playerColor == 'white' ? 'black' : 'white'

    this.rpcGame!.makeMove(orig, dest, promotion)

    let retryCount = 0
    this.serverAckTicker = setInterval(() => {
      console.log('Server ack not received. Sending move again')
      this.rpcGame!.makeMove(orig, dest, promotion)

      retryCount++
      if (retryCount >= MAX_RETRY_COUNT) {
        this.clearServerAckTimer()
      }
    }, 3000)
  }

  resignGame = () => {
    this.rpcGame!.resignGame(this.playerColor)
  }

  offerDraw = () => {
    this.rpcGame!.offerDraw(this.playerColor)
  }

  acceptDraw = () => {
    this.rpcGame!.acceptDraw()
  }

  offerRematch = () => {
    invitationStore!.sendInvite(
      this.opponentUuid,
      this.playerColor == 'black' ? 'white' : 'black', //send the opposite color
      this.timeControl,
      this.increment
    )
  }

  @action.bound
  abortGame() {
    console.log('Abort Game [NOT IMPLEMENTED]')

    // this.gameOver = true

    // this.result = {
    //   status: this.ABORTED,
    //   white: '0',
    //   black: '0',
    //   text: 'Game aborted'
    // }

    // this.setResultModalVisiblity(true)
  }

  @action.bound
  async clearCurrentGame() {
    await liveGameStore.clearCurrentGame()
    this.reset()
  }

  @action.bound
  setResultModalVisiblity(isVisible: boolean) {
    this.resultModalVisiblity = isVisible
  }

  @action.bound
  setIsDrawOffered(drawOffer: boolean) {
    this.isDrawOffered = drawOffer
  }

  @action.bound
  setIsRematchOffered(rematchOffered: boolean) {
    this.isRematchOffered = rematchOffered
  }

  @computed
  get isTournamentModeOn() {
    return liveGameStore.isTournamentModeOn
  }

  @computed
  get shouldShowAbort() {
    // FIXME: derive value from number of moves
    return false
    // return !this.isTournamentModeOn && this.moves.length <= 2
  }

  @computed
  get formattedResult() {
    return formattedResult(this.result)
  }
}

export const syncedGameStore = new SyncedGameStore()
