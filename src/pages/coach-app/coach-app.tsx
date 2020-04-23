import * as React from 'react'
import { Layout, Icon, Button } from 'antd'
import { Route, RouteComponentProps, Switch, Redirect } from 'react-router-dom'
import { inject, observer } from 'mobx-react'

import { Sidebar } from '../../components/sidebar/sidebar'

import { User } from '../user/user'
import { Academy } from './academy/academy'
import { Assignment } from './assignment/assignment'
import { Gamebase } from './gamebase/gamebase'
import { Problembase } from './problembase/problembase'
import { GameArea } from '../common-pages/gameArea/gameArea'
import { Dashboard } from './dashboard/dashboard'
import { MixpanelStore } from '../../stores/mixpanel'
import { Gamebox } from './gamebox/gamebox'
import Analytics from './analytics/analytics'
import { Blindbot } from '../student-app/blindbot/blindbot'
import { AnalysisBoard } from '../common-pages/analysis-board/analysis-board'
import CreateTournamentForm from './tournaments/create-tournament-form'
import TournamentViewWithRouter from '../../components/tournaments/tournament-view'
import TournamentListingWithRouter from './tournaments/tournament-listing'
import { UserStore } from '../../stores/user'
import { Practice } from '../student-app/practice/practice'

interface Props extends RouteComponentProps<any> {
  mixpanelStore?: MixpanelStore
  userStore?: UserStore
}

interface State {
  hasError: boolean
}

@inject('mixpanelStore', 'userStore')
@observer
export class CoachApp extends React.Component<Props, State> {
  state = {
    hasError: false
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    const { match } = this.props

    if (this.state.hasError) {
      return (
        <Layout className="coach app page">
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
      <Layout className="coach app page">
        <Sidebar />
        <Switch>
          <Route path={match.url + '/academy'} component={Academy} />
          <Route path={match.url + '/assignment'} component={Assignment} />
          <Route path={match.url + '/practice'} component={Practice} />
          <Route
            exact={true}
            path={match.url + '/preferences'}
            component={User}
          />
          <Route path={`${match.url}/board`} component={AnalysisBoard} />

          <Route
            exact={true}
            path={match.url + '/blindbot'}
            component={Blindbot}
          />

          <Route path={match.url + '/gamebase'} component={Gamebase} />
          <Route path={match.url + '/sharebox'} component={Gamebox} />
          <Route path={match.url + '/problembase'} component={Problembase} />
          <Route path={match.url + '/reports'} component={Analytics} />
          <Route path={match.url + '/game-area'} component={GameArea} />

          <Route
            path={match.url + '/tournaments/create'}
            component={CreateTournamentForm}
          />
          <Route
            path={match.url + '/tournaments/:uuid/edit'}
            component={CreateTournamentForm}
          />
          <Route
            path={match.url + '/tournaments/:uuid'}
            component={TournamentViewWithRouter}
          />
          <Route
            path={match.url + '/tournaments'}
            component={TournamentListingWithRouter}
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
