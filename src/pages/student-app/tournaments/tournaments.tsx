import React, { Component } from 'react'
import { Layout, Row, Col, Button, Table, Divider, List, Skeleton } from 'antd'
import { StudentTournamentStore } from '../../../stores/student-tournaments'
import { observer, inject } from 'mobx-react'
import moment from 'moment-timezone'

import './tournaments.less'
import { Link } from 'react-router-dom'

interface Props {
  studentTournamentStore?: StudentTournamentStore
}

@inject('studentTournamentStore')
@observer
export default class StudentTournaments extends Component<Props> {
  componentDidMount() {
    this.props.studentTournamentStore!.load()
  }

  handleJoinTournament = (record: any) => {
    this.props.studentTournamentStore!.joinTournament(record.uuid)
  }

  handleExitTournament = (record: any) => {
    this.props.studentTournamentStore!.exitTournament(record.uuid)
  }

  handleView = (record: any) => {
    this.props.history.push(`/app/tournaments/${record.uuid}`)
  }

  renderTournament = (item: any) => {
    const actionButton = (
      <Button type="primary" onClick={() => this.handleView(item)}>
        View
      </Button>
    )
    // const actionButton =
    //   item.playerStatus == 'JOINED' ? (
    //     <Button
    //       disabled={actionDisabled}
    //       type="danger"
    //       onClick={() => this.handleExitTournament(item)}
    //     >
    //       Exit
    //     </Button>
    //   ) : null
    //  (
    //   <Button
    //     disabled={actionDisabled}
    //     type="primary"
    //     onClick={() => this.handleJoinTournament(item)}
    //   >
    //     Join
    //   </Button>
    // )

    return (
      <List.Item actions={[actionButton]}>
        <Skeleton title={false} loading={false}>
          <List.Item.Meta
            title={
              <Link to={`/app/tournaments/${item.uuid}`}>
                {item.name} ({item.time_control} + {item.time_increment})
              </Link>
            }
            description={`${item.rounds} rounds • starts ${moment(
              item.start_date
            ).format('YYYY-MM-DD')}`}
          />
        </Skeleton>
      </List.Item>
    )
  }

  render() {
    return (
      <Layout.Content className="content tournaments">
        <div className="inner">
          <h1>Tournaments</h1>

          <div className="tournaments-section">
            <h2>Current Tournaments</h2>
            <List
              loading={false}
              itemLayout="horizontal"
              dataSource={this.props.studentTournamentStore!.currentTournaments}
              renderItem={this.renderTournament}
            />
          </div>

          <div className="tournaments-section">
            <h2>Upcoming Tournaments</h2>
            <List
              loading={false}
              itemLayout="horizontal"
              dataSource={this.props.studentTournamentStore!.upcomingTournments}
              renderItem={this.renderTournament}
            />
          </div>

          <div className="tournaments-section">
            <h2>Past Tournaments</h2>
            <List
              loading={false}
              itemLayout="horizontal"
              dataSource={this.props.studentTournamentStore!.pastTournaments}
              renderItem={this.renderTournament}
            />
          </div>
        </div>
      </Layout.Content>
    )
  }
}
