import { ShortMove } from 'chess.js'

export enum GameAreaStatus {
  OFFLINE = 'offline',
  ONLINE = 'online',
  AWAY = 'away'
}

export enum GameStatus {
  MUTUAL_AGREEMENT = 'MUTUAL_AGREEMENT',
  CHECKMATE = 'CHECKMATE',
  THREE_FOLD_REPETITION = 'THREE_FOLD_REPETITION',
  TIMEOUT = 'TIMEOUT',
  RESIGNATION = 'RESIGNATION',
  STALEMATE = 'STALEMATE',
  ABORTED = 'ABORTED',
  DRAW = 'DRAW',
  UPDATED_BY_COACH = 'UPDATED_BY_COACH',
  IN_PROGRESS = 'IN_PROGRESS'
}

export interface GameResult {
  black: number
  white: number
  text: string | null
  status: GameStatus | null
}

export interface Game {
  uuid: string
  meta: {
    fen: string
  }
  content: {
    mainline: ShortMove[]
  }
}
