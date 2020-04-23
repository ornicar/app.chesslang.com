import * as React from 'react'
import {
  Route,
  Switch,
  withRouter,
  RouteComponentProps
} from 'react-router-dom'
import { inject, observer } from 'mobx-react'
import { Login } from './pages/login/login'
import { ResetPassword } from './pages/reset-password/reset-password'
import { Signup } from './pages/signup/signup'
import { NotFound } from './pages/not-found/not-found'
import { UserStore } from './stores/user'
import { StudentApp } from './pages/student-app/student-app'
import { CoachApp } from './pages/coach-app/coach-app'
import { MixpanelStore } from './stores/mixpanel'
import { autorun, toJS, reaction } from 'mobx'
import { InvitationStore } from './stores/invitation-store'
import { Button, notification } from 'antd'
import { PublicAnalysisBoard } from './pages/common-pages/analysis-board/public-analysis-board'

interface AppProps extends RouteComponentProps<any> {
  userStore?: UserStore
  mixpanelStore?: MixpanelStore
  invitationStore?: InvitationStore
}

@inject('userStore', 'mixpanelStore', 'invitationStore')
@observer
class WrappedApp extends React.Component<AppProps> {
  close = inviteId => {
    console.log(
      'Notification was closed. Either the close button was clicked or duration time elapsed.'
    )
    this.props.invitationStore.rejectInvitation(inviteId)
  }

  handleAcceptInviteOk = invitationDetails => {
    console.log('Accepted Invitation ', invitationDetails)
    this.props.invitationStore!.acceptInvitation(invitationDetails)
    this.props.history.push('/app/game-area')
  }

  openNotification = (inviteId, invitation) => {
    const inviteModelId = 'rematch'
    const btn = (
      <Button
        type="primary"
        size="small"
        onClick={() => {
          notification.close(inviteModelId)
          this.handleAcceptInviteOk(invitation)
        }}
      >
        Accept Invite
      </Button>
    )

    notification.open({
      message: 'Invitation from ' + invitation.inviteeName,
      description: `Wants to play a ${
        invitation.time
      } minute game. You play : ${invitation.color.toUpperCase()}`,
      placement: 'topRight',
      btn,
      key: inviteModelId,
      duration: 0,
      onClose: () => {
        this.close(inviteModelId)
      }
    })
  }

  closeNotification = (key, invitation) => {
    notification.close(key)
  }

  componentDidMount() {
    this.props.mixpanelStore!.init({
      uuid: this.props.userStore!.uuid,
      username: this.props.userStore!.username,
      role: this.props.userStore!.role,
      firstname: this.props.userStore!.firstname,
      lastname: this.props.userStore!.lastname
    })

    this.props.invitationStore!.onNewInvitation(this.openNotification)
    this.props.invitationStore!.onDeleteInvitation(this.closeNotification)
  }

  componentWillMount() {
    if (this.props.location.pathname === '/') {
      // do nothing
    }

    if (this.props.location.pathname.match(/^\/public-board.*/gi)) {
      // Allow public game view without login
    } else if (
      this.props.location.pathname.match(/^\/app.*/gi) &&
      !this.props.userStore!.isLoggedIn
    ) {
      // Protect the app routes
      this.props.history.push('/login')
    } else if (
      !this.props.location.pathname.match(/^\/app.*/gi) &&
      this.props.userStore!.uuid
    ) {
      // Already logged in
      this.props.history.push('/app')
    }
  }

  componentDidUpdate(prevProps: AppProps) {
    if (this.props.location !== prevProps.location) {
      this.props.mixpanelStore!.getMixpanel() &&
        this.props
          .mixpanelStore!.getMixpanel()
          .track('navigate', { path: this.props.location.pathname })
    }
  }

  render() {
    const InnerApp = (() => {
      if (this.props.userStore!.role === 'student') {
        return StudentApp
      }

      if (this.props.userStore!.role === 'coach') {
        return CoachApp
      }
    })()

    return (
      <Switch>
        <Route exact={true} path="/" component={Login} />
        <Route exact={true} path="/login" component={Login} />
        <Route exact={true} path="/reset-password" component={ResetPassword} />
        <Route exact={true} path="/signup" component={Signup} />
        <Route path="/app" component={InnerApp} />
        <Route
          exact={true}
          path="/public-board"
          component={PublicAnalysisBoard}
        />
        <Route component={NotFound} />
      </Switch>
    )
  }
}

export const App = withRouter(WrappedApp)
