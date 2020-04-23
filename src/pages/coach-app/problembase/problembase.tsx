import * as React from 'react'
import { Layout, Menu, Icon } from 'antd'
import { RouteComponentProps, Switch, Route, Redirect } from 'react-router-dom'
import { PublicProblembases } from './public-problembases/public-problembases'
import { ProblembaseView } from './problembase-view/problembase-view'
import { MyProblembases } from './my-problembases/my-problembases'

const { Content } = Layout

interface Props extends RouteComponentProps<any> {}

export class Problembase extends React.Component<Props> {
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
      <Content className="problembase content">
        <Menu mode="horizontal" selectedKeys={[this.getSelectedItem()]}>
          <Menu.Item key="my" onClick={this.handleMenuClick('/my')}>
            My Problembases
          </Menu.Item>
          <Menu.Item key="public" onClick={this.handleMenuClick('/public')}>
            Public Problembases
          </Menu.Item>
        </Menu>
        <Switch>
          <Route
            exact={true}
            path={this.props.match.url + '/my'}
            component={MyProblembases}
          />
          <Route
            exact={true}
            path={this.props.match.url + '/my/:uuid'}
            component={ProblembaseView}
          />
          <Route
            exact={true}
            path={this.props.match.url + '/public'}
            component={PublicProblembases}
          />
          <Route
            exact={true}
            path={this.props.match.url + '/public/:uuid'}
            component={ProblembaseView}
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
