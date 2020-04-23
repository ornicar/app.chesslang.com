import * as React from 'react'
import { Layout } from 'antd'
import { RouteComponentProps, Switch, Route } from 'react-router-dom'

import { ItemList } from './item-list/item-list'
import { Play } from './play/play'

const { Content } = Layout

interface Props extends RouteComponentProps<any> {}

export class Practice extends React.Component<Props> {
  render() {
    return (
      <Content className="practice content">
        <Switch>
          <Route
            exact={true}
            path={this.props.match.url + '/'}
            component={ItemList}
          />
          <Route
            exact={true}
            path={this.props.match.url + '/play/:uuid'}
            component={Play}
          />
        </Switch>
      </Content>
    )
  }
}
