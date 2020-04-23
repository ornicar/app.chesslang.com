import * as React from 'react'
import {
  Divider,
  Icon,
  Button,
  Breadcrumb,
  Popconfirm,
  Layout,
  Modal,
  Select,
  Drawer,
  Radio,
  Row,
  Col
} from 'antd'
import { inject, observer } from 'mobx-react'
import { ChessTypes, Chess, GameEditor, Util } from '@chesslang/chess'
import { ConfiguredChessboard } from '../../../components/chessboard/configured-chessboard'
import { RouteComponentProps, withRouter } from 'react-router'
import Measure from 'react-measure'

import './blindbot.less'
import { EngineStore } from '../../../stores/engine'
import { SetupChessboard } from '../../../components/chessboard/setup-chessboard'
import { Scoresheet } from './scoresheet/scoresheet'

const OFFSET_HEIGHT = 125

const { Content } = Layout

// TODO: Move this to FEN utils
function getFullMoveNumber(fen: ChessTypes.FEN) {
  return fen.split(' ')[5]
}

// TODO: Move this to piece utils
function getPiecesCount(fen: ChessTypes.FEN) {
  const expandedFen = Util.expandFen(fen)
  const piecePlacement = expandedFen.split(' ')[0].replace('/', '')
  const matches = piecePlacement.match(/1/g)
  return 64 - (matches ? matches.length : 0)
}

interface Props extends RouteComponentProps<any> {
  engineStore?: EngineStore
}

interface State {
  playerSide: ChessTypes.Side
  boardSize: number
  squareHighlights: ChessTypes.SquareHighlightAnnotation[]
  thinking: boolean
  error: string
  gameEditor: GameEditor.GameEditor
  revealPosition: boolean
  showScoresheet: boolean
  startFen: ChessTypes.FEN
  setup: boolean
  result: ChessTypes.GameResult
  maxDepth: number
}

@inject('practiceStore', 'engineStore')
@observer
class WrappedBlindbot extends React.Component<Props, State> {
  state = {
    playerSide: 'w' as ChessTypes.Side,
    boardSize: 0,
    squareHighlights: [], // For highlighting last move
    thinking: false,
    error: '',
    gameEditor: new GameEditor.GameEditor(),
    revealPosition: false,
    showScoresheet: false,
    startFen: new Chess().fen(), // TODO: change this based on position setup
    setup: true,
    result: '*' as ChessTypes.GameResult,
    maxDepth: 1
  }

  unregisterHistoryBlock: Function

  constructor(props: Props) {
    super(props)
    this.unregisterHistoryBlock = this.props.history.block(
      'Are you sure you want to navigate away?'
    )
  }

  componentWillUnmount() {
    this.unregisterHistoryBlock()
  }

  getCurrentFen = () => {
    const moveAtPath = this.state.gameEditor.getMoveAtPath(
      this.state.gameEditor.getState().currentPath
    )
    return moveAtPath
      ? moveAtPath.fen
      : this.state.gameEditor.getState().startFen!
  }

  handleEditCancel = (link: string) => (e: any) => {
    this.props.history.push(link)
  }

  makeEngineMove = async (fen: ChessTypes.FEN) => {
    const g = new Chess(fen)
    try {
      const depth = Math.min(
        getPiecesCount(fen) > 6 ? 8 : 5,
        this.state.maxDepth
      )
      const engineEval = await this.props.engineStore!.go({ fen, depth })
      const nextMove = engineEval.result!.mainline[0]
      const newMove = g.move(nextMove)
      if (newMove) {
        this.state.gameEditor.addMove(newMove)
        this.setState(
          {
            thinking: false,
            squareHighlights: [
              {
                type: 'SQUARE_HIGHLIGHT',
                square: newMove.from,
                color: 'yellow'
              },
              { type: 'SQUARE_HIGHLIGHT', square: newMove.to, color: 'yellow' }
            ]
          },
          () => {
            if (g.game_over()) {
              this.handleGameOver(fen, g.fen())
            }
          }
        )
      }
    } catch (e) {
      this.setState({ error: 'Failed to receive move' })
    }
  }

  handleSetupPositionFenChange = (fen: ChessTypes.FEN) => {
    this.setState({ startFen: fen })
  }

  handlePlayerSideChange = (value: any) => {
    this.setState({ playerSide: value as ChessTypes.Side })
  }

  handleNewGame = () => {
    this.setState({
      squareHighlights: [], // For highlighting last move
      thinking: false,
      error: '',
      gameEditor: new GameEditor.GameEditor(),
      revealPosition: false,
      showScoresheet: false,
      startFen: new Chess().fen(), // TODO: change this based on position setup
      setup: true,
      result: '*' as ChessTypes.GameResult
    })
  }

  handleRestart = () => {
    const thinking =
      this.state.playerSide !== Util.getSideToMoveFromFen(this.state.startFen)
    this.setState(
      {
        error: '',
        thinking,
        gameEditor: new GameEditor.GameEditor(this.state.startFen),
        revealPosition: false,
        showScoresheet: false,
        squareHighlights: [],
        setup: false
      },
      () => {
        if (thinking) {
          this.makeEngineMove(this.state.startFen)
        }
      }
    )
  }

  handleGameSetup = () => {
    this.handleRestart()
  }

  handleResign = () => {
    this.setState({
      error: '',
      thinking: false,
      gameEditor: new GameEditor.GameEditor(this.state.startFen),
      revealPosition: false,
      showScoresheet: false,
      squareHighlights: [],
      setup: true
    })
  }

  handleToggleScoresheet = () => {
    this.setState({ showScoresheet: !this.state.showScoresheet })
  }

  handleGameOver = (prevFen: ChessTypes.FEN, lastFen: ChessTypes.FEN) => {
    const g = new Chess(lastFen)
    this.setState({
      revealPosition: true,
      thinking: false,
      result: g.in_draw()
        ? '1/2-1/2'
        : Util.getSideToMoveFromFen(prevFen) === 'w'
        ? '1-0'
        : '0-1'
    })
  }

  handleRevealPositionToggle = () => {
    this.setState({
      revealPosition: !this.state.revealPosition
    })
  }

  handleSetMaxDepth = (e: any) => {
    this.setState({ maxDepth: e.target.value })
  }

  handleMove = async (m: ChessTypes.ChessJSVerboseInputMove) => {
    const prevFen = this.getCurrentFen()
    const g = new Chess(this.getCurrentFen())
    if (g.move(m)) {
      this.state.gameEditor.addMove(m)
      this.setState(
        {
          squareHighlights: [
            { type: 'SQUARE_HIGHLIGHT', square: m.from, color: 'yellow' },
            { type: 'SQUARE_HIGHLIGHT', square: m.to, color: 'yellow' }
          ],
          thinking: true
        },
        async () => {
          if (g.game_over()) {
            this.handleGameOver(prevFen, g.fen())
          } else {
            await this.makeEngineMove(g.fen())
          }
        }
      )
    }
  }

  render() {
    const lastMove = this.state.gameEditor.getMoveAtPath(
      this.state.gameEditor.getState().currentPath
    )
    const lastMoveString = lastMove ? (
      <span>
        <span className="number">
          {lastMove.side === 'w' && getFullMoveNumber(lastMove.fen) + '. '}
          {lastMove.side === 'b' &&
            (getFullMoveNumber(lastMove.fen) as any) - 1 + '... '}
        </span>
        {lastMove.san}
      </span>
    ) : (
      ''
    )

    return (
      <Content className="blindbot content">
        <div className="inner">
          <div className="action-bar">
            <div className="left">
              <Breadcrumb>
                <Breadcrumb.Item>
                  <strong>Blindbot</strong>
                </Breadcrumb.Item>
              </Breadcrumb>
            </div>
            <div className="right">
              <Popconfirm
                title="Are you sure you want to start a new game?"
                onConfirm={this.handleNewGame}
              >
                <Button
                  type="primary"
                  size="small"
                  disabled={this.state.thinking}
                >
                  New Game
                </Button>
              </Popconfirm>
              <Popconfirm
                title="Are you sure you want to restart the game?"
                onConfirm={this.handleRestart}
              >
                <Button
                  type="danger"
                  size="small"
                  disabled={this.state.thinking}
                >
                  Restart
                </Button>
              </Popconfirm>
              <Popconfirm
                title="Are you sure you want to resign the game?"
                onConfirm={this.handleResign}
              >
                <Button
                  type="danger"
                  size="small"
                  disabled={this.state.thinking}
                >
                  Resign
                </Button>
              </Popconfirm>
              {this.state.revealPosition && (
                <Button
                  type="primary"
                  size="small"
                  onClick={this.handleRevealPositionToggle}
                  style={{ width: 115 }}
                >
                  Hide Position
                </Button>
              )}
              {!this.state.revealPosition && (
                <Button
                  type="primary"
                  size="small"
                  onClick={this.handleRevealPositionToggle}
                  style={{ width: 115 }}
                >
                  Reveal Position
                </Button>
              )}
              <Button
                type="primary"
                size="small"
                onClick={this.handleToggleScoresheet}
              >
                Show Scoresheet
              </Button>
            </div>
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
                    fen={this.getCurrentFen()}
                    width={this.state.boardSize}
                    height={this.state.boardSize}
                    interactionMode={this.state.thinking ? 'NONE' : 'MOVE'}
                    showSideToMove={true}
                    orientation={this.state.playerSide}
                    squareHighlights={this.state.squareHighlights}
                    onMove={this.handleMove}
                    blindfold={!this.state.revealPosition}
                  />
                  {this.state.thinking && (
                    <div className="thinking">
                      <Icon type="hourglass" theme="outlined" />
                      <span className="description">Thinking...</span>
                    </div>
                  )}
                  {!lastMove && (
                    <div className="last-move">
                      <span>
                        Your turn, click on the squares or drag to move the
                        hidden pieces
                      </span>
                    </div>
                  )}
                  {lastMove && (
                    <div className="last-move">{lastMoveString}</div>
                  )}
                </div>
              </div>
            )}
          </Measure>
          <Modal
            title="New blindbot game"
            visible={this.state.setup}
            style={{ top: 25 }}
            width={800}
            closable={false}
            maskClosable={false}
            onOk={this.handleGameSetup}
            onCancel={this.handleEditCancel('/app/dashboard')}
          >
            <Row className="set-difficulty" style={{ marginBottom: '1em' }}>
              <Col offset={16}>
                Difficulty:&nbsp;&nbsp;
                <Radio.Group
                  size="small"
                  value={this.state.maxDepth}
                  onChange={this.handleSetMaxDepth}
                >
                  <Radio.Button value={1}>Easy</Radio.Button>
                  <Radio.Button value={4}>Medium</Radio.Button>
                  <Radio.Button value={8}>Hard</Radio.Button>
                </Radio.Group>
              </Col>
            </Row>
            <Row className="position-setup-modal" title="Setup Position">
              {this.state.setup && (
                <SetupChessboard
                  width={550}
                  height={550}
                  initialFen={this.state.startFen}
                  onChange={this.handleSetupPositionFenChange}
                />
              )}
              <div className="player color">
                <span className="label">You play:</span>&nbsp;
                <Select
                  size="small"
                  value={this.state.playerSide}
                  onChange={this.handlePlayerSideChange}
                >
                  <Select.Option value="w">White</Select.Option>
                  <Select.Option value="b">Black</Select.Option>
                </Select>
              </div>
            </Row>
          </Modal>
          <Modal
            visible={this.state.result !== '*'}
            title="Game Over"
            cancelText="Back to Dashboard"
            okText="New Game"
            closable={false}
            onOk={this.handleNewGame}
          >
            {this.state.result === '1/2-1/2' && <h3>Draw</h3>}
            {((this.state.result === '1-0' && this.state.playerSide === 'w') ||
              (this.state.result === '0-1' &&
                this.state.playerSide === 'b')) && <h3>Great, you won!</h3>}
            {((this.state.result === '0-1' && this.state.playerSide === 'w') ||
              (this.state.result === '1-0' &&
                this.state.playerSide === 'b')) && (
              <h3>You lost, but don't despair!</h3>
            )}
          </Modal>
          <Drawer
            className="blindbot-scoresheet-container"
            closable={true}
            onClose={this.handleToggleScoresheet}
            visible={this.state.showScoresheet}
            placement="right"
            width={450}
          >
            <div className="drawer-inner">
              <div className="title">
                <h3>Scoresheet</h3>
              </div>
              <div className="content">
                <Scoresheet
                  currentPath={this.state.gameEditor.getState().currentPath}
                  mainline={this.state.gameEditor.getState().mainline}
                />
              </div>
            </div>
          </Drawer>
          <Modal
            visible={this.state.error.length > 0}
            title="Error"
            cancelButtonProps={{ style: { display: 'none' } }}
            okText="Try again"
            onOk={() => this.makeEngineMove(this.getCurrentFen())}
          >
            An unexpected error occured while receiving move from bot.
          </Modal>
        </div>
      </Content>
    )
  }
}

export const Blindbot = withRouter(WrappedBlindbot)
