import * as React from 'react'
import { Layout, Menu, Icon, Badge, Modal, Carousel } from 'antd'
import { observer, inject } from 'mobx-react'
import { withRouter, RouteComponentProps } from 'react-router-dom'

import './sidebar.less'
import { UserStore } from '../../stores/user'
import { MixpanelStore } from '../../stores/mixpanel'
import { AnnouncementStore } from '../../stores/announcements'
import Announcements from '../announcements/announcements'

const { Sider } = Layout

interface SidebarProps extends RouteComponentProps<any> {
  userStore?: UserStore
  studentAssignmentStore?: StudentAssignmentStore
  mixpanelStore?: MixpanelStore
  announcementStore?: AnnouncementStore
}

interface State {
  visible: boolean
}

@inject(
  'userStore',
  'studentAssignmentStore',
  'mixpanelStore',
  'announcementStore'
)
@observer
class WrappedSidebar extends React.Component<SidebarProps, State> {
  state = {
    visible: window.innerWidth > 576
  }

  componentDidMount() {
    window.addEventListener('resize', () => {
      if (window.innerWidth > 576 && !this.state.visible) {
        this.setState({
          visible: true
        })
      } else if (window.innerWidth <= 576 && this.state.visible) {
        this.setState({
          visible: false
        })
      }
    })
  }

  openAnnouncements = () => {
    this.props.announcementStore!.setVisible(true)
  }

  toggle = () => {
    this.setState({
      visible: !this.state.visible
    })
  }

  get sidebarOffset() {
    return this.state.visible ? 80 : 0
  }

  handleClick = (link: string) => (e: any) => {
    this.props.history.push(link)
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
      title: 'Are you sure you want to logout?',
      iconType: 'logout',
      okType: 'danger',
      onOk: () => this.handleLogout(),
      onCancel: () => {
        /* noop */
      }
    })
  }

  getSelectedMenuItem = () => {
    if (this.props.location.pathname.startsWith('/app/academy')) {
      return 'academy'
    }

    if (this.props.location.pathname.startsWith('/app/assignment')) {
      return 'assignment'
    }

    if (this.props.location.pathname.startsWith('/app/gamebase')) {
      return 'gamebase'
    }

    if (this.props.location.pathname.startsWith('/app/problembase')) {
      return 'problembase'
    }

    if (this.props.location.pathname.startsWith('/app/preferences')) {
      return 'preferences'
    }

    if (this.props.location.pathname.startsWith('/app/user')) {
      return 'user'
    }

    if (this.props.location.pathname.startsWith('/app/payment')) {
      return 'payment'
    }

    if (this.props.location.pathname.startsWith('/app/practice')) {
      return 'practice'
    }

    if (this.props.location.pathname.startsWith('/app/blindbot')) {
      return 'blindbot'
    }

    if (this.props.location.pathname.startsWith('/app/sharebox')) {
      return 'sharebox'
    }
    if (this.props.location.pathname.startsWith('/app/reports')) {
      return 'reports'
    }

    if (this.props.location.pathname.startsWith('/app/game-area')) {
      return 'game-area'
    }

    if (this.props.location.pathname.startsWith('/app/board')) {
      return 'board'
    }

    if (this.props.location.pathname.startsWith('/app/tournaments')) {
      return 'tournaments'
    }

    return 'dashboard'
  }

  renderForRoles = (allowedRoles: string[], component: any) => {
    return allowedRoles.indexOf(this.props.userStore!.role) >= 0
      ? component
      : null
  }

  render() {
    const iconStyle = {
      marginTop: 8,
      fontSize: 26,
      marginLeft: -4
    }

    return (
      <div
        className="app-sidebar"
        style={{ width: this.sidebarOffset ? this.sidebarOffset + 4 : 0 }}
      >
        <Announcements />
        <Sider
          collapsedWidth={this.sidebarOffset}
          collapsed={true}
          className="sidebar"
        >
          <Menu
            className="sidebar-menu no-scrollbar"
            theme="dark"
            selectedKeys={[this.getSelectedMenuItem()]}
          >
            <Menu.Item
              key="dashboard"
              onClick={this.handleClick('/app/dashboard')}
            >
              <Icon type="dashboard" style={iconStyle} />
              <span className="nav-text">Dashboard</span>
            </Menu.Item>
            {this.renderForRoles(
              ['coach'],
              <Menu.Item
                key="academy"
                onClick={this.handleClick('/app/academy')}
              >
                <Icon type="home" style={iconStyle} />
                <span className="nav-text">Academy</span>
              </Menu.Item>
            )}
            {this.renderForRoles(
              ['coach', 'student'],
              <Menu.Item
                key="assignment"
                onClick={this.handleClick('/app/assignment')}
              >
                <Icon type="flag" style={iconStyle} />
                <span className="nav-text">
                  {`Assignment`}&nbsp;&nbsp;&nbsp;
                </span>
                {this.props.userStore!.role === 'student' && (
                  <Badge
                    count={this.props.studentAssignmentStore!.unsolvedCount}
                    style={{
                      fontSize: 10,
                      marginLeft: -5
                    }}
                  />
                )}
              </Menu.Item>
            )}
            {this.renderForRoles(
              ['coach', 'student'],
              <Menu.Item key="board" onClick={this.handleClick('/app/board')}>
                <Icon type="appstore" style={iconStyle} />
                <span className="nav-text">Board</span>
              </Menu.Item>
            )}

            {this.renderForRoles(
              ['coach'],
              <Menu.Item
                key="gamebase"
                onClick={this.handleClick('/app/gamebase')}
              >
                <Icon type="database" style={iconStyle} />
                <span className="nav-text">Gamebase</span>
              </Menu.Item>
            )}
            {this.renderForRoles(
              ['coach'],
              <Menu.Item
                key="problembase"
                onClick={this.handleClick('/app/problembase')}
              >
                <Icon type="table" style={iconStyle} />
                <span className="nav-text">Problembase</span>
              </Menu.Item>
            )}
            {this.renderForRoles(
              ['admin'],
              <Menu.Item key="user" onClick={this.handleClick('/app/user')}>
                <Icon type="team" style={iconStyle} />
                <span className="nav-text">Users</span>
              </Menu.Item>
            )}
            {this.renderForRoles(
              ['admin'],
              <Menu.Item
                key="payment"
                onClick={this.handleClick('/app/payment')}
              >
                <Icon type="dollar" style={iconStyle} />
                <span className="nav-text">Payment</span>
              </Menu.Item>
            )}
            {this.renderForRoles(
              ['student', 'coach'],
              <Menu.Item
                key="practice"
                onClick={this.handleClick('/app/practice')}
              >
                <Icon type="fire" style={iconStyle} />
                <span className="nav-text">Practice</span>
              </Menu.Item>
            )}
            {this.renderForRoles(
              ['coach', 'student'],
              <Menu.Item
                key="blindbot"
                onClick={this.handleClick('/app/blindbot')}
              >
                <Icon type="eye" style={iconStyle} />
                <span className="nav-text">Blindbot</span>
              </Menu.Item>
            )}
            {this.renderForRoles(
              ['coach', 'student'],
              <Menu.Item
                key="sharebox"
                onClick={this.handleClick('/app/sharebox')}
              >
                <Icon type="inbox" style={iconStyle} />
                <span className="nav-text">Sharebox</span>
              </Menu.Item>
            )}
            {this.renderForRoles(
              ['coach'],
              <Menu.Item
                key="reports"
                onClick={this.handleClick('/app/reports')}
              >
                <Icon type="bar-chart" style={iconStyle} />
                <span className="nav-text">Reports</span>
              </Menu.Item>
            )}
            {this.renderForRoles(
              ['coach', 'student'],
              <Menu.Item
                key="game-area"
                onClick={this.handleClick('/app/game-area')}
              >
                <Icon type="play-square" style={iconStyle} />
                <span className="nav-text">Game Area</span>
              </Menu.Item>
            )}
            {/* <Menu.Item key="notification" className="notification-item">
              <Icon type="bell" style={iconStyle} />
              <span className="nav-text">Notifications</span>
            </Menu.Item> */}
            {/* {this.renderForRoles(
              ['coach'],
              <Menu.Item
                key="announcement"
                className="announcement-item"
                onClick={this.openAnnouncements}
              >
                <Icon type="notification" theme="outlined" style={iconStyle} />
                <span className="nav-text">Announcements</span>
              </Menu.Item>
            )} */}
            {this.renderForRoles(
              ['coach', 'student'],
              <Menu.Item
                key="tournaments"
                onClick={this.handleClick('/app/tournaments')}
              >
                <Icon type="usergroup-add" theme="outlined" style={iconStyle} />
                <span className="nav-text">Tournaments</span>
              </Menu.Item>
            )}
            {this.renderForRoles(
              ['coach', 'student'],
              <Menu.Item
                key="preferences"
                className="preferences-item"
                onClick={this.handleClick('/app/preferences')}
              >
                <Icon type="setting" theme="filled" style={iconStyle} />
                <span className="nav-text">Preferences</span>
              </Menu.Item>
            )}
            <Menu.Item
              key="logout"
              className="logout-item"
              onClick={this.confirmLogout}
            >
              <Icon type="logout" theme="outlined" style={iconStyle} />
              <span className="nav-text">Logout</span>
            </Menu.Item>
          </Menu>
        </Sider>
        <Icon
          type={this.state.visible ? 'menu-fold' : 'menu-unfold'}
          className="hamburger"
          style={{ marginLeft: this.sidebarOffset }}
          onClick={this.toggle}
        />
      </div>
    )
  }
}

export const Sidebar = withRouter(WrappedSidebar)
