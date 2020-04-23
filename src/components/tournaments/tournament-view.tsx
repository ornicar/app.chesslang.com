import React, { Component } from 'react'
import { RouteComponentProps, withRouter } from 'react-router-dom'
import {
  Layout,
  Tabs,
  Col,
  Row,
  Button,
  Popconfirm,
  Badge,
  Spin,
  Modal,
  Popover,
  Tooltip
} from 'antd'
import Pairings from './pairings'
import Rankings from './rankings'
import Players from './players'
import Details from './details'
import Chat from './chat'

import './tournament-view.less'
import { TournamentViewStore } from '../../stores/tournament-view'
import { inject, observer } from 'mobx-react'
import { Firebase } from '../../firebaseInit'
import { TournamentChatStore } from '../../stores/tournament-chat-store'
import LiveGamePreview from './live-game-preview'
import { LiveGamePreviewStore } from '../../stores/live-game-preview'
import { StudentTournamentStore } from '../../stores/student-tournaments'

const { TabPane } = Tabs

interface Props extends RouteComponentProps<any> {
  tournamentViewStore?: TournamentViewStore
  liveGamePreviewStore?: LiveGamePreviewStore
  tournamentChatStore?: TournamentChatStore
  studentTournamentStore?: StudentTournamentStore
}

@inject('tournamentViewStore', 'tournamentChatStore', 'liveGamePreviewStore')
@observer
class TournamentView extends Component<Props> {
  unsubFirestoreListener: any
  state = {
    stage: null,
    activeTab: 'players',
    unreadMessageCount: 0,
    stageLoading: false,
    showInvitationModal: true,
    showInstructionModal: true
  }

  componentDidMount() {
    this.init(this.props.match.params.uuid)

    this.props.tournamentChatStore!.onNewMessage(
      (_: any, ownMessage: boolean) => {
        if (ownMessage || this.state.activeTab == 'chat') {
          return
        }
        this.setState({
          unreadMessageCount: this.state.unreadMessageCount + 1
        })
      }
    )

    document
      .querySelector('meta[name="viewport"]')!
      .setAttribute('content', 'width=device-width, initial-scale=1.0')
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.match.params.uuid != this.props.match.params.uuid) {
      this.init(this.props.match.params.uuid)
    }
  }

  init = (id: string) => {
    if (this.unsubFirestoreListener != null) {
      this.unsubFirestoreListener()
      this.unsubFirestoreListener = null
    }

    this.props.tournamentViewStore!.loadTournament(id)
    this.props.tournamentChatStore!.load(id)

    this.unsubFirestoreListener = Firebase.firestore()
      .collection('tournaments')
      .doc(id)
      .onSnapshot(async snap => {
        if (snap.data() != null) {
          let stage: any = snap.data()

          this.props.tournamentViewStore!.setDataAsStale()
          // FIXME: this will overload the server when all the clients hit at the same time
          // call the visible tab data to refresh

          if (
            this.state.stage != null &&
            this.state.stage.round_status != stage.round_status
          ) {
            this.props.tournamentViewStore!.refresh()
          }

          // FOR BACKWARD COMPATIBILITY
          // TODO : REMOVE
          stage =
            typeof stage.player_status == 'undefined'
              ? { ...stage, player_status: 'FINALIZED' }
              : stage

          this.setState({
            stage,
            stageLoading: false
          })
        } else {
          this.setState({
            stage: null,
            stageLoading: false
          })
        }
      })
  }

  handleTabChange = (tab: string) => {
    this.setState({ activeTab: tab })

    this.props.liveGamePreviewStore!.setPoll(tab == 'live_games')

    switch (tab) {
      case 'chat':
        this.setState({
          unreadMessageCount: 0
        })
        break
      case 'details':
      case 'players':
        this.props.tournamentViewStore!.loadDetails()
        break
      case 'pairings':
      case 'live_games':
        this.props.tournamentViewStore!.loadPairings()
        break
      case 'rankings':
        this.props.tournamentViewStore!.loadRankings()
        break
    }
  }

  componentWillUnmount() {
    if (this.unsubFirestoreListener != null) {
      this.unsubFirestoreListener()
      this.unsubFirestoreListener = null
    }

    document.querySelector('.app-sidebar')!.style!.display = 'block'
    document.querySelector('meta[name="viewport"]')!.setAttribute('content', '')
  }

  handleTournamentAction = () => {
    this.setState({ stageLoading: true })
    this.props.tournamentViewStore!.updateStage()
  }

  renderInstructionModal = () => {
    const stage: any = this.state.stage
    if (stage == null) {
      return null
    }

    if (stage.player_status == 'INVITED') {
      if (this.props.tournamentViewStore!.isTournamentOwner) {
        return (
          <Modal
            title="Instructions"
            visible={this.state.showInstructionModal}
            onOk={this.hideInstructionModal}
            cancelButtonProps={{ style: { display: 'none' } }}
            okText="Ok"
            onCancel={this.hideInstructionModal}
          >
            <ol>
              <li>
                First, click ‘Start Tournament’ to enable students to join the
                tournament. The students will be able to join the tournament
                ONLY after ‘Start Tournament’ is clicked.&nbsp;&nbsp;
              </li>
              <li>
                After the students have joined, click ‘Finalize Players’ to
                start the tournament with the players who have joined. At this
                point, those students who were invited, but didn’t join will not
                be a part of the tournament.&nbsp;&nbsp;
              </li>
              <li>Proceed to ‘Publish Pairings’ and 'Start Round'&nbsp;</li>
              <li>
                'Pairings and Results'->Replay to replay the game(s) from its
                latest board position, with specific time-control'&nbsp;
              </li>
            </ol>
          </Modal>
        )
      } else if (
        this.props.tournamentViewStore!.isStudentInvited &&
        stage.tournament_status === 'UPCOMING'
      ) {
        return (
          <Modal
            title="Instructions"
            visible={this.state.showInstructionModal}
            onOk={this.hideInstructionModal}
            cancelButtonProps={{ style: { display: 'none' } }}
            okText="Ok"
            onCancel={this.hideInstructionModal}
          >
            <div className="instruction">
              <p>
                You will be able to join this tournament only when the coach
                starts the tournament.
              </p>
              <p>
                You will be notified (by a pop-up) once the tournament starts,
                stay tuned!
              </p>
            </div>
          </Modal>
        )
      }
    }
  }

  hideInstructionModal = () => {
    this.setState({
      showInstructionModal: false
    })
  }

  renderInvitationModal = () => {
    const stage: any = this.state.stage
    if (stage == null) {
      return null
    }

    if (
      !this.props.tournamentViewStore!.hasPlayerJoined &&
      stage.player_status == 'INVITED' &&
      stage.tournament_status === 'CURRENT'
    ) {
      return (
        <Modal
          visible={this.state.showInvitationModal}
          onOk={() => this.props.tournamentViewStore!.joinTournament()}
          onCancel={this.hideInvitationModal}
          okText="Join"
        >
          You have been invited to join the tournamnet.
        </Modal>
      )
    }
  }

  hideInvitationModal = () => {
    this.setState({
      showInvitationModal: false
    })
  }

  renderActionButton = () => {
    let message = ''
    const stage: any = this.state.stage
    if (stage == null) {
      return null
    }

    if (stage.tournament_status === 'UPCOMING') {
      message = 'Start tournament'
    } else if (
      stage.tournament_status === 'CURRENT' &&
      stage.player_status === 'INVITED'
    ) {
      message = `Finalize Players`
    } else if (
      stage.tournament_status === 'CURRENT' &&
      stage.player_status === 'FINALIZED'
    ) {
      if (stage.round_status == 'INITIAL') {
        message = `Publish Round ${stage.round} pairings`
      } else if (stage.round_status == 'PAIRED') {
        message = `Start Round ${stage.round}`
      } else if (stage.round_status == 'IN_PROGRESS') {
        // FIXME: Only for testing. Remove later
        message = `Complete Round ${stage.round}`
      }
    }

    if (this.props.tournamentViewStore!.isTournamentOwner) {
      return (
        <Popconfirm
          title="Are you sure?"
          onConfirm={this.handleTournamentAction}
          okText="Yes"
          cancelText="No"
          placement="bottom"
        >
          <Button type="primary" loading={this.state.stageLoading}>
            {message}
          </Button>
        </Popconfirm>
      )
    } else if (this.props.tournamentViewStore!.isStudentInvited) {
      let disableButton = false

      let tooltipMessage = ''
      if (stage.tournament_status === 'UPCOMING') {
        tooltipMessage = 'Tournament has not started yet'
        disableButton = true
      } else if (stage.player_status === 'FINALIZED') {
        tooltipMessage = 'Tournament has already started'
        disableButton = true
      }

      if (this.props.tournamentViewStore!.hasPlayerJoined) {
        return (
          <Tooltip title={tooltipMessage}>
            <Button
              type="primary"
              disabled={disableButton}
              onClick={() => this.props.tournamentViewStore!.exitTournament()}
            >
              Exit
            </Button>
          </Tooltip>
        )
      } else {
        return (
          <Tooltip title={tooltipMessage}>
            <Button
              type="primary"
              disabled={disableButton}
              onClick={() => this.props.tournamentViewStore!.joinTournament()}
            >
              Join
            </Button>
          </Tooltip>
        )
      }
    }
  }

  renderEditButton = () => {
    const stage: any = this.state.stage
    if (stage == null) {
      return null
    }
    if (this.props.tournamentViewStore!.isTournamentOwner) {
      return (
        <Button
          style={{ marginRight: 4 }}
          color="default"
          disabled={stage.player_status === 'FINALIZED'}
          onClick={() =>
            this.props.history.push(this.props.match.url + '/edit')
          }
        >
          Edit
        </Button>
      )
    }
  }

  renderLiveGamePreviewTab = () => {
    return (
      <TabPane tab="Live games" key="live_games">
        <LiveGamePreview
          tournamentId={this.props.tournamentViewStore!.tournament.uuid}
          round={this.props.tournamentViewStore!.latestRound}
        />
      </TabPane>
    )
  }

  render() {
    // TODO: Fix the chat tab position. Currently only works if it's a last tab.
    return (
      <Layout.Content className="content tournament-view">
        {this.props.tournamentViewStore!.isStudentInvited &&
          this.renderInvitationModal()}
        {this.renderInstructionModal()}
        <div className="inner">
          <Row type="flex" justify="space-between">
            <Col>
              <h1>{this.props.tournamentViewStore!.tournament.name}</h1>
            </Col>
            <Col>
              {this.renderActionButton()}
              <Button
                style={{ marginLeft: 4 }}
                color="default"
                onClick={this.props.tournamentViewStore!.refresh}
              >
                Refresh
              </Button>
            </Col>
          </Row>
          <Tabs
            defaultActiveKey={this.state.activeTab}
            onChange={this.handleTabChange}
            type="card"
          >
            <TabPane tab="Details" key="details">
              <Details />
            </TabPane>
            <TabPane tab="Players" key="players">
              <Players />
            </TabPane>
            <TabPane tab="Pairings and Results" key="pairings">
              <Pairings />
            </TabPane>
            <TabPane tab="Rankings" key="rankings">
              <Rankings />
            </TabPane>
            {this.renderLiveGamePreviewTab()}
            <TabPane
              tab={
                <>
                  <span>Chat</span>

                  {this.state.unreadMessageCount > 0 &&
                    this.state.activeTab != 'chat' && (
                      <>
                        {' '}
                        <Badge count={this.state.unreadMessageCount} />
                      </>
                    )}
                </>
              }
              key="chat"
            >
              <Chat />
            </TabPane>
          </Tabs>
        </div>
      </Layout.Content>
    )
  }
}

const TournamentViewWithRouter = withRouter(TournamentView)

export default TournamentViewWithRouter
