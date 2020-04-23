// tslint:disable
import * as React from 'react'
import { RefObject } from 'react'

import { Chess, ChessTypes, Util } from '@chesslang/chess'

import './chessboard.css'

const bb = require('./pieces/bb.svg')
const bk = require('./pieces/bk.svg')
const bn = require('./pieces/bn.svg')
const bp = require('./pieces/bp.svg')
const bq = require('./pieces/bq.svg')
const br = require('./pieces/br.svg')
const wb = require('./pieces/wb.svg')
const wk = require('./pieces/wk.svg')
const wn = require('./pieces/wn.svg')
const wp = require('./pieces/wp.svg')
const wq = require('./pieces/wq.svg')
const wr = require('./pieces/wr.svg')
const arrow = require('./arrow.svg')

const HIGHLIGHT_COLOR = '#208530'

export interface ChessboardProps {
  width: number
  height: number
  fen: string
  lightSquareColor?: string
  darkSquareColor?: string
  interactionMode: 'NONE' | 'MOVE' | 'SQUARE_HIGHLIGHT' | 'ARROW'
  squareHighlights?: ChessTypes.SquareHighlightAnnotation[]
  arrows?: ChessTypes.ArrowAnnotation[]
  coordinates?: boolean
  orientation?: ChessTypes.Side
  showSideToMove?: boolean
  allowIllegal?: boolean
  blindfold?: boolean
  onMove?: (move: ChessTypes.ChessJSVerboseMove) => any
  onSquareHighlightChange?: (
    squareHighlights: ChessTypes.SquareHighlightAnnotation[]
  ) => any
  onArrowChange?: (arrows: ChessTypes.ArrowAnnotation[]) => any
}

interface State {
  fromRank: number
  fromFile: number
  promotionPrompt?: { file: number; side: ChessTypes.Side }
}

export class Chessboard extends React.Component<ChessboardProps, State> {
  public static defaultProps: Partial<ChessboardProps> = {
    orientation: 'w',
    coordinates: false,
    lightSquareColor: '#f0d9b5',
    darkSquareColor: '#b58863',
    interactionMode: 'NONE',
    squareHighlights: [],
    arrows: [],
    showSideToMove: false,
    allowIllegal: false,
    blindfold: false
  }

  private interactionLayerRef: RefObject<HTMLDivElement>

  constructor(props: ChessboardProps) {
    super(props)
    this.interactionLayerRef = React.createRef()
    this.state = { fromRank: -1, fromFile: -1 }
  }

  componentDidUpdate(prevProps: ChessboardProps) {
    if (prevProps.fen !== this.props.fen) {
      this.playSound()
    }
  }

  public render() {
    const size = this.getSize()
    const fullSize = size

    return (
      <div
        className={`ChessboardContainer orientation-${
          this.props.orientation
        } interaction-mode-${this.props.interactionMode.toLowerCase()}`}
        style={{ width: fullSize, height: fullSize }}
      >
        {this.props.showSideToMove && (
          <div
            className={`side-to-move ${Util.getSideToMoveFromFen(
              this.props.fen
            )}`}
          />
        )}
        <div
          className={`Chessboard ${
            this.props.coordinates ? 'Coordinates' : ''
          }`}
          style={{ width: size, height: size }}
        >
          <div className="Squares Layer">
            <svg width={size} height={size}>
              {this.renderSquares()}
              {this.props.interactionMode === 'MOVE'
                ? this.renderSelectedSquare()
                : null}
            </svg>
          </div>
          <div className="FileCoordinates Layer">
            <svg width={size} height={size}>
              {this.renderFileCoordinates()}
            </svg>
          </div>
          <div className="RankCoordinates Layer">
            <svg width={size} height={size}>
              {this.renderRankCoordinates()}
            </svg>
          </div>
          <div className="Highlights Layer">
            <svg width={size} height={size}>
              {this.renderSquareHighlights()}
            </svg>
          </div>
          <div className="Arrow Layer">
            <svg width={size} height={size}>
              <defs>
                <marker
                  id="red-arrowhead"
                  viewBox="0 0 10 10"
                  refX="7"
                  refY="5"
                  markerUnits="strokeWidth"
                  markerWidth="4"
                  markerHeight="3"
                  orient="auto"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" stroke="none" fill="red" />
                </marker>
                <marker
                  id="green-arrowhead"
                  viewBox="0 0 10 10"
                  refX="7"
                  refY="5"
                  markerUnits="strokeWidth"
                  markerWidth="4"
                  markerHeight="3"
                  orient="auto"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" stroke="none" fill="green" />
                </marker>
                <marker
                  id="yellow-arrowhead"
                  viewBox="0 0 10 10"
                  refX="7"
                  refY="5"
                  markerUnits="strokeWidth"
                  markerWidth="4"
                  markerHeight="3"
                  orient="auto"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" stroke="none" fill="green" />
                </marker>
              </defs>
              {this.renderArrows()}
            </svg>
          </div>
          {!this.props.blindfold && (
            <div className="Pieces Layer">
              {this.renderPieces(this.props.fen)}
            </div>
          )}
          {this.props.interactionMode === 'ARROW' ? (
            <div
              ref={this.interactionLayerRef}
              className="Interaction Layer"
              style={{ width: size, height: size }}
            >
              {this.renderArrowInteractionEventSource()}
            </div>
          ) : null}
          {this.props.interactionMode === 'SQUARE_HIGHLIGHT' ? (
            <div
              ref={this.interactionLayerRef}
              className="Interaction Layer"
              style={{ width: size, height: size }}
            >
              {this.renderSquareHighlightInteractionEventSource()}
            </div>
          ) : null}
          {this.props.interactionMode === 'MOVE' ? (
            <div
              ref={this.interactionLayerRef}
              className="Interaction Layer"
              style={{ width: size, height: size }}
            >
              {this.renderMoveInteractionEventSource()}
            </div>
          ) : null}
          {this.props.interactionMode === 'MOVE' &&
          this.state.promotionPrompt ? (
            <div
              className="PromotionPrompt Layer"
              style={{ width: size, height: size }}
            >
              {this.renderPromotionPrompt(
                this.state.promotionPrompt.file,
                this.state.promotionPrompt.side
              )}
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  private renderFileCoordinates = () => {
    const squareSize = this.getSquareSize()
    const rank = this.props.orientation === 'w' ? 0 : 7

    const texts = []
    for (let file = 0; file < 8; file++) {
      texts.push(
        <text
          x={
            this.getTopLeftCoordinates(rank, file)[0] +
            squareSize -
            squareSize * 0.125
          }
          y={
            this.getTopLeftCoordinates(rank, file)[1] +
            squareSize -
            squareSize * 0.055
          }
          key={this.getSquareLabel(rank, file)}
          width={squareSize}
          height={squareSize}
          fill={this.getSquareFill(rank, file + 1)}
          fontSize={squareSize * 0.155}
        >
          {this.getFileChar(file)}
        </text>
      )
    }

    return texts
  }

  private renderRankCoordinates = () => {
    const squareSize = this.getSquareSize()
    const file = this.props.orientation === 'w' ? 0 : 7

    const texts = []
    for (let rank = 0; rank < 8; rank++) {
      texts.push(
        <text
          x={this.getTopLeftCoordinates(rank, file)[0] + squareSize * 0.04}
          y={this.getTopLeftCoordinates(rank, file)[1] + squareSize * 0.225}
          key={this.getSquareLabel(file, rank)}
          width={squareSize}
          height={squareSize}
          fill={this.getSquareFill(rank + 1, file)}
          fontSize={squareSize * 0.155}
          textAnchor="bottom"
        >
          {this.getRankChar(rank)}
        </text>
      )
    }

    return texts
  }

  private renderSquares = () => {
    const squareSize = this.getSquareSize()

    const rects = []
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        rects.push(
          <rect
            key={this.getSquareLabel(file, rank)}
            data-label={this.getSquareLabel(file, rank)}
            width={squareSize}
            height={squareSize}
            fill={this.getSquareFill(rank, file)}
            x={this.getTopLeftCoordinates(rank, file)[0]}
            y={this.getTopLeftCoordinates(rank, file)[1]}
          />
        )
      }
    }
    return rects
  }

  private renderSquareHighlights = () => {
    const squareSize = this.getSquareSize()

    return this.props.squareHighlights!.map(a => {
      const [file, rank] = this.getFileRank(a.square)
      return (
        <rect
          key={this.getSquareLabel(file, rank)}
          data-label={this.getSquareLabel(file, rank)}
          width={squareSize}
          height={squareSize}
          fill={a.color}
          opacity={0.5}
          x={this.getTopLeftCoordinates(rank, file)[0]}
          y={this.getTopLeftCoordinates(rank, file)[1]}
        />
      )
    })
  }

  private renderArrows = () => {
    const squareSize = this.getSquareSize()
    const halfSize = squareSize * 0.5
    const arrowSize = squareSize / 8

    return this.props.arrows!.map(a => {
      const [fromFile, fromRank] = this.getFileRank(a.from)
      const [fromX, fromY] = this.getTopLeftCoordinates(fromRank, fromFile)
      const [toFile, toRank] = this.getFileRank(a.to)
      const [toX, toY] = this.getTopLeftCoordinates(toRank, toFile)

      // TODO: Calculate the bearing angle and reduce x * cos(), y * sin()
      // so that the arrows don't hinder the pieces
      return (
        <path
          key={`arrow-${a.from}-${a.to}}`}
          d={`M ${fromX + halfSize},${fromY + halfSize} L ${toX +
            halfSize},${toY + halfSize}`}
          strokeWidth={arrowSize}
          stroke={a.color}
          fill={a.color}
          opacity={0.5}
          markerEnd={`url(#${a.color}-arrowhead)`}
        />
      )
    })
  }

  private renderSelectedSquare = () => {
    const squareSize = this.getSquareSize()
    const rank = this.state.fromRank
    const file = this.state.fromFile

    return (
      <rect
        key={`${rank}${file}`}
        width={squareSize}
        height={squareSize}
        fill={HIGHLIGHT_COLOR}
        opacity={0.3}
        x={this.getTopLeftCoordinates(rank, file)[0]}
        y={this.getTopLeftCoordinates(rank, file)[1]}
      />
    )
  }

  private renderPieces = (fen: string) => {
    const squareSize = this.getSquareSize()

    let piecePlacement = ''
    if (!fen || fen.split(' ').length === 0) {
      piecePlacement = '8/8/8/8/8/8/8/8'
    } else {
      piecePlacement = fen.split(' ')[0]
      if (piecePlacement.split('/').length < 8) {
        piecePlacement = '8/8/8/8/8/8/8/8'
      }
    }

    const pieces = []
    const ranks = piecePlacement
      .replace(/8/gi, '44')
      .replace(/7/gi, '34')
      .replace(/6/gi, '33')
      .replace(/5/gi, '32')
      .replace(/4/gi, '22')
      .replace(/3/gi, '12')
      .replace(/2/gi, '11')
      .split('/')

    for (let i = 7; i >= 0; i--) {
      const fenChars = ranks[i].split('')
      for (let j = 0; j < 8; j++) {
        const src = this.getImageSourceForFenChar(fenChars[j])
        if (src) {
          pieces.push(
            <img
              key={`${i}${j}${fenChars[j]}`}
              style={{
                left: this.getTopLeftCoordinates(i, j, false)[0],
                top: this.getTopLeftCoordinates(i, j, false)[1]
              }}
              width={squareSize}
              height={squareSize}
              src={src}
            />
          )
        }
      }
    }

    return pieces
  }

  private getImageSourceForFenChar = (fenChar: string) => {
    switch (fenChar) {
      case '1':
        return null

      case 'P':
        return wp
      case 'p':
        return bp
      case 'K':
        return wk
      case 'k':
        return bk
      case 'Q':
        return wq
      case 'q':
        return bq
      case 'R':
        return wr
      case 'r':
        return br
      case 'B':
        return wb
      case 'b':
        return bb
      case 'N':
        return wn
      case 'n':
        return bn
    }
  }

  private renderArrowInteractionEventSource = () => {
    const squareSize = this.getSquareSize()
    const sources = []

    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const props = {
          key: `${i}${j}`,
          style: {
            position: 'absolute',
            left: this.getTopLeftCoordinates(i, j)[0],
            top: this.getTopLeftCoordinates(i, j)[1],
            width: squareSize,
            height: squareSize
          },
          draggable: true
        } as any
        sources.push(
          <div
            {...props}
            onDragStart={this.handleArrowDragStart}
            onDragEnd={this.handleArrowDragEnd}
          />
        )
      }
    }

    return sources
  }

  private renderSquareHighlightInteractionEventSource = () => {
    const squareSize = this.getSquareSize()
    const sources = []

    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const props = {
          key: `${i}${j}`,
          style: {
            position: 'absolute',
            left: this.getTopLeftCoordinates(i, j)[0],
            top: this.getTopLeftCoordinates(i, j)[1],
            width: squareSize,
            height: squareSize
          }
        } as any
        sources.push(
          <div {...props} onClick={this.handleSquareHighlightClick} />
        )
      }
    }

    return sources
  }

  private renderMoveInteractionEventSource = () => {
    const squareSize = this.getSquareSize()
    const sources = []

    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const props = {
          key: `${i}${j}`,
          style: {
            position: 'absolute',
            left: this.getTopLeftCoordinates(i, j)[0],
            top: this.getTopLeftCoordinates(i, j)[1],
            width: squareSize,
            height: squareSize
          },
          draggable: true
        } as any
        sources.push(
          <div
            {...props}
            onDragStart={this.handleMoveDragStart}
            onDragEnd={this.handleMoveDragEnd}
            onDragOver={this.handleMoveDragOver}
            onDragLeave={this.handleMoveDragLeave}
            onClick={this.handleMoveClick}
          />
        )
      }
    }

    return sources
  }

  private renderPromotionPrompt = (file: number, side: ChessTypes.Side) => {
    const squareSize = this.getSquareSize()
    const style = {
      position: 'absolute',
      width: squareSize,
      height: squareSize
    } as any
    const toRank = side === 'w' ? 7 : 0

    return (
      <div>
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            top: 0,
            backgroundColor: '#fff',
            opacity: 0.7
          }}
          onClick={this.handlePromotionPromptCancel}
        />
        <img
          key={'q'}
          src={side === 'w' ? wq : bq}
          style={{
            ...style,
            left: this.getTopLeftCoordinates(side === 'w' ? 7 : 0, file)[0],
            top: this.getTopLeftCoordinates(side === 'w' ? 7 : 0, file)[1]
          }}
          onClick={this.handlePromotion(file, toRank, 'Q')}
        />
        <img
          key={'r'}
          src={side === 'w' ? wr : br}
          style={{
            ...style,
            left: this.getTopLeftCoordinates(side === 'w' ? 6 : 1, file)[0],
            top: this.getTopLeftCoordinates(side === 'w' ? 6 : 1, file)[1]
          }}
          onClick={this.handlePromotion(file, toRank, 'R')}
        />
        <img
          key={'b'}
          src={side === 'w' ? wb : bb}
          style={{
            ...style,
            left: this.getTopLeftCoordinates(side === 'w' ? 5 : 2, file)[0],
            top: this.getTopLeftCoordinates(side === 'w' ? 5 : 2, file)[1]
          }}
          onClick={this.handlePromotion(file, toRank, 'B')}
        />
        <img
          key={'n'}
          src={side === 'w' ? wn : bn}
          style={{
            ...style,
            left: this.getTopLeftCoordinates(side === 'w' ? 4 : 3, file)[0],
            top: this.getTopLeftCoordinates(side === 'w' ? 4 : 3, file)[1]
          }}
          onClick={this.handlePromotion(file, toRank, 'N')}
        />
      </div>
    )
  }

  private getSquareFill = (rank: number, file: number): string => {
    if (rank % 2 === 0 && file % 2 === 0) {
      return this.props.darkSquareColor!
    }

    if (rank % 2 === 0 && file % 2 !== 0) {
      return this.props.lightSquareColor!
    }

    if (rank % 2 !== 0 && file % 2 === 0) {
      return this.props.lightSquareColor!
    }

    if (rank % 2 !== 0 && file % 2 !== 0) {
      return this.props.darkSquareColor!
    }

    return ''
  }

  private getTopLeftCoordinates = (
    rank: number,
    file: number,
    svg = true
  ): [number, number] => {
    const squareSize = this.getSquareSize()

    if (svg) {
      if (this.props.orientation === 'w') {
        return [file * squareSize, (7 - rank) * squareSize]
      }

      return [(7 - file) * squareSize, rank * squareSize]
    }

    if (this.props.orientation === 'w') {
      return [file * squareSize, rank * squareSize]
    }

    return [(7 - file) * squareSize, (7 - rank) * squareSize]
  }

  private getOffsetOnBoard = (
    clientX: number,
    clientY: number
  ): [number, number] => {
    const boardRect = (this.interactionLayerRef
      .current as HTMLDivElement).getBoundingClientRect()
    const xOffset = clientX - boardRect.left
    const yOffset = clientY - boardRect.top
    return [xOffset, yOffset]
  }

  private getRankFile = (
    boardOffsetX: number,
    boardOffsetY: number
  ): [number, number] => {
    const squareSize = Math.min(this.props.width, this.props.height) / 8
    const rank = Math.floor(boardOffsetY / squareSize)
    const file = Math.floor(boardOffsetX / squareSize)

    if (rank >= 0 && rank <= 7 && file >= 0 && file <= 7) {
      return this.props.orientation === 'w'
        ? [7 - rank, file]
        : [rank, 7 - file]
    }

    return [-1, -1]
  }

  private handleArrowDragEnd = (e: DragEvent) => {
    const offset = this.getOffsetOnBoard(e.clientX, e.clientY)
    const [rank, file] = this.getRankFile(offset[0], offset[1])

    const from = this.getSquareLabel(this.state.fromFile, this.state.fromRank)
    const to = this.getSquareLabel(file, rank)
    const color = this.getColorForMouseEvent(e)

    this.setState({ fromRank: -1, fromFile: -1 }, () => {
      if (this.props.onArrowChange) {
        if (file >= 0 && file <= 7 && rank >= 0 && rank <= 7) {
          const existingAnnotation = this.props.arrows!.filter(
            a => a.from === from && a.to === to && a.color === color
          )

          const newAnnotations =
            existingAnnotation.length > 0
              ? this.props.arrows!.filter(
                  a => !(a.from === from && a.to === to)
                )
              : [
                  ...this.props.arrows!.filter(
                    a => !(a.from === from && a.to === to)
                  ),
                  { type: 'ARROW', color, from, to }
                ]

          this.props.onArrowChange(newAnnotations)
        }
      }
    })
  }

  private handleArrowDragStart = (e: DragEvent) => {
    const offset = this.getOffsetOnBoard(e.clientX, e.clientY)
    const [rank, file] = this.getRankFile(offset[0], offset[1])

    const dragPreview = document.createElement('img')
    dragPreview.src = arrow
    e.dataTransfer!.setDragImage(dragPreview, 0, 0)
    e.dataTransfer!.effectAllowed = 'all'
    this.setState({ fromRank: rank, fromFile: file })
  }

  playSound = () => {
    var audio = new Audio('https://lichess1.org/assets/sound/standard/Move.ogg')
    audio.play()
  }

  private handleMoveDragEnd = (e: DragEvent) => {
    const offset = this.getOffsetOnBoard(e.clientX, e.clientY)
    const [rank, file] = this.getRankFile(offset[0], offset[1])

    const from = this.getSquareLabel(this.state.fromFile, this.state.fromRank)
    const to = this.getSquareLabel(file, rank)

    if (this.props.onMove && !this.props.allowIllegal) {
      try {
        const g = new Chess(this.props.fen)
        const side = g.turn()
        const move = g.move({ from, to })

        if (move) {
          this.props.onMove(move)
        } else if (g.move({ from, to, promotion: 'q' })) {
          // Look for promotion
          this.setState({ promotionPrompt: { file, side } })
          return
        }
      } catch (e) {
        return
      }
    }

    if (this.props.onMove && this.props.allowIllegal && from !== to) {
      const piece = Util.getFenSquareOccupation(this.props.fen, from)
      if (piece) {
        this.props.onMove({
          type: piece.type,
          color: piece.color,
          from,
          to
        } as any)
      }
    }

    this.setState({ fromRank: -1, fromFile: -1 })
  }

  private handleMoveDragStart = (e: DragEvent) => {
    const offset = this.getOffsetOnBoard(e.clientX, e.clientY)
    const [rank, file] = this.getRankFile(offset[0], offset[1])
    const squareLabel = this.getSquareLabel(file, rank)

    // TODO: Find a solution for preview image
    const piece = Util.getFenSquareOccupation(this.props.fen, squareLabel)
    if (piece) {
      const dragPreview = document.createElement('img')
      dragPreview.src = this.getImageSourceForFenChar(
        piece.color === 'w'
          ? piece.type.toUpperCase()
          : piece.type.toLowerCase()
      )
      e.dataTransfer!.setDragImage(dragPreview, 0, 0)
      this.setState({ fromRank: rank, fromFile: file })
    } else {
      e.preventDefault()
    }
  }

  private handleMoveDragOver = (e: MouseEvent) => {
    ;(e.currentTarget as HTMLDivElement).style.backgroundColor = HIGHLIGHT_COLOR
    ;(e.currentTarget as HTMLDivElement).style.opacity = '0.35'
  }

  private handleMoveDragLeave = (e: MouseEvent) => {
    ;(e.currentTarget as HTMLDivElement).style.backgroundColor = ''
    delete (e.currentTarget as HTMLDivElement).style['opacity']
  }

  private handleMoveClick = (e: MouseEvent) => {
    const offset = this.getOffsetOnBoard(e.clientX, e.clientY)
    const [rank, file] = this.getRankFile(offset[0], offset[1])

    if (this.state.fromRank !== -1 && this.state.fromFile !== -1) {
      const from = this.getSquareLabel(this.state.fromFile, this.state.fromRank)
      const to = this.getSquareLabel(file, rank)

      if (this.props.onMove && !this.props.allowIllegal) {
        try {
          const g = new Chess(this.props.fen)
          const side = g.turn()
          const move = g.move({ from, to })

          if (move) {
            this.props.onMove(move)
          } else if (g.move({ from, to, promotion: 'q' })) {
            // Look for promotion
            this.setState({ promotionPrompt: { file, side } })
            return
          }
        } catch (e) {
          return
        }
      }

      if (this.props.onMove && this.props.allowIllegal && from !== to) {
        const piece = Util.getFenSquareOccupation(this.props.fen, from)
        if (piece) {
          this.props.onMove({
            type: piece.type,
            color: piece.color,
            from,
            to
          } as any)
        }
      }

      this.setState({ fromRank: -1, fromFile: -1 })
    } else {
      const squareLabel = this.getSquareLabel(file, rank)
      const piece = Util.getFenSquareOccupation(this.props.fen, squareLabel)

      if (piece) {
        this.setState({ fromRank: rank, fromFile: file })
      }
    }
  }

  private handlePromotionPromptCancel = () => {
    this.setState({ fromRank: -1, fromFile: -1, promotionPrompt: undefined })
  }

  private handlePromotion = (
    file: number,
    rank: number,
    piece: ChessTypes.PromotionPiece
  ) => {
    return () => {
      if (this.state.fromRank !== -1 && this.state.fromFile !== -1) {
        const from = this.getSquareLabel(
          this.state.fromFile,
          this.state.fromRank
        )
        const to = this.getSquareLabel(file, rank)

        if (this.props.onMove) {
          const g = new Chess(this.props.fen)
          const move = g.move({
            from,
            to,
            promotion: piece.toLowerCase() as ChessTypes.ChessJSPromotionPiece
          })
          if (move) {
            this.props.onMove(move)
          }
        }
      }

      this.setState({ fromRank: -1, fromFile: -1, promotionPrompt: undefined })
    }
  }

  private handleSquareHighlightClick = (e: MouseEvent) => {
    if (this.props.onSquareHighlightChange) {
      const offset = this.getOffsetOnBoard(e.clientX, e.clientY)
      const [rank, file] = this.getRankFile(offset[0], offset[1])
      const squareLabel = this.getSquareLabel(file, rank)

      const color = this.getColorForMouseEvent(e)
      const existingAnnotation = this.props.squareHighlights!.filter(
        s => s.square === squareLabel && s.color === color
      )

      this.props.onSquareHighlightChange(
        existingAnnotation.length > 0
          ? this.props.squareHighlights!.filter(s => s.square !== squareLabel)
          : [
              ...this.props.squareHighlights!.filter(
                s => s.square !== squareLabel
              ),
              { type: 'SQUARE_HIGHLIGHT', color, square: squareLabel }
            ]
      )
    }
  }

  private getFileChar = (file: number): string => {
    return String.fromCharCode('a'.charCodeAt(0) + file)
  }

  private getRankChar = (rank: number): string => {
    return String.fromCharCode('1'.charCodeAt(0) + rank)
  }

  private getSquareLabel = (
    file: number,
    rank: number
  ): ChessTypes.SquareLabel => {
    return `${this.getFileChar(file)}${this.getRankChar(
      rank
    )}` as ChessTypes.SquareLabel
  }

  private getFileRank = (
    squareLabel: ChessTypes.SquareLabel
  ): [number, number] => {
    return [
      squareLabel.charCodeAt(0) - 'a'.charCodeAt(0),
      squareLabel.charCodeAt(1) - '1'.charCodeAt(0)
    ]
  }

  private getSize = () => {
    return Math.min(this.props.width, this.props.height)
  }

  private getSquareSize = () => {
    return this.getSize() / 8
  }

  private getColorForMouseEvent = (e: MouseEvent) => {
    if (e.altKey) return 'green'
    if (e.metaKey || e.ctrlKey) return 'yellow'
    if (e.shiftKey) return 'red'
    return 'green'
  }
}
