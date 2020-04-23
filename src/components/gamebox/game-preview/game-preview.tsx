import * as R from 'ramda'
import React from 'react'
import { inject, observer } from 'mobx-react'

import { Icon, Button, Tabs } from 'antd'

import './game-preview.less'

import Scoresheet from '../scoresheet/scoresheet'
import { ChessTypes, Chess } from '@chesslang/chess'
import { GameboxGamePreviewStore } from '../../../stores/gamebox-game-preview'
import { Chessboard } from '../../../components/chessboard/chessboard'
import Analyzer from '../../analyzer/analyzer'
import { variationToPGN } from '@chesslang/chess/build/Util/Util'
import bind from 'ramda/es/bind'
import { hydrateWithDerviedFields } from '../../../utils/utils'

const { TabPane } = Tabs

const getMoveAtPath = (game: ChessTypes.Game, path: any) => {
  return path
    ? path.reduce((acc: any, p: any) => acc[p] || null, game.mainline, path)
    : null
}

const getFenAtPath = (game: ChessTypes.Game, path: any) => {
  const moveAtPath = getMoveAtPath(game, path)
  return moveAtPath && moveAtPath.fen
}

interface GameShape extends ChessTypes.Game {
  uuid: string
  content: any
  meta: any
  [key: string]: any
}

interface WrappedProps {
  error: boolean
  loading: boolean
  game?: GameShape
  isAnalyzeFeatureOn?: boolean
  onErrorRetry: () => any
}

interface WrappedState {
  currentGame?: ChessTypes.Game
  currentPath: any[]
  gameArea: boolean
  analyzeArea: boolean
  analyzeFen: String
}

class WrappedGamePreview extends React.Component<WrappedProps, WrappedState> {
  state = {
    currentPath: [],
    currentGame: undefined,
    gameArea: true,
    analyzeArea: false,
    analyzeFen: new Chess().fen()
  }
  componentDidMount() {
    if (this.props.game) {
      this.setState({
        currentPath: [],
        currentGame: hydrateWithDerviedFields(
          this.props.game.meta,
          this.props.game.content
        )
      })
    }
  }

  componentWillReceiveProps(nextProps: WrappedProps) {
    if (nextProps.game) {
      this.setState({
        currentPath: [],
        currentGame: hydrateWithDerviedFields(
          nextProps.game.meta,
          nextProps.game.content
        )
      })
    }
  }
  setGameArea = () => {
    this.setState({
      gameArea: true,
      analyzeArea: false,
      analyzeFen: new Chess().fen()
    })
  }
  setAnalyzeArea = (fen: String) => {
    this.setState({
      gameArea: false,
      analyzeArea: true,
      analyzeFen: fen
    })
    this.renderChessboard()
  }
  handlePrev = (times: number) => () => {
    this.setGameArea()
    const currentPath =
      this.state.currentPath.length <= 0 ? [0] : this.state.currentPath
    const currentIdx = R.last(currentPath)! as number
    let prevPath = currentPath
    // TODO: Jump to parent variation
    for (let i = 0; i <= times; i++) {
      prevPath = [...R.dropLast(1, currentPath), Math.max(currentIdx - i, 0)]
      const prevMove = getMoveAtPath(this.state.currentGame!, prevPath)
      prevPath = prevMove ? prevPath : currentPath
      if (!prevMove) break
    }
    this.setState({ currentPath: prevPath })
  }

  handleNext = (times: number) => () => {
    this.setGameArea()
    const currentPath =
      this.state.currentPath.length <= 0 ? [0] : this.state.currentPath
    const currentIdx = R.last(currentPath)! as number
    let nextPath = currentPath
    for (let i = 0; i <= times; i++) {
      nextPath = [...R.dropLast(1, currentPath), currentIdx + i]
      const nextMove = getMoveAtPath(this.state.currentGame!, nextPath)
      nextPath = nextMove ? nextPath : currentPath
      if (!nextMove) break
    }
    this.setState({ currentPath: nextPath })
  }

  handleMoveClick = (path: any) => {
    if (path) {
      this.setGameArea()
      this.setState({ currentPath: path })
    }
  }

  renderLoadingOverlay = () => {
    if (this.props.loading) {
      return (
        <div className={'loadingOverlay'}>
          <Icon type="loading" />
        </div>
      )
    }

    return null
  }

  renderErrorOverlay = () => {
    if (this.props.error) {
      return (
        <div className={'errorOverlay'}>
          <Icon type="api" />
          <p>We encountered an error while loading the game</p>
          <Button size="small" type="primary" onClick={this.props.onErrorRetry}>
            Retry
          </Button>
        </div>
      )
    }

    return null
  }

  renderMetaAndControls = () => {
    return (
      <div className={'metaAndControls'}>
        {/* <Link href={`/game/${this.props.game!.uuid}`}>
          <a target="_blank">Edit</a>
        </Link> */}
      </div>
    )
  }

  renderChessboard = () => {
    const meta = this.props.game!.meta
    const fen =
      (this.state.analyzeArea && this.state.analyzeFen) ||
      (this.state.gameArea &&
        (getFenAtPath(this.state.currentGame!, this.state.currentPath) ||
          meta.startfen ||
          meta.startFen ||
          meta.fen ||
          this.props.game!.content.startFen ||
          new Chess().fen()))
    return (
      <div className={'chessboardContainer'}>
        <Chessboard width={300} height={300} fen={fen} interactionMode="NONE" />
        <div className={'controlButtons'}>
          <Button
            icon="fast-backward"
            size="small"
            onClick={this.handlePrev(5)}
          />
          <Button
            icon="step-backward"
            size="small"
            onClick={this.handlePrev(1)}
          />
          <Button
            icon="step-forward"
            size="small"
            onClick={this.handleNext(1)}
          />
          <Button
            icon="fast-forward"
            size="small"
            onClick={this.handleNext(5)}
          />
        </div>
      </div>
    )
  }

  renderScoresheet = () => {
    return (
      this.state.currentGame && (
        <div className="scoresheetContainer">
          <Scoresheet
            onMoveClick={this.handleMoveClick}
            currentPath={this.state.currentPath}
            mainline={this.state.currentGame!.mainline}
          />
        </div>
      )
    )
  }

  renderAnalyzer = () => {
    return (
      this.state.currentGame && (
        <div>
          <Analyzer
            moves={this.props.game!.content.mainline}
            fen={
              this.props.game!.meta.startfen ||
              this.props.game!.meta.fen ||
              new Chess().fen()
            }
            onClick={this.handleMoveClick}
            onAnalyzeMoveClick={this.setAnalyzeArea}
          />
        </div>
      )
    )
  }

  renderGameInfo() {
    return (
      <Tabs className="game-info" defaultActiveKey="moves" type="card">
        <TabPane tab={<span>Moves</span>} key="moves">
          {this.state.currentGame && this.renderScoresheet()}
        </TabPane>
        {this.props.isAnalyzeFeatureOn && (
          <TabPane
            tab={
              <span>
                Analyze&nbsp;&nbsp;<sup style={{ color: 'red' }}>NEW</sup>
              </span>
            }
            key="analyze"
          >
            {this.state.currentGame && this.renderAnalyzer()}
          </TabPane>
        )}
      </Tabs>
    )
  }

  render() {
    return (
      <div className={'gamePreview'}>
        {this.state.currentGame && this.renderMetaAndControls()}
        {this.state.currentGame && this.renderChessboard()}
        {this.renderGameInfo()}
        {this.renderLoadingOverlay()}
        {this.renderErrorOverlay()}
      </div>
    )
  }
}

interface Props {
  gameboxGamePreviewStore?: GameboxGamePreviewStore
  gameUuid?: string
  isAnalyzeFeatureOn: boolean
}

@inject('gameboxGamePreviewStore')
@observer
export default class GamePreview extends React.Component<Props> {
  componentDidMount() {
    if (this.props.gameUuid) {
      this.props.gameboxGamePreviewStore!.load({
        gameUuid: this.props.gameUuid
      })
    }
  }

  componentWillReceiveProps(nextProps: Props) {
    if (nextProps.gameUuid && nextProps.gameUuid !== this.props.gameUuid) {
      this.props.gameboxGamePreviewStore!.load({
        gameUuid: nextProps.gameUuid
      })
    }
  }

  render() {
    if (!this.props.gameUuid) {
      return (
        <div className={`gamePreview noGameSelected`}>
          <p>Select a game to preview</p>
        </div>
      )
    }

    const gamePreview = this.props.gameboxGamePreviewStore!

    return (
      <WrappedGamePreview
        error={gamePreview.error}
        loading={gamePreview.loading}
        game={gamePreview.game}
        isAnalyzeFeatureOn={this.props.isAnalyzeFeatureOn}
        onErrorRetry={() =>
          gamePreview.load({
            gameUuid: this.props.gameUuid!
          })
        }
      />
    )
  }
}
