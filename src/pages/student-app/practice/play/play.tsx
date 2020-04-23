import * as React from 'react'
import * as R from 'ramda'
import { Divider, Icon, Button, Breadcrumb, Popconfirm } from 'antd'
import { withRouter, RouteComponentProps, Link } from 'react-router-dom'
import { inject, observer } from 'mobx-react'
import {
  SIDE_TO_PLAY_WIN,
  SIDE_TO_PLAY_DRAW,
  PracticeStore
} from '../../../../stores/practice'
import { States } from '../../../../components/states/states'
import { ChessTypes, Util, Chess } from '@chesslang/chess'
import { ConfiguredChessboard } from '../../../../components/chessboard/configured-chessboard'
import Measure from 'react-measure'

import './play.less'
import { EngineStore } from '../../../../stores/engine'
import Drill from '../../../../types/Drill'

const OFFSET_HEIGHT = 75
type GoalState = 'PROGRESS' | 'FAILED' | 'ACHIEVED'

interface Props extends RouteComponentProps<any> {
  practiceStore?: PracticeStore
  engineStore?: EngineStore
}

interface State {
  startFen: ChessTypes.FEN
  fen: ChessTypes.FEN
  boardOrientation: ChessTypes.Side
  boardSize: number
  mainline: ChessTypes.Variation
  squareHighlights: ChessTypes.SquareHighlightAnnotation[]
  thinking: boolean
  goal: GoalState
  error: string
}

@inject('practiceStore', 'engineStore')
@observer
class WrappedPlay extends React.Component<Props, State> {
  state = {
    startFen: '',
    fen: '',
    boardOrientation: 'w' as ChessTypes.Side,
    boardSize: 0,
    mainline: [],
    squareHighlights: [], // For highlighting last move
    thinking: false,
    goal: 'PROGRESS' as GoalState,
    error: ''
  }

  async componentDidMount() {
    try {
      await this.props.practiceStore!.load()
      const item = this.getpracticeItem()
      const fen = item.fen
      this.setState({
        startFen: fen,
        fen,
        boardOrientation: Util.getSideToMoveFromFen(fen)
      })
    } catch (e) {}
  }

  getpracticeItem = () => {
    return R.find(
      (i: any) => i.uuid === this.props.match.params.uuid,
      this.props.practiceStore!.items
    ) as Drill
  }

  handleBackTopractice = () => {
    this.props.history.push(this.props.match.url.replace(/\/play(.)+$/gi, ''))
  }

  handleTryAgain = () => {
    this.setState({
      startFen: this.state.startFen,
      fen: this.state.startFen,
      thinking: false,
      goal: 'PROGRESS'
    })
  }

  handleMove = async (m: ChessTypes.ChessJSVerboseInputMove) => {
    const g = new Chess(this.state.fen)
    if (g.move(m)) {
      const practiceItem = this.getpracticeItem()
      const sideToMove = Util.getSideToMoveFromFen(this.state.fen)
      const startSideToMove = Util.getSideToMoveFromFen(this.state.startFen)

      this.setState(
        {
          fen: g.fen(),
          thinking: true
        },
        async () => {
          if (g.game_over()) {
            // TODO: Side to play checkmates
            if (
              practiceItem.goal === SIDE_TO_PLAY_WIN &&
              sideToMove === startSideToMove &&
              g.in_checkmate()
            ) {
              this.setState({ goal: 'ACHIEVED', fen: g.fen(), thinking: false })
            } else if (practiceItem.goal === SIDE_TO_PLAY_DRAW && g.in_draw()) {
              this.setState({ goal: 'ACHIEVED', fen: g.fen(), thinking: false })
            } else {
              this.setState({ goal: 'FAILED', fen: g.fen(), thinking: false })
            }
          } else {
            try {
              const engineEval = await this.props.engineStore!.go({
                fen: g.fen(),
                depth: 10
              })
              const nextMove = engineEval.result!.mainline[0]
              const newMove = g.move(nextMove)
              const sideToMove = Util.getSideToMoveFromFen(g.fen())
              if (newMove) {
                // Check for goal yet again
                if (g.game_over()) {
                  // TODO: Side to play checkmates
                  if (
                    practiceItem.goal === SIDE_TO_PLAY_WIN &&
                    sideToMove === startSideToMove &&
                    g.in_checkmate()
                  ) {
                    this.setState({ goal: 'ACHIEVED', fen: g.fen() })
                  } else if (
                    practiceItem.goal === SIDE_TO_PLAY_DRAW &&
                    g.in_draw()
                  ) {
                    this.setState({ goal: 'ACHIEVED', fen: g.fen() })
                  } else {
                    this.setState({ goal: 'FAILED', fen: g.fen() })
                  }
                } else {
                  this.setState({ thinking: true }, () => {
                    setTimeout(() => {
                      this.setState({
                        thinking: false,
                        fen: g.fen(),
                        squareHighlights: [
                          {
                            type: 'SQUARE_HIGHLIGHT',
                            square: newMove.from,
                            color: 'yellow'
                          },
                          {
                            type: 'SQUARE_HIGHLIGHT',
                            square: newMove.to,
                            color: 'yellow'
                          }
                        ]
                      })
                    }, 500)
                  })
                }
              }
            } catch (e) {
              this.setState({ error: 'Failed to receive move' })
            }
          }
        }
      )
    }
  }

  render() {
    if (this.props.practiceStore!.loading) {
      return (
        <div className="practice inner play">
          <States type="loading" />
        </div>
      )
    }

    if (this.props.practiceStore!.error) {
      return (
        <div className="practice inner play">
          <States
            type="error"
            exceptionText={this.props.practiceStore!.error}
            icon="fire"
          />
        </div>
      )
    }

    const item = this.getpracticeItem()

    return (
      <div className="practice inner play">
        <div className="action-bar">
          <Breadcrumb>
            <Breadcrumb.Item>
              {this.state.goal !== 'ACHIEVED' ? (
                <Popconfirm
                  placement="bottom"
                  title="Play in progress, are you sure you want to go back?"
                  onConfirm={this.handleBackTopractice}
                >
                  <Link
                    to={this.props.match.url.replace(
                      '/play/' + this.props.match.params.uuid,
                      ''
                    )}
                  >
                    practice
                  </Link>
                </Popconfirm>
              ) : (
                <Link
                  to={this.props.match.url.replace(
                    '/play/' + this.props.match.params.uuid,
                    ''
                  )}
                >
                  practice
                </Link>
              )}
            </Breadcrumb.Item>
            <Breadcrumb.Item>
              <strong>{item.name}</strong>
            </Breadcrumb.Item>
          </Breadcrumb>
        </div>
        <Divider className="below-action-bar" />
        <Measure
          bounds={true}
          onResize={contentRect =>
            this.setState({
              boardSize: contentRect.bounds!.height - OFFSET_HEIGHT
            })
          }
        >
          {({ measureRef }) => (
            <div ref={measureRef} className="game-container">
              <div className="board-container">
                <ConfiguredChessboard
                  fen={this.state.fen}
                  width={this.state.boardSize}
                  height={this.state.boardSize}
                  interactionMode={this.state.thinking ? 'NONE' : 'MOVE'}
                  showSideToMove={true}
                  orientation={this.state.boardOrientation}
                  squareHighlights={this.state.squareHighlights}
                  onMove={this.handleMove}
                />
                {this.state.thinking && (
                  <div className="thinking">
                    <Icon type="hourglass" theme="outlined" />
                    <span className="description">Thinking...</span>
                  </div>
                )}
                {this.state.goal === 'ACHIEVED' && (
                  <div className="goal achieved">
                    <div className="box">
                      <Icon type="check" theme="outlined" />
                      <span className="description">
                        You achieved the goal!
                      </span>
                      <Button
                        onClick={this.handleBackTopractice}
                        type="primary"
                      >
                        Back to practice
                      </Button>
                    </div>
                  </div>
                )}
                {this.state.goal === 'FAILED' && (
                  <div className="goal failed">
                    <div className="box">
                      <Icon type="close-circle" theme="outlined" />
                      <span className="description">
                        You didn't achieve the goal
                      </span>
                      <Button onClick={this.handleTryAgain} type="primary">
                        Try Again
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </Measure>
      </div>
    )
  }
}

export const Play = withRouter(WrappedPlay)
