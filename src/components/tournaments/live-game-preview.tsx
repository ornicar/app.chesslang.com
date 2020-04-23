import React, { Component } from 'react'
import { LiveGamePreviewStore } from '../../stores/live-game-preview'
import { inject, observer } from 'mobx-react'
import { Row, Col } from 'antd'
import './live-game-preview.less'
import { ConfiguredChessboard } from '../chessboard/configured-chessboard'
import {
  getTimeInSeconds,
  formatTime,
  formattedResult2
} from '../../utils/utils'

interface LiveGamePreviewProps {
  liveGamePreviewStore?: LiveGamePreviewStore
  tournamentId: string
  round: number
}

@inject('liveGamePreviewStore')
@observer
export default class LiveGamePreview extends Component<LiveGamePreviewProps> {
  componentDidMount() {
    this.props.liveGamePreviewStore!.unsub()
    this.props.liveGamePreviewStore!.sub(
      this.props.tournamentId,
      this.props.round
    )
  }

  componentDidUpdate(prevProps: LiveGamePreviewProps) {
    if (this.props.round != prevProps.round) {
      this.props.liveGamePreviewStore!.unsub()
      this.props.liveGamePreviewStore!.sub(
        this.props.tournamentId,
        this.props.round
      )
    }
  }

  componentWillUnmount() {
    this.props.liveGamePreviewStore!.unsub()
  }

  renderGames = () => {
    return this.props.liveGamePreviewStore!.games.map(
      (game: any, index: number) => {
        return <GamePreview game={game} key={index} />
      }
    )
  }

  render() {
    return <div className="live-game-preview">{this.renderGames()}</div>
  }
}

interface GamePreviewProps {
  game: any
}

export class GamePreview extends Component<GamePreviewProps> {
  renderPlayerInfo(
    playerSide: string,
    playerName: string,
    playerTime: number,
    turn: string
  ) {
    return (
      <Row>
        <Col className="text-ellipsis" span={20}>
          {`${playerSide == turn ? '*' : ''} ${playerName}`}
        </Col>
        <Col className="text-right" span={4}>
          {formatTime(getTimeInSeconds(playerTime))}
        </Col>
      </Row>
    )
  }

  render() {
    const {
      board_no,
      white_name,
      black_name,
      white_time,
      black_time,
      turn,
      fen
    } = this.props.game

    if (this.props.game.turn !== null) {
      return (
        <div className="game-container">
          <div>Board {board_no}</div>
          {this.renderPlayerInfo('black', black_name, black_time, turn)}
          <div className="live-game-board">
            <ConfiguredChessboard
              fen={fen}
              width={300}
              height={300}
              interactionMode="NONE"
            />
          </div>
          {this.renderPlayerInfo('white', white_name, white_time, turn)}
          <div className="text-bold text-center">
            {formattedResult2(
              this.props.game.white_score,
              this.props.game.black_score
            )}
          </div>
        </div>
      )
    } else {
      return null
    }
  }
}
