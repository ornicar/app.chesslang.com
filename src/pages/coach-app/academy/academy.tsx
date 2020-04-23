import * as React from 'react'
import * as R from 'ramda'
import { Layout, Menu, Icon } from 'antd'
import { inject, observer } from 'mobx-react'
import { RouteComponentProps, Switch, Route, Redirect } from 'react-router-dom'

import './academy.less'

import { CreateAcademyForm } from './create-academy-form/create-academy-form'
import { Calendar } from './calendar/calendar'
import { Announcements } from './announcements/announcements'
import { Groups } from './groups/groups'
import { Integration } from './integration/integration'
import { Students } from './students/students'
import { Payment } from './payment/payment'
import { Website } from './website/website'

import { AcademyStore } from '../../../stores/academy'
import { States } from '../../../components/states/states'
import { StudentsGroupsStore } from '../../../stores/students-groups'
import Settings from './settings/Settings'

const { Content } = Layout

interface Props extends RouteComponentProps<any> {
  academyStore?: AcademyStore
  studentsGroupsStore?: StudentsGroupsStore
}

@inject('academyStore', 'studentsGroupsStore')
@observer
export class Academy extends React.Component<Props> {
  componentDidMount() {
    this.props.academyStore!.load()
    this.props.studentsGroupsStore!.load()
  }

  handleMenuClick = (link: string) => () => {
    this.props.history.push(this.props.match.url + link)
  }

  handleRetry() {
    this.props.academyStore!.load()
    this.props.studentsGroupsStore!.load()
  }

  getSelectedItem = () => {
    if (this.props.location.pathname.indexOf('/calendar') >= 0) {
      return 'calendar'
    }

    if (this.props.location.pathname.indexOf('/announcements') >= 0) {
      return 'announcements'
    }

    if (this.props.location.pathname.indexOf('/students') >= 0) {
      return 'students'
    }

    if (this.props.location.pathname.indexOf('/groups') >= 0) {
      return 'groups'
    }

    //if (this.props.location.pathname.indexOf('/integration') >= 0) {
    //  return 'integration'
    //}

    if (this.props.location.pathname.indexOf('/website') >= 0) {
      return 'website'
    }

    if (this.props.location.pathname.indexOf('/payment') >= 0) {
      return 'payment'
    }

    return ''
  }

  renderAcademyPage() {
    return (
      <>
        <Menu mode="horizontal" selectedKeys={[this.getSelectedItem()]}>
          <Menu.Item key="students" onClick={this.handleMenuClick('/students')}>
            Students
          </Menu.Item>
          <Menu.Item key="groups" onClick={this.handleMenuClick('/groups')}>
            Groups
          </Menu.Item>
          <Menu.Item key="settings" onClick={this.handleMenuClick('/settings')}>
            Settings
          </Menu.Item>
          {/* <Menu.Item
            key="integration"
            onClick={this.handleMenuClick('/integration')}
          >
            Integration{' '}
            {R.keys(this.props.studentsGroupsStore!.students).length <= 1 && (
              <Icon type="lock" theme="filled" />
            )}
          </Menu.Item> */}
          {/* <Menu.Item key="website" onClick={this.handleMenuClick('/website')}>
            Website
          </Menu.Item> */}
          {/* <Menu.Item key="payment" onClick={this.handleMenuClick('/payment')}>
            Payment
          </Menu.Item> */}
          {/* <Menu.Item key="calendar" onClick={this.handleMenuClick('/calendar')}>Calendar</Menu.Item>
	  <Menu.Item key="announcements" onClick={this.handleMenuClick('/announcements')}>Announcements</Menu.Item> */}
        </Menu>
        <Switch>
          {/* <Route exact={true} path={this.props.match.url + '/calendar'} component={Calendar} />
	  <Route exact={true} path={this.props.match.url + '/announcements'} component={Announcements} /> */}
          <Route
            exact={true}
            path={this.props.match.url + '/students'}
            component={Students}
          />
          <Route
            exact={true}
            path={this.props.match.url + '/groups'}
            component={Groups}
          />
          {/* <Route
            exact={true}
            path={this.props.match.url + '/integration'}
            component={Integration}
          /> */}
          <Route
            exact={true}
            path={this.props.match.url + '/website'}
            component={Website}
          />
          <Route
            exact={true}
            path={this.props.match.url + '/payment'}
            component={Payment}
          />
          <Route
            exact={true}
            path={this.props.match.url + '/settings'}
            component={Settings}
          />
          <Redirect
            from={this.props.match.url}
            to={this.props.match.url + '/students'}
          />
        </Switch>
      </>
    )
  }

  render() {
    const academy = this.props.academyStore!.academy

    if (
      this.props.academyStore!.loading ||
      this.props.studentsGroupsStore!.loading
    ) {
      return (
        <Content className="academy content">
          <div className="inner">
            <States type="loading" />
          </div>
        </Content>
      )
    }

    if (
      this.props.academyStore!.error ||
      this.props.studentsGroupsStore!.error
    ) {
      return (
        <Content className="academy content">
          <div className="inner">
            <States
              type="error"
              exceptionText={
                this.props.academyStore!.error ||
                this.props.studentsGroupsStore!.error
              }
              onClick={this.handleRetry}
            />
          </div>
        </Content>
      )
    }

    return (
      <Content className="academy content">
        {academy ? (
          this.renderAcademyPage()
        ) : (
          <div className="form-container">
            <CreateAcademyForm />
          </div>
        )}
      </Content>
    )
  }
}
