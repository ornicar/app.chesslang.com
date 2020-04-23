import * as React from 'react'
import * as R from 'ramda'
import { Layout, Icon, Button, Modal } from 'antd'
import { Route, RouteComponentProps, Switch, Redirect } from 'react-router-dom'
import { inject, observer } from 'mobx-react'

import { Sidebar } from '../../components/sidebar/sidebar'

import { User } from '../user/user'
import { Assignment } from './assignment/assignment'
import { Blindbot } from './blindbot/blindbot'
import { Dashboard } from './dashboard/dashboard'
import { Practice } from './practice/practice'
import { MixpanelStore } from '../../stores/mixpanel'
import { UserStore } from '../../stores/user'
import { Gamebox } from './gamebox/gamebox'
import { GameArea } from '../common-pages/gameArea/gameArea'
import { AnalysisBoard } from '../common-pages/analysis-board/analysis-board'
import StudentTournaments from './tournaments/tournaments'
import TournamentViewWithRouter from '../../components/tournaments/tournament-view'
import { LiveGameStore } from '../../stores/live-game'

interface Props extends RouteComponentProps<any> {
  mixpanelStore?: MixpanelStore
  userStore?: UserStore
  liveGameStore?: LiveGameStore
}

interface State {
  hasError: boolean
  showProfileEditModal: boolean
}

@inject('mixpanelStore', 'userStore', 'liveGameStore')
@observer
export class StudentApp extends React.Component<Props, State> {
  state = {
    hasError: false,
    showProfileEditModal: false
  }

  handleReload = () => {
    window.location.reload()
  }

  componentDidMount() {
    this.props
      .userStore!.loadProfile()
      .then(() => {
        const firstname = R.trim(
          this.props.userStore!.profile.firstname.toLowerCase()
        )
        const lastname = R.trim(
          this.props.userStore!.profile.lastname.toLowerCase()
        )
        if (firstname === 'firstname' || lastname === 'lastname') {
          this.setState({ showProfileEditModal: true })
        }
      })
      .catch(() => {})
  }

  handleProfileRedirect = () => {
    this.setState(
      {
        showProfileEditModal: false
      },
      () => this.props.history.push('/app/preferences')
    )
  }

  hideShowProfileEditModal = () => {
    this.setState({
      showProfileEditModal: false
    })
  }

  renderProfileModal = () => {
    return (
      <Modal
        title="Provide your name"
        visible={this.state.showProfileEditModal}
        onOk={this.handleProfileRedirect}
        onCancel={this.hideShowProfileEditModal}
        okText="Go To Preferences"
        closable={false}
        confirmLoading={this.props.userStore!.changingName}
      >
        Hello, please provide your firstname/lastname in the preferences page.
      </Modal>
    )
  }

  render() {
    if (this.props.liveGameStore!.isTournamentModeOn) {
      // this.props.history.push('/app/game-area')
      console.log('------ TOURNAMENT GAME SET! Taking over UI')

      return <GameArea />
    }

    const { match } = this.props

    if (this.state.hasError) {
      return (
        <Layout className="student app page">
          <Layout.Content className="content" style={{ paddingLeft: 0 }}>
            <div className="inner">
              <div className="error-state container">
                <Icon type="exception" />
                <p className="exception-text">
                  An unexpected error was encountered.
                </p>
                <Button type="danger" onClick={this.handleReload}>
                  Reload Page
                </Button>
              </div>
            </div>
          </Layout.Content>
        </Layout>
      )
    }

    return (
      <Layout className="student app page">
        {this.renderProfileModal()}
        <Sidebar />
        <Switch>
          <Route
            exact={true}
            path={match.url + '/assignment'}
            component={Assignment}
          />
          <Route path={match.url + '/practice'} component={Practice} />
          <Route
            exact={true}
            path={match.url + '/blindbot'}
            component={Blindbot}
          />
          <Route
            exact={true}
            path={match.url + '/preferences'}
            component={User}
          />
          <Route path={match.url + '/game-area'} component={GameArea} />
          <Route path={match.url + '/sharebox'} component={Gamebox} />
          <Route path={`${match.url}/board`} component={AnalysisBoard} />
          <Route
            path={match.url + '/tournaments/:uuid'}
            component={TournamentViewWithRouter}
          />
          <Route
            path={match.url + '/tournaments'}
            component={StudentTournaments}
          />
          <Route component={Dashboard} />
        </Switch>
      </Layout>
    )
  }

  componentDidCatch(error: any, info: any) {
    console.log('--> I caught an error: ')
    console.log(error)
    console.log('--> INFO: ')
    console.log(info)

    this.props.mixpanelStore!.getMixpanel() &&
      this.props
        .mixpanelStore!.getMixpanel()
        .track('error', { error, info, path: this.props.location.pathname })
    this.setState({ hasError: true })
  }
}
