import * as React from 'react'
import { Layout, Icon, Tooltip, Badge, Modal } from 'antd'
import { RouteComponentProps, withRouter } from 'react-router-dom'
import { UserStore } from '../../../stores/user'
import { inject, observer } from 'mobx-react'

import './dashboard.less'
import { StudentAssignmentStore } from '../../../stores/student-assignment'
import { MixpanelStore } from '../../../stores/mixpanel'
import { getFormattedMessage } from '../../../utils/utils'

const { Content } = Layout
interface Props extends RouteComponentProps<any> {
  userStore?: UserStore
  studentAssignmentStore?: StudentAssignmentStore
  mixpanelStore?: MixpanelStore
}

@inject('userStore', 'studentAssignmentStore', 'mixpanelStore')
@observer
class WrappedDashboard extends React.Component<Props> {
  handleClick = (link: string) => (e: any) => {
    this.props.history.push(link)
  }

  componentDidMount() {
    this.props.userStore!.loadProfile()

    document.querySelector('.app-sidebar')!.style!.display = 'none'

    document
      .querySelector('meta[name="viewport"]')!
      .setAttribute('content', 'width=device-width, initial-scale=1.0')
  }

  componentWillUnmount() {
    document.querySelector('.app-sidebar')!.style!.display = 'block'

    document.querySelector('meta[name="viewport"]')!.setAttribute('content', '')
  }

  handleLogout = () => {
    this.props.mixpanelStore!.getMixpanel() &&
      this.props
        .mixpanelStore!.getMixpanel()
        .track('logout', { pathname: this.props.location.pathname })
    setTimeout(() => {
      this.props.userStore!.logout()
      this.props.history.push('/login')
    }, 300)
  }

  confirmLogout = () => {
    Modal.confirm({
      title: getFormattedMessage(
        'studentapp.dashboard.confirm_logout',
        'Are you sure you want to logout?'
      ),
      iconType: 'logout',
      okType: 'danger',
      onOk: () => this.handleLogout(),
      onCancel: () => {
        /* noop */
      }
    })
  }

  render() {
    if (this.props.userStore!.profileLoading) {
      return (
        <div className="profile section">
          <Icon type="loading" spin={true} />
        </div>
      )
    }
    const profile = this.props.userStore!.profile!
    return (
      <Content className="content student dashboard">
        <div className="welcome-message">
          {getFormattedMessage('studentapp.dashboard.welcome', 'Welcome')}{' '}
          {profile.firstname}!
        </div>
        <div className="student-apps">
          <Tooltip
            title={getFormattedMessage(
              'studentapp.dashboard.assignment.description',
              'Solve exercises and improve'
            )}
          >
            <div className="app" onClick={this.handleClick('/app/assignment')}>
              <span>
                <Icon type="flag" />{' '}
                {this.props.userStore!.role === 'student' && (
                  <Badge
                    count={this.props.studentAssignmentStore!.unsolvedCount}
                    style={{
                      fontSize: 10,
                      marginTop: -40,
                      marginLeft: -15
                    }}
                  />
                )}
              </span>
              <span className="nav-text">
                {getFormattedMessage(
                  'studentapp.dashboard.assignment.title',
                  'Assignment'
                )}
              </span>
            </div>
          </Tooltip>

          <Tooltip
            overlayClassName="big-tooltip"
            title="Chess Board for analysis"
          >
            <div className="app" onClick={this.handleClick('/app/board')}>
              <Icon type="appstore" />
              <span className="nav-text">Board</span>
            </div>
          </Tooltip>
          <Tooltip
            overlayClassName="big-tooltip"
            title={getFormattedMessage(
              'studentapp.dashboard.sharebox.description',
              'Collaboration with shared databases'
            )}
          >
            <div className="app" onClick={this.handleClick('/app/sharebox')}>
              <Icon type="inbox" />
              <span className="nav-text">
                {getFormattedMessage(
                  'studentapp.dashboard.sharebox.title',
                  'Sharebox'
                )}
              </span>
            </div>
          </Tooltip>
          <Tooltip title="Boost your inner chess fire with unlimited practise">
            <div className="app" onClick={this.handleClick('/app/practice')}>
              <Icon type="fire" />
              <span className="nav-text">
                {getFormattedMessage(
                  'studentapp.dashboard.practice.title',
                  'Practice'
                )}
              </span>
            </div>
          </Tooltip>
          <Tooltip
            overlayClassName="big-tooltip"
            title={getFormattedMessage(
              'studentapp.dashboard.blindbot.description',
              'Improve your visualization skills by playing blindfold'
            )}
          >
            <div className="app" onClick={this.handleClick('/app/blindbot')}>
              <Icon type="eye" />
              <span className="nav-text">
                {getFormattedMessage(
                  'studentapp.dashboard.blindbot.title',
                  'Blindbot'
                )}
              </span>
            </div>
          </Tooltip>
          <Tooltip
            overlayClassName="big-tooltip"
            title={getFormattedMessage(
              'studentapp.dashboard.game_area.description',
              'Play games with members of your academy'
            )}
          >
            <div className="app" onClick={this.handleClick('/app/game-area')}>
              <Icon type="play-square" />
              <span className="nav-text">
                {getFormattedMessage(
                  'studentapp.dashboard.game_area.title',
                  'Game Area'
                )}
              </span>
            </div>
          </Tooltip>

          <Tooltip
            title={getFormattedMessage(
              'studentapp.dashboard.tournaments.description',
              'Tournaments'
            )}
          >
            <div className="app" onClick={this.handleClick('/app/tournaments')}>
              <Icon type="usergroup-add" />
              <span className="nav-text">
                {getFormattedMessage(
                  'studentapp.dashboard.tournaments.title',
                  'Tournaments'
                )}
              </span>
            </div>
          </Tooltip>

          <Tooltip
            overlayClassName="big-tooltip"
            title={getFormattedMessage(
              'studentapp.dashboard.settings.description',
              'Enhance your experience by listing out your preferences'
            )}
          >
            <div className="app" onClick={this.handleClick('/app/preferences')}>
              <Icon type="setting" />
              <span className="nav-text">
                {getFormattedMessage(
                  'studentapp.dashboard.settings.title',
                  'Settings'
                )}
              </span>
            </div>
          </Tooltip>
          <Tooltip
            title={getFormattedMessage(
              'studentapp.dashboard.logout.description',
              'End the login session'
            )}
          >
            <div className="app" onClick={this.confirmLogout}>
              <Icon type="logout" />
              <span className="nav-text">
                {getFormattedMessage(
                  'studentapp.dashboard.logout.title',
                  'Logout'
                )}
              </span>
            </div>
          </Tooltip>
        </div>
      </Content>
    )
  }
}

export const Dashboard = withRouter(WrappedDashboard)
