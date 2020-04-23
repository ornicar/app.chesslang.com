export type FEN = string
export type SAN = string
export type Side = 'w' | 'b'
export type PromotionPiece = 'Q' | 'R' | 'B' | 'N'
export type SquareLabel =
  | 'a1'
  | 'b1'
  | 'c1'
  | 'd1'
  | 'e1'
  | 'f1'
  | 'g1'
  | 'h1'
  | 'a2'
  | 'b2'
  | 'c2'
  | 'd2'
  | 'e2'
  | 'f2'
  | 'g2'
  | 'h2'
  | 'a3'
  | 'b3'
  | 'c3'
  | 'd3'
  | 'e3'
  | 'f3'
  | 'g3'
  | 'h3'
  | 'a4'
  | 'b4'
  | 'c4'
  | 'd4'
  | 'e4'
  | 'f4'
  | 'g4'
  | 'h4'
  | 'a5'
  | 'b5'
  | 'c5'
  | 'd5'
  | 'e5'
  | 'f5'
  | 'g5'
  | 'h5'
  | 'a6'
  | 'b6'
  | 'c6'
  | 'd6'
  | 'e6'
  | 'f6'
  | 'g6'
  | 'h6'
  | 'a7'
  | 'b7'
  | 'c7'
  | 'd7'
  | 'e7'
  | 'f7'
  | 'g7'
  | 'h7'
  | 'a8'
  | 'b8'
  | 'c8'
  | 'd8'
  | 'e8'
  | 'f8'
  | 'g8'
  | 'h8'

export interface Annotation {
  type: string
}

export interface TextAnnotation {
  type: 'TEXT'
  prefix?: true
  body: string
}

export interface NAGAnnotation {
  type: 'NAG'
  code: number
}

export type AnnotationColor = 'red' | 'green' | 'yellow' | 'blue'

export interface ArrowAnnotation {
  type: 'ARROW'
  color: AnnotationColor
  from: SquareLabel
  to: SquareLabel
}

export interface SquareHighlightAnnotation {
  type: 'SQUARE_HIGHLIGHT'
  color: AnnotationColor
  square: SquareLabel
}

export type Variation = Move[]
export type Index = number
export type Ply = number
export type PathTuple = [Index, Ply]
export type PlyPath = PathTuple[]

export interface Move {
  path: PlyPath
  side: Side
  san: SAN
  from: SquareLabel | null
  to: SquareLabel | null
  fen: FEN
  promotion?: PromotionPiece
  annotations?: Annotation[]
  variations?: Variation[]
}

export interface LegalMove extends Move {
  from: SquareLabel
  to: SquareLabel
}

export interface NullMove extends Move {
  type: 'NULL'
  san: '--'
  from: null
  to: null
}

export interface IllegalMove extends Move {
  type: 'ILLEGAL'
  from: SquareLabel
  to: SquareLabel
}

export type GameResult = '1-0' | '0-1' | '1/2-1/2' | '*'

export interface Game {
  meta: { [key: string]: string }
  startFen?: FEN
  result: GameResult
  mainline: Variation
  prefixAnnotations?: Annotation[]
}

// ChessJS Types
export type ChessJSSquareColor = 'light' | 'dark'
export type ChessJSPromotionPiece = 'q' | 'r' | 'b' | 'n'
export type ChessJSPiece = 'k' | 'p' | ChessJSPromotionPiece
export type ChessJSVacantSquare = null
export type ChessJSSquareOccupation =
  | { type: ChessJSPiece; color: Side }
  | ChessJSVacantSquare
export type ChessJSMoveFlags = string

export interface ChessJSVerboseInputMove {
  from: SquareLabel
  to: SquareLabel
  promotion?: ChessJSPromotionPiece
}

export interface ChessJSVerboseMove extends ChessJSVerboseInputMove {
  piece: ChessJSPiece
  color: Side
  san: SAN
  flags: ChessJSMoveFlags
}

export interface ChessJSFenValidationResult {
  valid: boolean
  error_number: number
  error: string
}
