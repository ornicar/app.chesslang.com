import { map, addIndex, last, dropLast, head, drop } from 'ramda'

import { Chess, ChessTypes, Util } from '../'

/**
 * Get moves for the accumulated PGN text
 * @param moveText pgn text to parse
 * @param startFen starting position
 * @param continueFromPath from which path is this move continuing
 *
 * @returns The tuple of variation and FEN string at the end of the variation
 */
const getMoves = function getMoves(
  moveText: string,
  startFen: ChessTypes.FEN,
  continueFromPath?: ChessTypes.PlyPath
): [ChessTypes.Variation, ChessTypes.FEN] {
  // Clean up the right end of the move to find hanging move numbers
  const trimmed = moveText.trim().replace(/[^a-h]\d+\.?\.?\.?\s?$/g, '')
  if (trimmed.length === 0) {
    return [[], startFen]
  }

  const g = new Chess()
  const loaded = g.load_pgn(
    [
      `[FEN "${startFen}"]`,
      '[SetUp "1"]',
      `1. ${moveText}` // '1. ' Due to weird bugs in Chess.JS!
    ].join('\n'),
    { sloppy: true }
  )

  if (!loaded) {
    if (process && process.env.NODE_ENV !== 'production') {
      console.error('--------------------')
      console.error('PGN Parse Error: ')
      console.error('startFEN: ', startFen)
      console.error('moveText: ', moveText)
      console.error('--------------------')
    }
    throw new Error('PGN failed to parse PGN')
  }

  const fenIterator = new Chess(startFen)
  const variation = addIndex(map)(
    (move: ChessTypes.ChessJSVerboseMove, i) =>
      Util.truncatePromotion({
        path: (continueFromPath
          ? Util.addToPath(continueFromPath, i)
          : [0, i]) as ChessTypes.PlyPath,
        side: move.color,
        from: move.from,
        to: move.to,
        san: move.san,
        promotion: (move.promotion
          ? move.promotion.toUpperCase()
          : undefined) as ChessTypes.PromotionPiece,
        fen: (fenIterator.move(move.san) && fenIterator.fen()) as ChessTypes.FEN
      }),
    g.history({ verbose: true })
  )

  return [variation, g.fen()] as [ChessTypes.Variation, ChessTypes.FEN]
}

const getTextAnnotation = function getTextAnnotation(
  moveText: string,
  startAtIndex: number
): [ChessTypes.TextAnnotation, number] {
  let body = ''
  let i = startAtIndex
  for (; i < moveText.length && moveText.charAt(i) !== '}'; i += 1) {
    body += moveText.charAt(i)
  }

  return [{ body, type: 'TEXT' } as ChessTypes.TextAnnotation, i + 1]
}

const getNAGAnnotation = function getNAGAnnotation(
  moveText: string,
  startAtIndex: number
): [ChessTypes.NAGAnnotation, number] {
  let code = ''
  let i = startAtIndex
  for (
    ;
    i < moveText.length && !isNaN(parseInt(moveText.charAt(i), 10));
    i += 1
  ) {
    code += moveText.charAt(i)
  }

  return [
    { code: parseInt(code, 10), type: 'NAG' } as ChessTypes.NAGAnnotation,
    startAtIndex + code.length
  ]
}

const getSuffixAnnotation = function getSuffixAnnotation(
  moveText: string,
  startAtIndex: number
): [ChessTypes.NAGAnnotation, number] {
  const i = startAtIndex
  const suffix = moveText.substr(i, 2)

  if (suffix === '!!') {
    return [{ code: 3, type: 'NAG' } as ChessTypes.NAGAnnotation, i + 2]
  }
  if (suffix === '!?') {
    return [{ code: 5, type: 'NAG' } as ChessTypes.NAGAnnotation, i + 2]
  }
  if (suffix === '??') {
    return [{ code: 4, type: 'NAG' } as ChessTypes.NAGAnnotation, i + 2]
  }
  if (suffix === '?!') {
    return [{ code: 6, type: 'NAG' } as ChessTypes.NAGAnnotation, i + 2]
  }
  if (suffix.charAt(0) === '!') {
    return [{ code: 1, type: 'NAG' } as ChessTypes.NAGAnnotation, i + 1]
  }
  if (suffix.charAt(1) === '?') {
    return [{ code: 2, type: 'NAG' } as ChessTypes.NAGAnnotation, i + 1]
  }

  return [{ code: -1, type: 'NAG' } as ChessTypes.NAGAnnotation, i + 1]
}

/**
 *
 * @param moveText input pgn string
 * @param startAtIndex moveText location from which parsing should start
 * @param startFen starting position of this variation
 * @param pathIndex index of this variation
 * @param parentPath parent path if any
 *
 * @returns parsed variation (sequence of moves) and the move text index till which parsing was done
 */
const extractVariation = function extractVariation(
  moveText: string,
  startAtIndex: number,
  startFen: ChessTypes.FEN,
  pathIndex: number,
  parentPath?: ChessTypes.PlyPath
): [ChessTypes.Variation, number] {
  let moves: ChessTypes.Variation = []
  let currentFen: ChessTypes.FEN = startFen
  let accumText = ''
  let prefixAnnotations: ChessTypes.Annotation[] = []
  let nextPath: ChessTypes.PlyPath = parentPath
    ? [...parentPath, [pathIndex, 0]]
    : [[pathIndex, 0]]

  let i = startAtIndex
  while (i < moveText.length) {
    const ch = moveText.charAt(i)

    // Look for a character that is not a move
    if (
      ch === '{' ||
      ch === '(' ||
      ch === '$' ||
      ch === '!' ||
      ch === '?' ||
      (ch === '-' && moveText.charAt(i + 1) === '-')
    ) {
      // Convert accumText into moves
      const [movesToConcat, lastFen] = getMoves(accumText, currentFen, nextPath)
      currentFen = lastFen
      moves = [...moves, ...movesToConcat]
      nextPath =
        moves.length > 0
          ? Util.addOneToPath((last(moves) as ChessTypes.Move).path)
          : nextPath

      if (prefixAnnotations.length > 0 && moves.length > 0) {
        const firstMove = head(moves) as ChessTypes.Move
        firstMove.annotations = firstMove.annotations
          ? [...firstMove.annotations, ...prefixAnnotations]
          : prefixAnnotations
        moves = [firstMove, ...drop(1, moves)]
        prefixAnnotations = []
      }

      if (ch === '{') {
        const [textAnnotation, parsedTillIndex] = getTextAnnotation(
          moveText,
          i + 1
        )

        // Add the parsed annotation to the move
        if (moves.length > 0) {
          const lastMove = last(moves) as ChessTypes.Move
          lastMove.annotations = lastMove.annotations
            ? [...lastMove.annotations, textAnnotation]
            : [textAnnotation]
          moves = [...dropLast(1, moves), lastMove]
        } else {
          prefixAnnotations.push({
            ...textAnnotation,
            prefix: true
          } as ChessTypes.TextAnnotation)
        }

        accumText = ''
        i = parsedTillIndex
      } else if (ch === '(') {
        // Illegal state if ( occurs at first
        const lastMove = last(moves) as ChessTypes.Move
        const lastButOneFen = Util.getFenAtEndOfVariation(
          startFen,
          dropLast(1, moves)
        )
        const [variation, parsedTillIndex] = extractVariation(
          moveText,
          i + 1,
          lastButOneFen,
          (lastMove.variations || []).length,
          Util.subtractOneFromPath(nextPath)
        )

        // Add the parsed annotation to the move
        if (moves.length > 0) {
          const lastMove = last(moves) as ChessTypes.Move
          lastMove.variations = lastMove.variations
            ? [...lastMove.variations, variation]
            : [variation]
          moves = [...dropLast(1, moves), lastMove]
        }

        accumText = ''
        i = parsedTillIndex
      } else if (ch === '$') {
        const [nagAnnotation, parsedTillIndex] = getNAGAnnotation(
          moveText,
          i + 1
        )

        // Add the parsed NAG annotation to the move
        if (moves.length > 0) {
          const lastMove = last(moves) as ChessTypes.Move
          lastMove.annotations = lastMove.annotations
            ? [...lastMove.annotations, nagAnnotation]
            : [nagAnnotation]
          moves = [...dropLast(1, moves), lastMove]
        }

        accumText = ''
        i = parsedTillIndex
      } else if (ch === '!' || ch === '?') {
        const [nagAnnotation, parsedTillIndex] = getSuffixAnnotation(
          moveText,
          i
        )

        // Add the parsed NAG annotation to the move
        if (moves.length > 0) {
          const lastMove = last(moves) as ChessTypes.Move
          lastMove.annotations = lastMove.annotations
            ? [...lastMove.annotations, nagAnnotation]
            : [nagAnnotation]
          moves = [...dropLast(1, moves), lastMove]
        }

        accumText = ''
        i = parsedTillIndex
      } else if (ch === '-' && moveText.charAt(i + 1) === '-') {
        // Null move
        // Add a null move to the current moves and update current FEN and everything
        const turn = new Chess(currentFen).turn()
        const nextFen = Util.getUpdatedFenWithNullMove(currentFen)

        const nullMove: ChessTypes.NullMove = {
          type: 'NULL',
          side: turn,
          path: nextPath,
          san: '--',
          from: null,
          to: null,
          fen: nextFen
        }

        currentFen = nextFen
        moves = [...moves, nullMove]

        accumText = ''
        i = i + 2
      }
    } else if (ch === ')') {
      // Close this variation
      if (accumText.length > 0) {
        const [movesToConcat] = getMoves(accumText, currentFen, nextPath)
        moves = [...moves, ...movesToConcat]
        accumText = ''
      }

      i += 1
      break
    } else {
      accumText += ch
      i += 1
    }
  }

  if (accumText.length > 0) {
    const [movesToConcat] = getMoves(accumText, currentFen, nextPath)
    moves = [...moves, ...movesToConcat]
  }

  return [moves, i]
}

const extractMeta = function extractMeta(
  pgnLines: string[]
): { [tag: string]: string } {
  let hasEnteredMoveText = false

  const linesWithTag = pgnLines.reduce((acc, line) => {
    if (!hasEnteredMoveText && line.trim().startsWith('[')) {
      // ChessJS bug, Refer https://github.com/jhlywa/chess.js/pull/154
      if (
        !(
          line
            .trim()
            .toLowerCase()
            .startsWith('[setup') ||
          line
            .trim()
            .toLowerCase()
            .startsWith('[currentposition')
        )
      ) {
        return [...acc, line.trim()]
      }
    }

    hasEnteredMoveText = true
    return acc
  }, [] as string[])

  const header = linesWithTag.join('\n')
  const g = new Chess()
  g.load_pgn(header)

  return g.header() as { [tag: string]: string }
}

/**
 * Given pgnLines and starting position, return a Variation
 */
const extractMainline = function extractMainline({
  pgnLines,
  startFen
}: {
  pgnLines: string[]
  startFen?: ChessTypes.FEN
}): ChessTypes.Variation {
  let hasEnteredMoveText = false

  const moveText = pgnLines
    .map(l => l.trim())
    .map(l => l.replace(/0-0-0/gi, 'O-O-O'))
    .map(l => l.replace(/o-o-o/gi, 'O-O-O'))
    .map(l => l.replace(/0-0/gi, 'O-O'))
    .map(l => l.replace(/o-o/gi, 'O-O'))
    .reduce((acc, line) => {
      if (hasEnteredMoveText) {
        return `${acc} ${line.trim()}`
      }

      if (!hasEnteredMoveText && line.trim().startsWith('[')) {
        hasEnteredMoveText = false
        return acc
      }

      hasEnteredMoveText = true
      return acc
    }, '')

  const [mainline] = extractVariation(
    moveText,
    0,
    startFen || Util.DEFAULT_START_FEN,
    0
  )

  return mainline
}

/**
 * Returns an array of PGN text strings for the given PGN database
 * @param pgnDatabase
 */
export function extractGames(pgnDatabase: string): string[] {
  let currentGame = { tagSection: '', moveText: '' }
  const games: string[] = []

  let i = 0
  while (i < pgnDatabase.trim().length) {
    const ch = pgnDatabase.charAt(i)

    if (ch === '[' && pgnDatabase.match) {
      currentGame.tagSection += '['

      // Parse till end of tag
      for (let j = i + 1; j < pgnDatabase.length; j += 1, i += 1) {
        if (
          pgnDatabase.charAt(j) === '"' &&
          pgnDatabase.charAt(j + 1) === ']'
        ) {
          i = j + 2
          currentGame.tagSection += '"]\n'
          break
        }
        currentGame.tagSection += pgnDatabase.charAt(j)
      }
    } else if (ch === '{') {
      // When a text comment is hit, just accumulate, don't check for game terminator
      currentGame.moveText += '{'

      // Parse till end of comment
      for (let j = i + 1; j < pgnDatabase.length; j += 1, i += 1) {
        if (pgnDatabase.charAt(j) === '}') {
          i = j + 1
          currentGame.moveText += '}'
          break
        }

        currentGame.moveText += pgnDatabase.charAt(j)
      }
    } else {
      const sliced = pgnDatabase.slice(i)
      let terminated = false
      if (sliced.startsWith('1-0')) {
        currentGame.moveText += '1-0'
        terminated = true
        i += '1-0'.length
      } else if (sliced.startsWith('0-1')) {
        currentGame.moveText += '0-1'
        terminated = true
        i += '0-1'.length
      } else if (sliced.startsWith('1/2-1/2')) {
        currentGame.moveText += '1/2-1/2'
        terminated = true
        i += '1/2-1/2'.length
      } else if (sliced.startsWith('*')) {
        currentGame.moveText += '*'
        terminated = true
        i += '*'.length
      } else {
        currentGame.moveText += ch
        i += 1
      }

      if (terminated) {
        games.push(
          `${currentGame.tagSection}\n\n${currentGame.moveText
            .trim()
            .replace(/(\r|\n)/gi, ' ')}`
        )
        currentGame = { tagSection: '', moveText: '' }
      }
    }
  }

  return games
}

const formatFenString = function formatFenString(
  fen: string | undefined
): ChessTypes.FEN | undefined {
  if (!fen) {
    return
  }

  const [
    piecePlacement,
    sideToMove,
    castlingRights,
    enPassantTarget,
    halfMove,
    fullMove
  ] = fen.split(' ')

  return `${piecePlacement} ${sideToMove} ${castlingRights ||
    '-'} ${enPassantTarget || '-'} ${halfMove} ${fullMove}`
}

/**
 * Parse the PGN text of a single game and return a game object
 * @throws Error on unsuccessful parsing
 * @param pgnText
 */
export function parsePgn(pgnText: string): ChessTypes.Game {
  const lines = pgnText
    .split('\n')
    .filter(l => !l.trim().startsWith('%'))
    .filter(
      l =>
        !l
          .trim()
          .toLowerCase()
          .startsWith('[setup')
    )

  const meta = extractMeta(lines)
  const startFen =
    formatFenString(
      meta['FEN'] || meta['fen'] || meta['Fen'] || meta['StartFen']
    ) || Util.DEFAULT_START_FEN
  const mainline = extractMainline({ startFen, pgnLines: lines })

  return {
    meta,
    startFen,
    mainline,
    result: (meta['Result'] || meta['result'] || '*') as ChessTypes.GameResult
  }
}
