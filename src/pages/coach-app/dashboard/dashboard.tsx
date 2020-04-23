import * as React from 'react'
import { Layout, Icon, Tooltip, Modal } from 'antd'
import { RouteComponentProps, withRouter } from 'react-router-dom'
import { UserStore } from '../../../stores/user'
import { MixpanelStore } from '../../../stores/mixpanel'
import { inject, observer } from 'mobx-react'

import './dashboard.less'
import { getFormattedMessage } from '../../../utils/utils'

const { Content } = Layout
interface Props extends RouteComponentProps<any> {
  userStore?: UserStore
  mixpanelStore?: MixpanelStore
}

@inject('userStore', 'mixpanelStore')
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
        'coachapp.dashboard.confirm_logout',
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
      <Content className="content coach dashboard">
        <div className="welcome-message">
          {getFormattedMessage('coachapp.dashboard.welcome', 'Welcome coach')}{' '}
          {profile.firstname}!
        </div>
        <div className="coach-apps">
          <Tooltip
            overlayClassName="big-tooltip"
            title={getFormattedMessage(
              'coachapp.dashboard.academy.description',
              'Manage your students, integrate and publish a customized website'
            )}
          >
            <div className="app" onClick={this.handleClick('/app/academy')}>
              <Icon type="home" />
              <span className="nav-text">
                {getFormattedMessage(
                  'coachapp.dashboard.academy.title',
                  'Academy'
                )}
              </span>
            </div>
          </Tooltip>

          <Tooltip
            overlayClassName="big-tooltip"
            title={getFormattedMessage(
              'coachapp.dashboard.assignment.description',
              'Assign homework and track progress down every single move of your students'
            )}
          >
            <div className="app" onClick={this.handleClick('/app/assignment')}>
              <Icon type="flag" />
              <span className="nav-text">
                {getFormattedMessage(
                  'coachapp.dashboard.assignment.title',
                  'Assignment'
                )}
              </span>
            </div>
          </Tooltip>

          <Tooltip overlayClassName="big-tooltip" title="Practice">
            <div className="app" onClick={this.handleClick('/app/practice')}>
              <Icon type="fire" />
              <span className="nav-text">Practice</span>
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
              'coachapp.dashboard.sharebox.description',
              'Collaboration with shared databases'
            )}
          >
            <div className="app" onClick={this.handleClick('/app/sharebox')}>
              <Icon type="inbox" />
              <span className="nav-text">
                {getFormattedMessage(
                  'coachapp.dashboard.sharebox.title',
                  'Sharebox'
                )}
              </span>
            </div>
          </Tooltip>

          <Tooltip
            overlayClassName="big-tooltip"
            title={getFormattedMessage(
              'coachapp.dashboard.problembase.description',
              'Select from a huge range of problems, hand picked for beginners to advanced'
            )}
          >
            <div className="app" onClick={this.handleClick('/app/problembase')}>
              <Icon type="table" />
              <span className="nav-text">
                {getFormattedMessage(
                  'coachapp.dashboard.problembase.title',
                  'Problembase'
                )}
              </span>
            </div>
          </Tooltip>

          <Tooltip
            overlayClassName="big-tooltip"
            title="Create and access games of your own or from our huge collection"
          >
            <div className="app" onClick={this.handleClick('/app/gamebase')}>
              <Icon type="database" />
              <span className="nav-text">
                {getFormattedMessage(
                  'coachapp.dashboard.gamebase.title',
                  'Gamebase'
                )}
              </span>
            </div>
          </Tooltip>

          <Tooltip
            overlayClassName="big-tooltip"
            title={getFormattedMessage(
              'coachapp.dashboard.game_area.description',
              'Play games with members of your academy'
            )}
          >
            <div className="app" onClick={this.handleClick('/app/game-area')}>
              <Icon type="play-square" />
              <span className="nav-text">
                {getFormattedMessage(
                  'coachapp.dashboard.game_area.title',
                  'Game Area'
                )}
              </span>
            </div>
          </Tooltip>

          <Tooltip title="Improve your visualization skills by playing blindfold">
            <div className="app" onClick={this.handleClick('/app/blindbot')}>
              <Icon type="eye" />
              <span className="nav-text">
                {getFormattedMessage(
                  'coachapp.dashboard.blindbot.title',
                  'Blindbot'
                )}
              </span>
            </div>
          </Tooltip>

          <Tooltip
            overlayClassName="big-tooltip"
            title={getFormattedMessage(
              'coachapp.dashboard.reports.description',
              'Student Reports'
            )}
          >
            <div className="app" onClick={this.handleClick('/app/reports')}>
              <Icon type="bar-chart" />
              <span className="nav-text">
                {getFormattedMessage(
                  'coachapp.dashboard.reports.title',
                  'Reports'
                )}
              </span>
            </div>
          </Tooltip>

          <Tooltip
            overlayClassName="big-tooltip"
            title={getFormattedMessage(
              'coachapp.dashboard.settings.description',
              'Enhance your experience by listing out your preferences'
            )}
          >
            <div className="app" onClick={this.handleClick('/app/preferences')}>
              <Icon type="setting" />
              <span className="nav-text">
                {getFormattedMessage(
                  'coachapp.dashboard.settings.title',
                  'Settings'
                )}
              </span>
            </div>
          </Tooltip>

          <Tooltip
            title={getFormattedMessage(
              'coachapp.dashboard.tournaments.description',
              'Tournaments'
            )}
          >
            <div className="app" onClick={this.handleClick('/app/tournaments')}>
              <Icon type="usergroup-add" />
              <span className="nav-text">
                {getFormattedMessage(
                  'coachapp.dashboard.tournaments.title',
                  'Tournaments'
                )}
              </span>
            </div>
          </Tooltip>

          <Tooltip
            title={getFormattedMessage(
              'coachapp.dashboard.logout.description',
              'End the login session'
            )}
          >
            <div className="app" onClick={this.confirmLogout}>
              <Icon type="logout" />
              <span className="nav-text">
                {getFormattedMessage(
                  'coachapp.dashboard.logout.title',
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
