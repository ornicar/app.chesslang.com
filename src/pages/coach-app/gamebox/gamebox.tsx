import * as React from 'react'
import { Layout, Menu, Icon } from 'antd'
import { RouteComponentProps, Switch, Route, Redirect } from 'react-router-dom'

import './gamebox.less'

import { MyDatabases } from './my-databases/my-databases'
import { SharedWithMe } from './shared-with-me/shared-with-me'

const { Content } = Layout

interface Props extends RouteComponentProps<any> {}

export class Gamebox extends React.Component<Props> {
  handleMenuClick = (link: string) => () => {
    this.props.history.push(this.props.match.url + link)
  }

  getSelectedItem = () => {
    if (this.props.location.pathname.indexOf('/my') >= 0) {
      return 'my'
    }

    if (this.props.location.pathname.indexOf('/shared-with-me') >= 0) {
      return 'shared-with-me'
    }

    return ''
  }

  render() {
    return (
      <Content className="gamebox content">
        <Menu mode="horizontal" selectedKeys={[this.getSelectedItem()]}>
          <Menu.Item key="my" onClick={this.handleMenuClick('/my')}>
            My Databases
          </Menu.Item>
          <Menu.Item
            key="shared-with-me"
            onClick={this.handleMenuClick('/shared-with-me')}
          >
            Shared With Me
          </Menu.Item>
        </Menu>
        <Switch>
          <Route
            exact={true}
            path={this.props.match.url + '/my'}
            component={MyDatabases}
          />
          <Route
            exact={true}
            path={this.props.match.url + '/shared-with-me'}
            component={SharedWithMe}
          />
          <Redirect
            from={this.props.match.url}
            to={this.props.match.url + '/my'}
          />
        </Switch>
      </Content>
    )
  }
}
