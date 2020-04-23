import * as R from 'ramda'
import { forEach, omit, last, dropLast } from 'ramda'
import { ChessTypes, Chess } from '../'

export const DEFAULT_START_FEN: ChessTypes.FEN =
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
export const CLEAR_FEN: ChessTypes.FEN = '8/8/8/8/8/8/8/8 w - - 0 1'

export function squareLabelToIndex(squareLabel: ChessTypes.SquareLabel) {
  const fileIndex = squareLabel.charCodeAt(0) - 'a'.charCodeAt(0)
  const rankIndex = squareLabel.charCodeAt(1) - '1'.charCodeAt(0)
  return rankIndex * 8 + fileIndex
}

export function expandFen(fen: ChessTypes.FEN): ChessTypes.FEN {
  const components = fen.split(' ')
  const piecePlacement = components[0]
    .replace(/8/g, '11111111')
    .replace(/7/g, '1111111')
    .replace(/6/g, '111111')
    .replace(/5/g, '11111')
    .replace(/4/g, '1111')
    .replace(/3/g, '111')
    .replace(/2/g, '11')

  return [piecePlacement, ...R.drop(1, components)].join(' ')
}

export function compressFen(fen: ChessTypes.FEN): ChessTypes.FEN {
  const components = fen.split(' ')

  const piecePlacement = components[0]
    .replace(/11111111/g, '8')
    .replace(/1111111/g, '7')
    .replace(/111111/g, '6')
    .replace(/11111/g, '5')
    .replace(/1111/g, '4')
    .replace(/111/g, '3')
    .replace(/11/g, '2')

  return [piecePlacement, ...R.drop(1, components)].join(' ')
}

export function getFenSquareOccupation(
  fen: ChessTypes.FEN,
  square: ChessTypes.SquareLabel
): ChessTypes.ChessJSSquareOccupation {
  const components = expandFen(fen).split(' ')
  const squareIndex = squareLabelToIndex(square)
  const fenChar = components[0]
    .split('/')
    .reverse()
    .join('')
    .split('')[squareIndex]

  if (fenChar === '1') {
    return null
  }

  return {
    type: fenChar.toLowerCase() as ChessTypes.ChessJSPiece,
    color: fenChar.toUpperCase() === fenChar ? 'w' : 'b'
  }
}

export function placePieceOnFen(
  fen: ChessTypes.FEN,
  occupation: ChessTypes.ChessJSSquareOccupation,
  square: ChessTypes.SquareLabel
) {
  if (occupation) {
    const { type, color } = occupation
    const components = expandFen(fen).split(' ')
    const fenChar = color === 'w' ? type.toUpperCase() : type.toLowerCase()
    const squareIndex = squareLabelToIndex(square)
    const reversedPiecePlacement = components[0]
      .split('/')
      .reverse()
      .join('')
      .split('')
    reversedPiecePlacement.splice(squareIndex, 1, fenChar)
    const piecePlacement = R.map(
      p => p.join(''),
      R.splitEvery(8, reversedPiecePlacement).reverse()
    ).join('/')
    return compressFen([piecePlacement, ...R.drop(1, components)].join(' '))
  }

  return fen
}

export function removePieceFromFen(
  fen: ChessTypes.FEN,
  square: ChessTypes.SquareLabel
) {
  const components = expandFen(fen).split(' ')
  const fenChar = '1'
  const squareIndex = squareLabelToIndex(square)
  const reversedPiecePlacement = components[0]
    .split('/')
    .reverse()
    .join('')
    .split('')
  reversedPiecePlacement.splice(squareIndex, 1, fenChar)
  const piecePlacement = R.map(
    p => p.join(''),
    R.splitEvery(8, reversedPiecePlacement).reverse()
  ).join('/')
  return compressFen([piecePlacement, ...R.drop(1, components)].join(' '))
}

export function getSideToMoveFromFen(fen: ChessTypes.FEN): ChessTypes.Side {
  if (fen && fen.split(' ')[1] === 'b') {
    return 'b' as ChessTypes.Side
  }

  return 'w' as ChessTypes.Side
}

export function getUpdatedFenWithNullMove(fen: ChessTypes.FEN): ChessTypes.FEN {
  const components = fen.split(' ')

  return [
    components[0],
    // Update side to move
    components[1] === 'w' ? 'b' : 'w',
    components[2],
    // Remove enpassant target
    '-',
    // Increment half move counter
    parseInt(components[4], 10) + 1,
    // Increment full move counter if black was to play
    components[1] === 'b' ? parseInt(components[5], 10) + 1 : components[5]
  ].join(' ')
}

export function getUpdatedFenWithIllegalMove(
  fen: ChessTypes.FEN,
  move: ChessTypes.ChessJSVerboseInputMove
): ChessTypes.FEN {
  const piece = getFenSquareOccupation(fen, move.from)

  // TODO: Handle promotion (Its a 1% corener case though)
  if (piece) {
    const newFen = placePieceOnFen(
      removePieceFromFen(fen, move.from),
      piece,
      move.to
    )
    const components = newFen.split(' ')

    return [
      components[0],
      // Update side to move
      components[1] === 'w' ? 'b' : 'w',
      components[2],
      components[3],
      0,
      // Increment full move counter if black was to play
      components[1] === 'b' ? parseInt(components[5], 10) + 1 : components[5]
    ].join(' ')
  }

  return fen
}

/**
 * Given a sequence of moves and a starting position, get the position at the end of the sequence
 */
export function getFenAtEndOfVariation(
  startFen: ChessTypes.FEN,
  variation: ChessTypes.Variation
): ChessTypes.FEN {
  const g = new Chess(startFen)

  forEach((move: ChessTypes.Move | ChessTypes.NullMove) => {
    if (
      (move as ChessTypes.NullMove).type &&
      (move as ChessTypes.NullMove).type === 'NULL'
    ) {
      if (!g.load(getUpdatedFenWithNullMove(g.fen()))) {
        throw new Error('Error processing NULL move')
      }
    } else {
      g.move({
        from: move.from,
        to: move.to,
        promotion: (move as ChessTypes.Move).promotion
          ? ((move as ChessTypes.Move).promotion!.toLowerCase() as ChessTypes.ChessJSPromotionPiece)
          : undefined
      } as ChessTypes.ChessJSVerboseInputMove)
    }
  }, variation)

  return g.fen()
}

/**
 * Remove promotion property from move object if it is undefined
 * @param move
 */
export function truncatePromotion(move: ChessTypes.Move): ChessTypes.Move {
  return move.promotion ? move : omit(['promotion'], move)
}

/**
 * Remove useless properties from move
 */
export function truncateMoveFields(move: ChessTypes.Move): ChessTypes.Move {
  return R.compose(
    R.ifElse(
      (m: ChessTypes.Move) => m.annotations! && m.annotations!.length === 0,
      R.dissoc('annotations'),
      R.identity
    ),
    R.ifElse(
      (m: ChessTypes.Move) => m.variations! && m.variations!.length === 0,
      R.dissoc('variations'),
      R.identity
    ),
    truncatePromotion
  )(move) as ChessTypes.Move
}

export function getFullMoveNumber(fen: ChessTypes.FEN) {
  return fen ? fen.split(' ')[5] : ' '
}

/**
 * Convert Variation to PGN string
 * @param variation
 */
export function variationToPGN(
  variation: ChessTypes.Variation,
  level: number
): string {
  if (!variation) {
    return ''
  }

  let pgn = variation
    .map((m, i) => {
      const nagAnnotations = R.filter(
        a => a.type === 'NAG',
        m.annotations || []
      )
      const textAnnotations = R.filter(
        a => a.type === 'TEXT',
        m.annotations || []
      )

      let c = ''

      if (m.side === 'w') {
        c += `${getFullMoveNumber(m.fen)}. `
      } else if (m.side === 'b' && i === 0) {
        c += `${(getFullMoveNumber(m.fen) as any) - 1}... `
      }

      c += m.san

      if (nagAnnotations.length > 0) {
        c += ` ${nagAnnotations.join(' ')}`
      }

      if (textAnnotations.length > 0) {
        c += ` ${(textAnnotations[0] as ChessTypes.TextAnnotation).body}`
      }

      if (m.variations && m.variations.length > 0) {
        c += ' ' + m.variations.map(v => variationToPGN(v, level + 1)).join(' ')
      }

      return c
    })
    .join(' ')

  if (level > 0) {
    pgn = `( ${pgn} )`
  }

  return pgn
}

/**
 * Add a given number to the path
 * @param path
 * @param n
 */
export function addToPath(
  path: ChessTypes.PlyPath,
  n: number
): ChessTypes.PlyPath {
  // [...(everything except the last), [(index of last), (ply of last + n)]]
  return [...dropLast(1, path), [last(path)![0], last(path)![1] + n]]
}

export function addOneToPath(path: ChessTypes.PlyPath): ChessTypes.PlyPath {
  return addToPath(path, 1)
}

export function subtractOneFromPath(
  path: ChessTypes.PlyPath
): ChessTypes.PlyPath {
  return addToPath(path, -1)
}

export function addNumberOfStepsToPath(
  path: ChessTypes.PlyPath,
  noOfSteps: number
) {
  return addToPath(path, noOfSteps)
}

export function pathEquals(
  p1: ChessTypes.PlyPath | null,
  p2: ChessTypes.PlyPath | null
) {
  return (p1 || '').toString() === (p2 || '').toString()
}
