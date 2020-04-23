import * as React from 'react'
import { Layout, Menu } from 'antd'
import { RouteComponentProps, Switch, Route, Redirect } from 'react-router'

import { Exercise } from './exercise/exercise'
import { Assigned } from './assigned/assigned'

const { Content } = Layout

interface Props extends RouteComponentProps<any> {}

export class Assignment extends React.Component<Props> {
  handleMenuClick = (link: string) => () => {
    this.props.history.push(this.props.match.url + link)
  }

  getSelectedItem = () => {
    if (this.props.location.pathname.indexOf('/exercise') >= 0) {
      return 'exercise'
    }

    if (this.props.location.pathname.indexOf('/assigned') >= 0) {
      return 'assigned'
    }

    return ''
  }

  render() {
    return (
      <Content className="assignment content">
        <Menu mode="horizontal" selectedKeys={[this.getSelectedItem()]}>
          <Menu.Item key="exercise" onClick={this.handleMenuClick('/exercise')}>
            Exercise
          </Menu.Item>
          <Menu.Item key="assigned" onClick={this.handleMenuClick('/assigned')}>
            Assigned
          </Menu.Item>
        </Menu>
        <Switch>
          <Route
            exact={true}
            path={this.props.match.url + '/exercise'}
            component={Exercise}
          />
          <Route
            exact={true}
            path={this.props.match.url + '/assigned'}
            component={Assigned}
          />
          <Redirect
            from={this.props.match.url}
            to={this.props.match.url + '/exercise'}
          />
        </Switch>
      </Content>
    )
  }
}
