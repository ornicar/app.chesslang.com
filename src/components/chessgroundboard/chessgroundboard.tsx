import React from 'react'
import Chessground from './chessground'
import { Chess, ShortMove } from 'chess.js'

import wQ from './assets/images/pieces/merida/wQ.svg'
import wR from './assets/images/pieces/merida/wR.svg'
import wB from './assets/images/pieces/merida/wB.svg'
import wN from './assets/images/pieces/merida/wN.svg'
import bQ from './assets/images/pieces/merida/bQ.svg'
import bR from './assets/images/pieces/merida/bR.svg'
import bB from './assets/images/pieces/merida/bB.svg'
import bN from './assets/images/pieces/merida/bN.svg'
import blankPiece from './assets/images/pieces/merida/1.svg'

import './assets/theme.css'
import './assets/chessground.css'
import ReactResizeDetector from 'react-resize-detector'
import PropTypes from 'prop-types'

const PIECE_IMAGES = {
  wq: wQ,
  wr: wR,
  wb: wB,
  wn: wN,
  bq: bQ,
  br: bR,
  bb: bB,
  bn: bN,
  w1: blankPiece,
  b1: blankPiece
}

interface Props {
  height: number
  width: number
  onMove: (...args: any) => {}
  fen: string
  orientation: string
  turnColor: string
}

interface State {
  size: number
  width: number
  promotionPopupDetails: null | {
    file: 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h'
    color: 'w' | 'b'
    pendingMove: ShortMove
  }
}

class ChessgroundBoard extends React.Component<Props> {
  boardContainer = React.createRef<HTMLDivElement>()
  ground = null

  state = {
    size: 0,
    width: 400,
    promotionPopupDetails: null
  }

  static propTypes = {
    width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    fen: PropTypes.string,
    orientation: PropTypes.string,
    turnColor: PropTypes.string,
    // check: PropTypes.string,
    lastMove: PropTypes.array,
    // selected: PropTypes.string,
    // coordinates: PropTypes.bool,
    // autoCastle: PropTypes.bool,
    // viewOnly: PropTypes.bool,
    // disableContextMenu: PropTypes.bool,
    // resizable: PropTypes.bool,
    // addPieceZIndex: PropTypes.bool,
    // hightlight: PropTypes.object,
    // animation: PropTypes.object,
    movable: PropTypes.object,
    // premovable: PropTypes.object,
    // predroppable: PropTypes.object,
    // draggable: PropTypes.object,
    // selectable: PropTypes.object,
    // onChange: PropTypes.func,
    onMove: PropTypes.func
    // onDropNewPiece: PropTypes.func,
    // onSelect: PropTypes.func,
    // items: PropTypes.object,
    // drawable: PropTypes.object
  }

  componentDidMount() {
    this.ground = Chessground(
      this.boardContainer.current,
      this.buildConfigFromProps(this.props)
    )
  }

  playSound = () => {
    var audio = new Audio('https://lichess1.org/assets/sound/standard/Move.ogg')
    audio.play()
  }

  buildConfigFromProps(props) {
    const config: any = { events: {} }

    Object.keys(ChessgroundBoard.propTypes).forEach(k => {
      const v = props[k]
      if (v) {
        const match = k.match(/^on([A-Z]\S*)/)
        if (k === 'onMove') {
          config.events['move'] = this.handleOnMove
        } else if (match) {
          config.events[match[1].toLowerCase()] = v
        } else {
          config[k] = v
        }
      }
    })

    return config
  }

  componentDidUpdate(prevProps) {
    // Typical usage (don't forget to compare props):
    if (
      this.props.height !== prevProps.height ||
      this.props.width !== prevProps.width ||
      this.props.orientation !== prevProps.orientation
    ) {
      this.ground!.redrawAll()
    }

    if (this.props.fen !== prevProps.fen) {
      this.playSound()
    }
  }

  componentWillReceiveProps(nextProps) {
    this.ground.set(this.buildConfigFromProps(nextProps))
  }

  componentWillUnmount() {
    this.ground.destroy()
  }

  handleOnMove = (from: string, to: string) => {
    const promotion = this.getPromotionDetails(this.props.fen, from, to)
    if (promotion) {
      this.setState({
        promotionPopupDetails: { ...promotion, pendingMove: { from, to } }
      })
    } else {
      this.props.onMove(from, to)
    }
  }

  handlePromotePiece = (promotionPiece: 'q' | 'r' | 'n' | 'b') => {
    if (this.state.promotionPopupDetails) {
      const pendingMove = this.state.promotionPopupDetails!.pendingMove
      this.props.onMove(pendingMove.from, pendingMove.to, {
        promotion: promotionPiece
      })
      this.setState({ promotionPopupDetails: null })
    }
  }

  cancelPromotePiece = () => {
    this.setState({ promotionPopupDetails: null }, () => {
      this.ground.set(this.buildConfigFromProps(this.props))
    })
  }

  // returns null or { color: 'w', file: 'e' }
  getPromotionDetails = (fen: string, from: string, to: string) => {
    const pos = new Chess(this.props.fen)
    const turn = pos.turn()

    const move = pos.move({ from, to, promotion: 'q' } as ShortMove)

    if (move && move.promotion) {
      return { color: turn, file: to.charAt(0) }
    }

    return null
  }

  onResize = (width, height) => {
    console.log(width, height)
    this.setState(
      {
        size: Math.min(width, height),
        width: width
      },
      () => {
        this.ground!.redrawAll()
      }
    )
  }

  render() {
    const defaultSize = 400
    const padding = 12

    return (
      <div
        className="brown merida"
        style={{
          height: this.state.width + 2 * padding,
          maxHeight: '95vh',
          padding: padding
        }}
      >
        <div
          ref={this.boardContainer}
          className="cg-board-wrap"
          style={{
            height: this.state.size || defaultSize,
            width: this.state.size || defaultSize
          }}
        />
        {this.renderPromotionPopup()}
        <ReactResizeDetector
          handleWidth
          handleHeight
          onResize={this.onResize}
        />
      </div>
    )
  }

  renderPromotionPopup = () => {
    const POPUP_STYLE = {
      position: 'absolute',
      left: 0,
      right: 0,
      top: '30%',
      background: 'rgba(100, 100, 100, 0.35)',
      zIndex: 2,
      textAlign: 'center'
    }

    const OUTER_STYLE = {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0
    }

    if (!this.state.promotionPopupDetails) return null

    return (
      <div style={OUTER_STYLE} onClick={() => this.cancelPromotePiece()}>
        {['w', 'b'].map(
          color =>
            this.state.promotionPopupDetails!.color === color && (
              <div key={color} className="promotion-popup" style={POPUP_STYLE}>
                {['q', 'r', 'b', 'n', '1'].map(piece => (
                  <div
                    key={piece}
                    style={{
                      padding: 10,
                      display: 'inline-block',
                      cursor: 'pointer'
                    }}
                    onClick={() => this.handlePromotePiece(piece)}
                  >
                    <img
                      src={PIECE_IMAGES[`${color}${piece}`]}
                      width={this.state.size / 6}
                      height={this.state.size / 6}
                    />
                  </div>
                ))}
              </div>
            )
        )}
      </div>
    )
  }
}

export default ChessgroundBoard
