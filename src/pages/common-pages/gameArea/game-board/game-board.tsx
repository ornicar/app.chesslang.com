import React, { Component } from 'react'
import ReactResizeDetector from 'react-resize-detector'
import ChessgroundBoard from '../../../../components/chessgroundboard/chessgroundboard'
import { inject, observer } from 'mobx-react'
import { SyncedGameStore } from '../../../../stores/synced-game'
import {
  Card,
  Row,
  Button,
  Modal,
  Col,
  notification,
  Popconfirm,
  Spin
} from 'antd'

import './game-board.less'

interface Props {
  gameId: any
  syncedGameStore?: SyncedGameStore
  userStore?: UserStore
}

@inject('syncedGameStore', 'userStore')
@observer
class GameBoard extends Component<Props> {
  handleAcceptDraw = () => {
    console.log('Accepted Draw')
    this.props.syncedGameStore!.acceptDraw()
  }

  openDrawNotification = () => {
    const key = `draw`
    const btn = (
      <div>
        <Button
          type="primary"
          size="small"
          onClick={() => {
            notification.close(key)
            this.props.syncedGameStore!.setIsDrawOffered(false)
            this.handleAcceptDraw()
          }}
        >
          Accept Draw
        </Button>
        <Button
          style={{ marginLeft: 8 }}
          type="danger"
          size="small"
          onClick={() => {
            notification.close(key)
            this.props.syncedGameStore!.setIsDrawOffered(false)
          }}
        >
          Decline
        </Button>
      </div>
    )
    notification.open({
      message: 'Opponent requested a draw',
      description: '',
      placement: 'topRight',
      btn,
      key,
      onClose: () => {
        this.props.syncedGameStore!.setIsDrawOffered(false)
      }
    })
  }

  componentDidMount() {
    this.props.syncedGameStore!.initGame(this.props.gameId)
    autorun(() => {
      if (this.props.syncedGameStore!.isDrawOffered) {
        this.openDrawNotification()
        console.log('Clearing draw request after notification')
        // this.props.syncedGameStore!.setDrawRequest(false)
      }
    })
  }

  componentDidUpdate(prevProps: { gameId: any }) {
    if (prevProps.gameId != this.props.gameId) {
      this.props.syncedGameStore!.initGame(this.props.gameId)
    }
  }

  onMove = (orig: string, dest: string, metadata: any) => {
    // this.props.syncedGameStore!.makeMoveAndPublish(orig, dest)
    this.props.syncedGameStore!.makeMove(orig, dest, metadata)
  }

  onFenUpdate = (fen: any) => {
    // console.log('Fen update ', fen)
    // this.props.syncedGameStore!.publishFen(fen)
  }

  handleOnReturn = () => {
    this.props.syncedGameStore!.clearCurrentGame()
  }

  onModalClose = () => {
    this.props.syncedGameStore!.setResultModalVisiblity(false)
  }

  handleOnRematch = () => {
    this.props.syncedGameStore!.offerRematch()
  }

  render() {
    var topTimer = null
    var bottomTimer = null

    if (this.props.syncedGameStore!.playerColor == 'white') {
      topTimer = (
        <TimerComponent
          time={this.props.syncedGameStore!.blackTimeInSeconds}
          name={this.props.syncedGameStore!.opponentName}
        />
      )
      bottomTimer = (
        <TimerComponent
          name={this.props.syncedGameStore!.playerName}
          time={this.props.syncedGameStore!.whiteTimeInSeconds}
        />
      )
    } else {
      topTimer = (
        <TimerComponent
          time={this.props.syncedGameStore!.whiteTimeInSeconds}
          name={this.props.syncedGameStore!.opponentName}
        />
      )
      bottomTimer = (
        <TimerComponent
          time={this.props.syncedGameStore!.blackTimeInSeconds}
          name={this.props.syncedGameStore!.playerName}
        />
      )
    }

    var resignButton = (
      <Popconfirm
        title="Are you sure?"
        onConfirm={this.props.syncedGameStore!.resignGame}
        okText="Yes"
        cancelText="No"
        placement="bottom"
      >
        <Button type="primary" block>
          Resign
        </Button>
      </Popconfirm>
    )

    var abortButton = (
      <Button
        type="primary"
        onClick={this.props.syncedGameStore!.abortGame}
        block
      >
        Abort
      </Button>
    )

    var refreshButton = (
      <Button type="primary" onClick={() => window.location.reload()} block>
        Refresh
      </Button>
    )

    var topPanel
    if (!this.props.syncedGameStore!.isGameOver) {
      topPanel = (
        <Row
          className="gameboard-top-panel"
          type="flex"
          justify="space-between"
        >
          <Col span={7} className="gameboard-top-panel-column">
            {refreshButton}
          </Col>
          <Col span={7} className="gameboard-top-panel-column">
            {this.props.syncedGameStore!.shouldShowAbort
              ? abortButton
              : resignButton}
          </Col>
          <Col span={7} className="gameboard-top-panel-column">
            <Button
              type="primary"
              onClick={this.props.syncedGameStore!.offerDraw}
              block
            >
              Draw
            </Button>
          </Col>
        </Row>
      )
    } else {
      topPanel = (
        <Row
          className="gameboard-top-panel"
          type="flex"
          justify="space-between"
        >
          <Col span={11} className="gameboard-top-panel-column">
            <Button type="primary" onClick={this.handleOnReturn} block>
              Return
            </Button>
          </Col>
          {!this.props.syncedGameStore!.isTournamentModeOn && (
            <Col span={11} className="gameboard-top-panel-column">
              <Button type="primary" onClick={this.handleOnRematch} block>
                Rematch
              </Button>
            </Col>
          )}
        </Row>
      )
    }

    return (
      <div className="game-board">
        <div className="game-wrapper">
          {topPanel}
          {topTimer}
          <Spin spinning={this.props.syncedGameStore!.loading}>
            <ChessgroundBoard
              onMove={this.onMove}
              onFenUpdate={this.onFenUpdate}
              fen={this.props.syncedGameStore!.fen}
              turnColor={this.props.syncedGameStore!.playerColor}
              orientation={this.props.syncedGameStore!.playerColor}
              movable={this.props.syncedGameStore!.dests}
              lastMove={this.props.syncedGameStore!.lastMove}
            />
          </Spin>
          {bottomTimer}
          <div
            style={{
              marginRight: '12px',
              textAlign: 'right',
              fontSize: '24px',
              color:
                this.props.syncedGameStore!.connectionStatus === 'connected'
                  ? 'green'
                  : 'red'
            }}
          >
            {this.props.syncedGameStore!.connectionStatus}
          </div>
        </div>
        {this.props.syncedGameStore!.resultModalVisiblity && (
          <Modal
            visible={this.props.syncedGameStore!.resultModalVisiblity}
            title={this.props.syncedGameStore!.result.text}
            onCancel={this.onModalClose}
            footer={[
              <Button key="return" type="primary" onClick={this.onModalClose}>
                Close
              </Button>
            ]}
          >
            <Row
              style={{
                fontSize: 32
              }}
            >
              <Col span={24}>{this.props.syncedGameStore!.formattedResult}</Col>
            </Row>
          </Modal>
        )}
      </div>
    )
  }
}

import { autorun } from 'mobx'
import { getUpdatedFenWithIllegalMove } from '@chesslang/chess/build/Util/Util'
import { UserStore, userStore } from '../../../../stores/user'
import { GameStatus } from '../../../../types'
import { formatTime } from '../../../../utils/utils'

interface TimerProps {
  name: String
  time: number
}

class TimerComponent extends Component<TimerProps> {
  render() {
    return (
      <div
        style={{
          display: 'flex',
          marginLeft: 12,
          marginRight: 12,
          fontSize: 32
        }}
      >
        <div className="text-ellipsis" style={{ flex: 1 }}>
          {this.props.name}
        </div>
        <div>{formatTime(this.props.time)}</div>
      </div>
    )
  }
}

export default GameBoard
