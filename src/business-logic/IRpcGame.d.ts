import { GameResult } from '../types'

export interface RpcGameState {
  timeControl: number
  increment: number
  move: Move
  turn: string
  whiteUuid: string
  blackUuid: string
  whiteName: string
  blackName: string
  whiteTime: number
  blackTime: number
  isClockRunning: boolean
  dests: any
  fen: string
  result: GameResult
}

export interface Move {
  orig: string
  dest: string
  promotion: string
}

export interface RpcGameMove {
  move: Move
  turn: string
  whiteTime: number
  blackTime: number
  isClockRunning: boolean
  whiteUuid: string
  blackUuid: string
  dests: any
  fen: string
}

export type OnConnectCallback = (gameState: RpcGameState) => void
export type OnMoveCallback = (gameMove: RpcGameMove) => void
export type OnGameOverCallback = (result: GameResult) => void
export type OnOfferDrawCallback = (playerColor: string) => void
export type OnOfferRematchCallback = (playerColor: string) => void

export interface IRpcGame {
  gameId: string

  makeMove(orig: string, dest: string, promotion?: string): void
  resignGame(playerColor: string): void
  offerDraw(playerColor: string): void
  acceptDraw(): void
  offerRematch(playerColor: string): void
  acceptRematch(): void

  onConnect(callback: OnConnectCallback): void
  onMove(callback: OnMoveCallback): void
  onGameOver(callback: OnGameOverCallback): void
  onOfferDraw(callback: OnOfferDrawCallback): void
  onOfferRematch(callback: OnOfferRematchCallback): void

  teardown(): void
}
