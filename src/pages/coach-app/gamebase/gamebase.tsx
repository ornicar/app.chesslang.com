import * as React from 'react'
import { Layout, Menu, Icon } from 'antd'
import { RouteComponentProps, Switch, Route, Redirect } from 'react-router-dom'

import { MyGamebases } from './my-gamebases/my-gamebases'
import { PublicGamebases } from './public-gamebases/public-gamebases'
import { GamebaseViewer } from './gamebase-viewer/gamebase-viewer'
import { GameViewer } from './game-viewer/game-viewer'

const { Content } = Layout

interface Props extends RouteComponentProps<any> {}

export class Gamebase extends React.Component<Props> {
  handleMenuClick = (link: string) => () => {
    this.props.history.push(this.props.match.url + link)
  }

  getSelectedItem = () => {
    if (this.props.location.pathname.indexOf('/my') >= 0) {
      return 'my'
    }

    if (this.props.location.pathname.indexOf('/public') >= 0) {
      return 'public'
    }

    return ''
  }

  componentDidMount() {
    document
      .querySelector('meta[name="viewport"]')!
      .setAttribute('content', 'width=device-width, initial-scale=1.0')
  }

  componentWillUnmount() {
    document.querySelector('meta[name="viewport"]')!.setAttribute('content', '')
  }

  render() {
    return (
      <Content className="gamebase content">
        <Menu mode="horizontal" selectedKeys={[this.getSelectedItem()]}>
          <Menu.Item key="my" onClick={this.handleMenuClick('/my')}>
            My Gamebases
          </Menu.Item>
          <Menu.Item key="public" onClick={this.handleMenuClick('/public')}>
            Public Gamebases
          </Menu.Item>
        </Menu>
        <Switch>
          <Route
            exact={true}
            path={this.props.match.url + '/my'}
            component={MyGamebases}
          />
          <Route
            exact={true}
            path={this.props.match.url + '/my/:uuid'}
            component={GamebaseViewer}
          />
          <Route
            exact={true}
            path={this.props.match.url + '/my/:gamebaseUuid/:uuid'}
            component={GameViewer}
          />
          <Route
            exact={true}
            path={this.props.match.url + '/public'}
            component={PublicGamebases}
          />
          <Route
            exact={true}
            path={this.props.match.url + '/public/:uuid'}
            component={GamebaseViewer}
          />
          <Route
            exact={true}
            path={this.props.match.url + '/public/:gamebaseUuid/:uuid'}
            component={GameViewer}
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
