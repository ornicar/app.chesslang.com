import * as _ChessJS from 'chess.js'

import { ChessTypes } from '../'

/* tslint:disable-next-line */
const ChessJS = typeof _ChessJS === 'function' ? _ChessJS : _ChessJS.Chess

/**
 * @class ChessJS wrapper
 */
export class Chess {
  private game

  /**
   * Create a new ChessJS game with FEN or default
   * @param fen
   */
  constructor(
    fen: ChessTypes.FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
  ) {
    this.game = new ChessJS(fen)
  }

  /**
   * Get the console printable ASCII representation of the current board
   */
  ascii(): string {
    return this.game.ascii()
  }

  /**
   * Get the 8x8 board piece occupation info, starting from the 8th rank.
   */
  board(): ChessTypes.ChessJSSquareOccupation[][] {
    return this.game.board()
  }

  /**
   * Clear the current board.
   */
  clear() {
    this.game.clear()
  }

  /**
   * Place a piece on the current board.
   * @param piece The piece and its color to be placed
   * @param square The square on which the piece should be placed
   */
  put(
    piece: { type: ChessTypes.ChessJSPiece; color: ChessTypes.Side },
    square: ChessTypes.SquareLabel
  ): boolean {
    return this.game.put(piece, square)
  }

  /**
   * Remove piece from the given square.
   * @param square The square from which piece should be removed
   */
  remove(square: ChessTypes.SquareLabel): ChessTypes.ChessJSSquareOccupation {
    return this.game.remove(square)
  }

  /**
   * Reset the current board to initial position.
   */
  reset() {
    this.game.reset()
  }

  /**
   * Get FEN representation of the current board and game state
   */
  fen(): ChessTypes.FEN {
    return this.game.fen()
  }

  /**
   * Get the piece on a given square.
   * @param square The query square
   */
  get(square: ChessTypes.SquareLabel): ChessTypes.ChessJSSquareOccupation {
    return this.game.get(square)
  }

  /**
   * Get the history of moves played so far in the game.
   * @param options verbose output?
   */
  history(options?: {
    verbose: boolean
  }): (ChessTypes.SAN | ChessTypes.ChessJSVerboseMove)[] {
    return this.game.history(options)
  }

  /**
   * Is the current game over?
   */
  game_over(): boolean {
    return this.game.game_over()
  }

  /**
   * Is the king of side to move in check?
   */
  in_check(): boolean {
    return this.game.in_check()
  }

  /**
   * Is the king of side to move in checkmate?
   */
  in_checkmate(): boolean {
    return this.game.in_checkmate()
  }

  /**
   * Is the game a draw by rule?
   */
  in_draw(): boolean {
    return this.game.in_draw()
  }

  /**
   * Is the side to move in a stalemate?
   */
  in_stalemate(): boolean {
    return this.game.in_stalemate()
  }

  /**
   * Is the side to move in a threefold repetition?
   */
  in_threefold_repetition(): boolean {
    return this.game.in_threefold_repetition()
  }

  /**
   * Is the game in insufficient material
   */
  insufficient_material(): boolean {
    return this.game.insufficient_material()
  }

  /**
   * Get the current side to move
   */
  turn(): ChessTypes.Side {
    return this.game.turn()
  }

  /**
   * Get or set PGN tag headers. To set, pass tag value pairs.
   */
  header(...tagValuePairs: string[]): { [tag: string]: string } | void {
    return this.game.header(...tagValuePairs)
  }

  /**
   * Make the given move in the position.
   * @param move The move to be made
   * @param options
   */
  move(
    move: ChessTypes.ChessJSVerboseInputMove | ChessTypes.SAN,
    options?: { sloppy: boolean }
  ): ChessTypes.ChessJSVerboseMove | null {
    return this.game.move(move)
  }

  /**
   * Undo the last move made.
   */
  undo(): ChessTypes.ChessJSVerboseMove | null {
    return this.game.undo()
  }

  /**
   * Get a list of legal moves in the current position.
   * @param options
   */
  moves(options?: {
    verbose: boolean
  }): (ChessTypes.ChessJSVerboseMove | ChessTypes.SAN)[] {
    return this.game.moves()
  }

  /**
   * Load the game state in the given FEN.
   * @param fen
   */
  load(fen: ChessTypes.FEN): boolean {
    return this.game.load(fen)
  }

  /**
   * Load the game in the given PGN text.
   * @param pgn
   * @param options
   */
  load_pgn(pgn: string, options?: { sloppy: boolean }): boolean {
    return this.game.load_pgn(pgn, options)
  }

  /**
   * Get the PGN representation of the current game.
   * @param options
   */
  pgn(options?: { max_width?: number; newline_char?: string }): string {
    return this.game.pgn(options)
  }

  /**
   * Utility method. Get the square color of the given square.
   * @param square
   */
  square_color(
    square: ChessTypes.SquareLabel
  ): ChessTypes.ChessJSSquareColor | null {
    return this.game.square_color(square)
  }

  /**
   * Utility method. Validate the given FEN string.
   * @param square
   */
  validate_fen(fen: ChessTypes.FEN): ChessTypes.ChessJSFenValidationResult {
    return this.game.validate_fen(fen)
  }
}
