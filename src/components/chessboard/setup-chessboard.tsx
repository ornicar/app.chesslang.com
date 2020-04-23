import * as React from 'react'
import { Input, Checkbox, Button, Select, message } from 'antd'
import { ChessTypes, Chess } from '@chesslang/chess'

import clearPieceSvg from './pieces/1.svg'
import bb from './pieces/bb.svg'
import bk from './pieces/bk.svg'
import bn from './pieces/bn.svg'
import bp from './pieces/bp.svg'
import bq from './pieces/bq.svg'
import br from './pieces/br.svg'
import wb from './pieces/wb.svg'
import wk from './pieces/wk.svg'
import wn from './pieces/wn.svg'
import wp from './pieces/wp.svg'
import wq from './pieces/wq.svg'
import wr from './pieces/wr.svg'

import { ConfiguredChessboard } from './configured-chessboard'

interface Props {
  width: number
  height: number
  lightSquareColor?: string
  darkSquareColor?: string
  initialFen?: ChessTypes.FEN
  onChange?: (fen: ChessTypes.FEN) => any
}

interface State {
  fen: ChessTypes.FEN
  selectedPieceFenChar: string | null
}

export class SetupChessboard extends React.Component<Props, State> {
  static defaultProps = {
    lightSquareColor: '#f0d9b5',
    darkSquareColor: '#b58863',
    initialFen: '8/8/8/8/8/8/8/8 w KQkq - 0 1'
  }

  state = {
    fen: this.props.initialFen!,
    selectedPieceFenChar: null
  }

  private interactionLayerRef: React.RefObject<
    HTMLDivElement
  > = React.createRef()
  private backingGame = new Chess(this.state.fen)

  render() {
    const size = this.getSize()
    const innerSize = this.getInnerChessboardSize()

    return (
      <div className="SetupChessboardContainer">
        <div className="left">
          <div className="left-inner">
            <div className="LeftPieces" style={{ width: this.getSquareSize() }}>
              {this.renderLeftPieces()}
            </div>
            <div
              className="InnerChessboardContainer"
              style={{
                position: 'relative',
                width: innerSize,
                height: innerSize
              }}
            >
              <ConfiguredChessboard
                width={innerSize}
                height={innerSize}
                fen={this.state.fen}
                interactionMode="NONE"
                coordinates={false}
              />
              <div
                className="DragCapture Layer"
                ref={this.interactionLayerRef}
              />
              <div className="SquareClick Layer">
                <svg width={innerSize} height={innerSize}>
                  {this.renderSquareClicks()}
                </svg>
              </div>
            </div>
            <div
              className="RightPieces"
              style={{ width: this.getSquareSize() }}
            >
              {this.renderRightPieces()}
            </div>
          </div>
          <div className="bottom-container" style={{ marginTop: -10 }}>
            <span className="label">FEN</span>
            <Input
              style={{ width: 500, margin: '0 auto', display: 'block' }}
              defaultValue={this.state.fen}
              onPressEnter={this.handleFenTextChange}
              // onFocus={this.handleFenInputFocus}
            />
            <p>Type or paste FEN and press 'Enter' </p>
          </div>
          <div className="bottom-container" style={{ marginTop: -10 }}>
            <span className="label">PGN moves</span>
            <Input
              style={{ width: 500, margin: '0 auto', display: 'block' }}
              onChange={this.handlePGNTextChange}
              onFocus={this.handleFenInputFocus}
            />
            <p className="muted-text">e.g. 1.e4 e5 2.Nf3 Nc6 </p>
          </div>
        </div>
        <div className="right">
          <div className="settings-container">
            <div className="castling">
              <div className="white">
                <span className="label">White:</span>
                <Checkbox
                  checked={this.hasCastlingRight(this.state.fen, 'K')}
                  onChange={this.toggleCastlingRight('K')}
                >
                  O-O
                </Checkbox>
                <Checkbox
                  checked={this.hasCastlingRight(this.state.fen, 'Q')}
                  onChange={this.toggleCastlingRight('Q')}
                >
                  O-O-O
                </Checkbox>
              </div>
              <div className="black">
                <span className="label">Black:</span>
                <Checkbox
                  checked={this.hasCastlingRight(this.state.fen, 'k')}
                  onChange={this.toggleCastlingRight('k')}
                >
                  O-O
                </Checkbox>
                <Checkbox
                  checked={this.hasCastlingRight(this.state.fen, 'q')}
                  onChange={this.toggleCastlingRight('q')}
                >
                  O-O-O
                </Checkbox>
              </div>
            </div>
            <div className="buttons">
              <span className="label">Presets:</span>
              <Button size="small" onClick={this.handleClearButton}>
                Clear
              </Button>
              <Button size="small" onClick={this.handleResetButton}>
                Reset
              </Button>
              <Button size="small" onClick={this.handleStartButton}>
                Initial
              </Button>
            </div>
            <div className="side-to-play">
              <span className="label">To Play:</span>&nbsp;
              <Select
                size="small"
                value={this.getSideToMove()}
                onChange={this.toggleSideToMove}
              >
                <Select.Option value="w">White</Select.Option>
                <Select.Option value="b">Black</Select.Option>
              </Select>
            </div>
          </div>
        </div>
      </div>
    )
  }

  private renderSquareClicks = () => {
    const squareSize = this.getSquareSize()

    const rects = []
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const squareLabel = this.getSquareLabel(file, rank)
        rects.push(
          <rect
            key={squareLabel}
            width={squareSize}
            height={squareSize}
            fill="transparent"
            x={this.getTopLeftCoordinates(rank, file)[0]}
            y={this.getTopLeftCoordinates(rank, file)[1]}
            onClick={this.handlePlacePiece(squareLabel, false)}
            onContextMenu={this.handlePlacePiece(squareLabel, true)}
          />
        )
      }
    }
    return rects
  }

  private renderDraggablePiece = (
    fenChar: string,
    left: number,
    top: number
  ) => {
    const squareSize = this.getSquareSize()
    const src = this.getImageSourceForFenChar(fenChar)
    const selected = this.state.selectedPieceFenChar === fenChar

    if (src) {
      return (
        <img
          key={`setup-piece-${fenChar}`}
          style={{ background: selected ? 'rgba(0, 255, 0, 0.5)' : '' }}
          width={squareSize}
          height={squareSize}
          src={src}
          onDragStart={this.handlePieceDragStart(fenChar)}
          onDragEnd={this.handlePieceDragEnd(fenChar)}
          onClick={this.togglePieceSelect(fenChar)}
        />
      )
    }
  }

  private renderDraggableClearPiece = (left: number, top: number) => {
    const squareSize = this.getSquareSize()
    const selected = this.state.selectedPieceFenChar === '1'

    return (
      <img
        key={`setup-piece-1`}
        style={{ background: selected ? 'rgba(0, 150, 0, 0.5)' : '' }}
        width={squareSize}
        height={squareSize}
        src={clearPieceSvg}
        onDragStart={this.handlePieceDragStart('1')}
        onDragEnd={this.handlePieceDragEnd('1')}
        onClick={this.togglePieceSelect('1')}
      />
    )
  }

  private handleFenTextChange = (e: any) => {
    const chess = new Chess()
    const isValid = chess.validate_fen(e.target.value)
    if (isValid.valid == true) {
      if (
        this.state.fen.indexOf(e.target.value) >= 0 ||
        e.target.value.indexOf(this.state.fen) >= 0
      ) {
        // If substring, dont do anything
      } else {
        this.setStateFen(e.target.value)
      }
    } else {
      message.error('Invalid Fen')
    }
  }

  private handlePGNTextChange = (e: any) => {
    const pgn = e.target.value
    const pgnBoard = new Chess()
    pgnBoard.load_pgn(pgn)
    const inputFen = pgnBoard.fen()

    if (
      this.state.fen.indexOf(inputFen) >= 0 ||
      inputFen.indexOf(this.state.fen) >= 0
    ) {
      // If substring, dont do anything
    } else {
      this.setStateFen(inputFen)
    }
  }

  private handleFenInputFocus = (e: any) => {
    e.target.select()
  }

  private togglePieceSelect = (fenChar: string) => () => {
    this.setState({
      selectedPieceFenChar:
        fenChar === this.state.selectedPieceFenChar ? null : fenChar
    })
  }

  private renderLeftPieces = () => {
    const squareSize = this.getSquareSize()

    return ['K', 'Q', 'R', 'N', 'B', 'P']
      .map((fenChar, i) => {
        const top = i * squareSize + squareSize * 2
        return this.renderDraggablePiece(fenChar, 0, top)
      })
      .concat([this.renderDraggableClearPiece(0, squareSize)])
  }

  private renderRightPieces = () => {
    const squareSize = this.getSquareSize()
    const left = squareSize * 10 - squareSize

    return ['k', 'q', 'r', 'n', 'b', 'p']
      .map((fenChar, i) => {
        const top = i * squareSize + squareSize * 2
        return this.renderDraggablePiece(fenChar, left, top)
      })
      .concat([this.renderDraggableClearPiece(left, squareSize)])
  }

  private handlePieceDragStart = (fenChar: string) => (e: DragEvent) => {
    const dragPreview = document.createElement('img')
    dragPreview.src = this.getImageSourceForFenChar(fenChar)
    e.dataTransfer.setDragImage(dragPreview, 0, 0)

    if (this.state.selectedPieceFenChar !== fenChar) {
      this.togglePieceSelect(fenChar)()
    }
  }

  private handlePieceDragEnd = (fenChar: string) => (e: DragEvent) => {
    const offset = this.getOffsetOnBoard(e.clientX, e.clientY)
    const [rank, file] = this.getRankFile(offset[0], offset[1])

    if (rank >= 0 && rank <= 7 && file >= 0 && file <= 7) {
      const squareLabel = this.getSquareLabel(file, rank)

      if (fenChar !== '1') {
        const color = fenChar === fenChar.toUpperCase() ? 'w' : 'b'

        this.backingGame.put(
          {
            color,
            type: fenChar.toLowerCase() as ChessTypes.ChessJSPiece
          },
          squareLabel
        )
      } else {
        this.backingGame.remove(squareLabel)
      }

      this.setStateFen(this.backingGame.fen())
    }
  }

  private handlePlacePiece = (
    squareLabel: ChessTypes.SquareLabel,
    invert: boolean
  ) => (e: any) => {
    e.preventDefault()

    const fenChar = (this.state.selectedPieceFenChar || '') as string

    if (fenChar) {
      if (fenChar !== '1') {
        const color = (() => {
          const c = fenChar === fenChar.toUpperCase() ? 'w' : 'b'
          if (invert && c === 'w') return 'b'
          if (invert && c === 'b') return 'w'
          return c
        })()
        const currentPiece = this.backingGame.get(squareLabel)

        if (
          currentPiece &&
          currentPiece.color === color &&
          currentPiece.type === fenChar.toLowerCase()
        ) {
          this.backingGame.remove(squareLabel)
        } else {
          this.backingGame.put(
            {
              color,
              type: fenChar.toLowerCase() as ChessTypes.ChessJSPiece
            },
            squareLabel
          )
        }
      } else {
        this.backingGame.remove(squareLabel)
      }

      this.setStateFen(this.backingGame.fen())
    }
  }

  private toggleSideToMove = (value: string) => {
    const fenParts = this.state.fen.split(' ')
    fenParts.splice(1, 1, value)
    const newFen = fenParts.join(' ')

    this.setStateFen(newFen)
  }

  private toggleCastlingRight = (right: string) => () => {
    const fen = this.state.fen

    const newRights = (() => {
      const castlingRights = fen.split(' ')[2]
      if (this.hasCastlingRight(fen, right)) {
        return castlingRights.replace(right, '')
      } else {
        return castlingRights + right
      }
    })()

    const formattedRights = (() => {
      let rights = ''
      if (!newRights || newRights === '-') return '-'
      if (newRights.indexOf('K') >= 0) rights += 'K'
      if (newRights.indexOf('Q') >= 0) rights += 'Q'
      if (newRights.indexOf('k') >= 0) rights += 'k'
      if (newRights.indexOf('q') >= 0) rights += 'q'

      return rights
    })()

    const fenParts = fen.split(' ')
    fenParts.splice(2, 1, formattedRights)
    const newFen = fenParts.join(' ')

    this.setStateFen(newFen)
  }

  private handleClearButton = () => {
    this.backingGame.load('8/8/8/8/8/8/8/8 w KQkq - 0 1')
    this.setStateFen(this.backingGame.fen())
  }

  private handleResetButton = () => {
    this.backingGame.load(this.props.initialFen!)
    this.setStateFen(this.backingGame.fen())
  }

  private handleStartButton = () => {
    this.backingGame.load(
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    )
    this.setStateFen(this.backingGame.fen())
  }

  private getSize = () => {
    const size = Math.min(this.props.width, this.props.height)
    return size
  }

  private getInnerChessboardSize = () => {
    return this.getSquareSize() * 8
  }

  private getSquareSize = () => {
    return this.getSize() / 10
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

  private getOffsetOnBoard = (
    clientX: number,
    clientY: number
  ): [number, number] => {
    const boardRect = (this.interactionLayerRef
      .current as HTMLDivElement).getBoundingClientRect()
    const xOffset = clientX - boardRect.left
    const yOffset = clientY - boardRect.top + this.getSquareSize() * 0.5 // FIXME: Not sure why this hack works!
    return [xOffset, yOffset]
  }

  private getRankFile = (
    boardOffsetX: number,
    boardOffsetY: number
  ): [number, number] => {
    const squareSize = this.getSquareSize()
    const innerSize = this.getInnerChessboardSize()

    // Check if offsetX and offsetY are in the bounding box (inner chessboard)
    if (
      boardOffsetX >= 0 &&
      boardOffsetX <= innerSize &&
      boardOffsetY >= 0 &&
      boardOffsetY <= innerSize
    ) {
      const rank = Math.floor(boardOffsetY / squareSize)
      const file = Math.floor(boardOffsetX / squareSize)

      return [7 - rank, file]
    }

    return [-1, -1]
  }

  private getTopLeftCoordinates = (
    rank: number,
    file: number,
    svg = true
  ): [number, number] => {
    const squareSize = this.getSquareSize()

    if (svg) {
      return [file * squareSize, (7 - rank) * squareSize]
    }

    return [file * squareSize, rank * squareSize]
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

  private hasCastlingRight = (fen: ChessTypes.FEN, right: string) => {
    if (this.isValidFen()) {
      const castlingRights = fen.split(' ')[2]
      return castlingRights.indexOf(right) >= 0
    }

    return true
  }

  private getSideToMove = () => {
    if (this.isValidFen()) {
      return this.state.fen.split(' ')[1]
    }

    return 'w'
  }

  private isValidFen = () => {
    const g = new Chess()
    return g.validate_fen(this.state.fen).valid
  }

  // TODO: Chess960 support
  private cleanFenWithCastlingRights = (fen: ChessTypes.FEN) => {
    const g = new Chess(fen)
    const e1 = g.get('e1')
    const h1 = g.get('h1')
    const a1 = g.get('a1')
    const e8 = g.get('e8')
    const h8 = g.get('h8')
    const a8 = g.get('a8')

    let cleanCastlingRights = ''

    if (
      this.hasCastlingRight(fen, 'K') &&
      e1 &&
      e1.color === 'w' &&
      e1.type === 'k' &&
      h1 &&
      h1.color === 'w' &&
      h1.type === 'r'
    ) {
      cleanCastlingRights += 'K'
    }

    if (
      this.hasCastlingRight(fen, 'Q') &&
      e1 &&
      e1.color === 'w' &&
      e1.type === 'k' &&
      a1 &&
      a1.color === 'w' &&
      a1.type === 'r'
    ) {
      cleanCastlingRights += 'Q'
    }

    if (
      this.hasCastlingRight(fen, 'k') &&
      e8 &&
      e8.color === 'b' &&
      e8.type === 'k' &&
      h8 &&
      h8.color === 'b' &&
      h8.type === 'r'
    ) {
      cleanCastlingRights += 'k'
    }

    if (
      this.hasCastlingRight(fen, 'q') &&
      e8 &&
      e8.color === 'b' &&
      e8.type === 'k' &&
      a8 &&
      a8.color === 'b' &&
      a8.type === 'r'
    ) {
      cleanCastlingRights += 'q'
    }

    const parts = fen.split(' ')
    return [
      parts[0],
      parts[1],
      cleanCastlingRights ? cleanCastlingRights : '-',
      parts[3],
      parts[4],
      parts[5]
    ].join(' ')
  }

  private setStateFen = (fen: ChessTypes.FEN) => {
    this.setState(
      {
        fen: this.cleanFenWithCastlingRights(fen)
      },
      () => {
        this.backingGame.load(this.state.fen)
        this.props.onChange && this.props.onChange(this.state.fen)
      }
    )
  }
}
