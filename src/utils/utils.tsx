import { FormattedMessage } from 'react-intl'
import React from 'react'
import { Util, ChessTypes, Chess } from '@chesslang/chess'
import * as R from 'ramda'
import Cookies from 'universal-cookie'
import { GameResult, Game } from '../types'
import { Variation } from '@chesslang/chess/build/ChessTypes/ChessTypes'
import { Chess as Chess2, ShortMove } from 'chess.js'
import { DEFAULT_START_FEN } from '@chesslang/chess/build/Util/Util'

export const cookies = new Cookies()

export var convertDbFormatToPgn = (game: Game) => {
  const c = new Chess2(game.meta.fen || DEFAULT_START_FEN)
  game.content.mainline.forEach((m: ShortMove) => {
    c.move(m)
  })

  return c.pgn()
}

export var legacyDownloadPgn = (
  name: string,
  initialFen: string,
  mainline: Variation
) => {
  const pgn = Util.variationToPGN(mainline, 0)

  const meta = {
    FEN: initialFen,
    Event: 'Platform'
  }
  return downloadPgn(name, pgn, meta)
}

export var downloadPgn = (name: string, pgn: string, meta: any) => {
  downloadFile(name, getPgnWithMeta(pgn, meta))
}

export var getPgnWithMeta = (pgn: string, meta: any) => {
  let metaStr = ''
  for (var key in meta) {
    metaStr += `\n[${key} "${meta[key]}"]`
  }
  return `${metaStr}\n${pgn || ''}\n`
}

export var downloadFile = (name: string, contents: string) => {
  const file = new Blob([contents], { type: 'text/plain' })

  const element = document.createElement('a')
  element.href = URL.createObjectURL(file)
  element.download = `${name}.pgn`
  document.body.appendChild(element)
  element.click()
}

export function getFormattedMessage(id_: string, defaultMessage_: string): any {
  return <FormattedMessage id={id_} defaultMessage={defaultMessage_} />
}

export const hydrateVariationWithDerivedFields = (
  startFen: ChessTypes.FEN,
  variation: ChessTypes.Variation
) => {
  const g = new Chess(startFen)
  return R.map(m => {
    const currentFen = g.fen()
    const move = g.move({
      from: m.from,
      to: m.to,
      promotion: m.promotion && m.promotion.toLowerCase()
    } as any)

    if (!move) {
      // TODO: Handle null moves
      throw new Error(`Illegal move: ${m.from} ${m.to}`)
    }

    m.fen = g.fen()
    m.side = move!.color
    m.san = move!.san
    if (m.variations) {
      m.variations = R.map(
        v => hydrateVariationWithDerivedFields(currentFen, v),
        m.variations
      )
    }
    return m
  }, variation)
}

export const hydrateWithDerviedFields = (meta: any, game: ChessTypes.Game) => {
  const startFen =
    meta.startFen ||
    meta.fen ||
    meta.startfen ||
    game.startFen ||
    new Chess().fen()
  try {
    return {
      ...game,
      mainline: hydrateVariationWithDerivedFields(startFen, game.mainline),
      startFen: startFen
    }
  } catch (e) {
    console.log('--> Error: ', e)
    return {
      ...game,
      mainline: []
    }
  }
}

export function getFormattedName(user: any) {
  if (user == null) {
    return null
  }
  return `${user.firstname}, ${user.lastname} (${user.username})`
}

export function formattedResult(result?: GameResult) {
  if (result == null) {
    return '*'
  }

  return formattedResult2(result!.white, result!.black)
}

export function formattedResult2(whiteScore: number, blackScore: number) {
  if (whiteScore == null || blackScore == null) {
    return '*'
  }

  if (whiteScore == 0 && blackScore == 0) {
    return '*'
  }

  function format(result: number) {
    return result == 0.5 ? '1/2' : result.toString()
  }

  return `${format(whiteScore)} - ${format(blackScore)}`
}

export function getTimeInSeconds(t: number) {
  return Math.floor(t / 1000)
}

export function formatTime(time: number) {
  return Math.floor(time / 60) + ':' + ('' + (time % 60)).padStart(2, '0')
}

export const DEFAULT_FEN: string =
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
