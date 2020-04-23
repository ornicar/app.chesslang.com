import * as React from 'react'
import { Layout, Table, Row, Col } from 'antd'
import { RouteComponentProps, Switch, Route, Redirect } from 'react-router-dom'

import './gameArea.less'
import { InvitationPage } from './invitation-page/invitation-page'
import GameBoard from './game-board/game-board'
import { inject, observer } from 'mobx-react'
import { InvitationStore } from '../../../stores/invitation-store'
import { LiveGameStore } from '../../../stores/live-game'

const { Content } = Layout

interface Props extends RouteComponentProps<any> {
  invitationStore?: InvitationStore
  liveGameStore?: LiveGameStore
}

@inject('invitationStore', 'liveGameStore')
@observer
export class GameArea extends React.Component<Props> {
  handleMenuClick = (link: string) => () => {
    this.props.history.push(this.props.match.url + link)
  }

  getSelectedItem = () => {
    // if (this.props.location.pathname.indexOf('/my') >= 0) {
    //   return 'my'
    // }

    // if (this.props.location.pathname.indexOf('/shared-with-me') >= 0) {
    //   return 'shared-with-me'
    // }

    return ''
  }

  inviteOpponent = (uuid: any) => {
    console.log('Invite opponent: ', uuid)
  }

  componentDidMount() {
    document
      .querySelector('meta[name="viewport"]')!
      .setAttribute('content', 'width=device-width, initial-scale=1.0')

    this.props.invitationStore!.getStatisticsInfo()
  }

  componentWillUnmount() {
    document.querySelector('meta[name="viewport"]')!.setAttribute('content', '')
  }

  render() {
    console.log(this.props.liveGameStore!.currentGameId)

    var innerContent = null
    if (this.props.liveGameStore!.currentGameId) {
      innerContent = (
        <GameBoard gameId={this.props.liveGameStore!.currentGameId} />
      )
    } else {
      innerContent = <InvitationPage />
    }

    return <Content className={`game-area content`}>{innerContent}</Content>
  }
}
