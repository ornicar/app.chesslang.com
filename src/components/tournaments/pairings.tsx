import React, { Component } from 'react'
import { Tabs, List, Skeleton, Avatar, Spin } from 'antd'
import { observer, inject } from 'mobx-react'
import { TournamentViewStore, DataStatus } from '../../stores/tournament-view'
import { Link } from 'react-router-dom'
import {
  getFormattedName,
  formattedResult2,
  DEFAULT_FEN
} from '../../utils/utils'
import EditResultModal from './edit-result-modal'
import RestartGameModal from './restart-game-modal'
import { LiveGamePreviewStore } from '../../stores/live-game-preview'
import _ from 'lodash'
import Title from 'antd/lib/typography/Title'

const { TabPane } = Tabs

interface Props {
  tournamentViewStore?: TournamentViewStore
  liveGamePreviewStore?: LiveGamePreviewStore
}

@inject('tournamentViewStore', 'liveGamePreviewStore')
@observer
export default class Pairings extends Component<Props> {
  state = {
    selectedGameId: '',
    resultModalVisible: false,
    modalConfirmLoading: false,

    restartModalVisible: false,
    restartGameFen: ''
  }

  render() {
    return this.props.tournamentViewStore!.pairingStatus ==
      DataStatus.LOADING ? (
      <div className="flex-center">
        <Spin />
      </div>
    ) : (
      this.renderContent()
    )
  }

  renderContent() {
    return (
      <div>
        <Tabs
          defaultActiveKey={`${this.props.tournamentViewStore!.latestRound}`}
          type="card"
        >
          {this.renderTabs()}
        </Tabs>
        <EditResultModal
          visible={this.state.resultModalVisible}
          confirmLoading={this.state.modalConfirmLoading}
          handleOk={this.handleEditResultOk}
          handleCancel={this.handleCancel}
        />
        <RestartGameModal
          visible={this.state.restartModalVisible}
          confirmLoading={this.state.modalConfirmLoading}
          handleOk={this.handleReplayGameOk}
          handleCancel={this.handleCancel}
          fen={this.state.restartGameFen}
        />
      </div>
    )
  }
  handleEditResult = (gameId: any) => () => {
    this.setState({
      resultModalVisible: true,
      selectedGameId: gameId
    })
  }

  handleReplayGame = (gameId: string, fen: string) => async () => {
    // prioritize fen from live game
    const liveGame = this.props.liveGamePreviewStore!.games.find(
      g => g.gameId == gameId
    )

    if (liveGame != null) {
      this.setState({
        restartModalVisible: true,
        selectedGameId: gameId,
        restartGameFen: liveGame.fen
      })
    } else {
      this.setState({
        restartModalVisible: true,
        selectedGameId: gameId,
        restartGameFen: fen || DEFAULT_FEN
      })
    }
  }

  handleDownloadPgn = (gameId: string, round: number) => async () => {
    this.props.tournamentViewStore!.downloadGame(gameId, round)
  }

  handleEditResultOk = async (resultValue: string) => {
    this.setState({
      modalConfirmLoading: true
    })

    await this.props.tournamentViewStore!.updatePairingResult(
      this.state.selectedGameId,
      resultValue
    )

    this.setState({
      modalConfirmLoading: false,
      resultModalVisible: false,
      selectedGameId: ''
    })
  }

  handleReplayGameOk = async (blackTime: number, whiteTime: number) => {
    this.setState({
      modalConfirmLoading: true
    })

    console.log('Replaying game', this.state.selectedGameId)

    await this.props.tournamentViewStore!.replayGame(
      this.state.selectedGameId,
      blackTime,
      whiteTime
    )

    this.setState({
      modalConfirmLoading: false,
      restartModalVisible: false,
      selectedGameId: ''
    })
  }

  handleCancel = () => {
    this.setState({
      modalConfirmLoading: false,
      resultModalVisible: false,
      restartModalVisible: false,
      selectedGameId: '',
      restartGameFen: ''
    })
  }

  renderPairing = (item: any) => {
    const actions: any[] = []

    if (this.props.tournamentViewStore!.isTournamentOwner) {
      actions.push(
        <a onClick={this.handleEditResult(item.platform_game_uuid)}>Edit</a>
      )
      actions.push(
        <a onClick={this.handleReplayGame(item.platform_game_uuid, item.fen)}>
          Replay
        </a>
      )
    }

    if (item.game_uuid != null) {
      actions.push(
        <Link to={`/app/board?gameUuid=${item.game_uuid}`}>View game</Link>
      )
      // actions.push(
      //   <a
      //     onClick={this.handleDownloadPgn(item.platform_game_uuid, item.round)}
      //   >
      //     Download
      //   </a>
      // )
    }

    function formatName(player: any) {
      if (player == null) {
        return 'BYE'
      }
      return `${getFormattedName(player)}`
    }

    const title = `${formatName(item.white_player)} vs ${formatName(
      item.black_player
    )}`

    return (
      <List.Item actions={actions}>
        <Skeleton title={false} loading={false}>
          <List.Item.Meta
            avatar={
              <Avatar
                style={{
                  backgroundColor: 'gray',
                  verticalAlign: 'middle'
                }}
                size="large"
              >
                {item.board_no}
              </Avatar>
            }
            title={title}
            description={`Board ${item.board_no} | Result ${formattedResult2(
              item.white_score,
              item.black_score
            )} | ${item.result_status || ''}`}
          />
        </Skeleton>
      </List.Item>
    )
  }

  renderTabs = () => {
    return _.map(
      this.props.tournamentViewStore!.tournament.pairings,
      (roundPairings, round) => {
        const roundPairingsSorted = _.orderBy(
          roundPairings,
          ['groupNo', 'board_no'],
          ['asc', 'asc']
        )

        const groupPairingsMap = _.groupBy(roundPairingsSorted, 'groupNo')

        return (
          <TabPane tab={`Round ${round}`} key={round}>
            {_.map(groupPairingsMap, (groupPairings, groupNo) => {
              return (
                <div className="mb-4">
                  {groupNo != 'null' && (
                    <Title level={3}>Section {groupNo}</Title>
                  )}
                  <List
                    key={groupNo}
                    loading={false}
                    itemLayout="vertical"
                    dataSource={groupPairings}
                    renderItem={this.renderPairing}
                  />
                </div>
              )
            })}
          </TabPane>
        )
      }
    )
  }
}
