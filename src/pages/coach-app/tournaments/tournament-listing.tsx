import React, { Component } from 'react'
import { Layout, Row, Col, Button, Table, List, Skeleton, message } from 'antd'
import { CoachTournamentStore } from '../../../stores/coach-tournaments'
import { observer, inject } from 'mobx-react'
import moment from 'moment-timezone'

import './tournament-listing.less'
import { Link, withRouter, RouteComponentProps } from 'react-router-dom'
import { Firebase } from '../../../firebaseInit'

interface Props extends RouteComponentProps<any> {
  coachTournamentStore?: CoachTournamentStore
}

@inject('coachTournamentStore')
@observer
class TournamentListing extends Component<Props> {
  componentDidMount() {
    this.props.coachTournamentStore!.load()
  }

  handleView = (record: any) => {
    this.props.history.push(`/app/tournaments/${record.uuid}`)
  }

  handleEdit = async (record: any) => {
    // TODO: complete
    if (record.status === 'UPCOMING') {
      this.props.history.push(`/app/tournaments/${record.uuid}/edit`)
    } else {
      const currentStage: any = (
        await Firebase.firestore()
          .collection('tournaments')
          .doc(record.uuid)
          .get()
      ).data()
      if (currentStage.player_status === 'INVITED') {
        this.props.history.push(`/app/tournaments/${record.uuid}/edit`)
      } else {
        message.error('Cannot edit as the players have been finalized')
      }
    }
  }

  handleDelete = (record: any) => {
    this.props.coachTournamentStore!.delete(record.uuid)
  }

  renderTournament = (item: any) => {
    let actions = [
      <Button
        type="primary"
        style={{ margin: 4 }}
        onClick={() => this.handleView(item)}
      >
        View
      </Button>
    ]

    if (item.status != 'PAST') {
      actions.push(
        <Button style={{ margin: 4 }} onClick={() => this.handleEdit(item)}>
          Edit
        </Button>
      )
    }
    actions.push(
      <Button
        type="danger"
        style={{ margin: 4 }}
        onClick={() => this.handleDelete(item)}
      >
        Delete
      </Button>
    )

    return (
      <List.Item actions={actions}>
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
          <Row>
            <Col span={4}>
              <Button>
                <Link to="/app/tournaments/create">Create Tournament</Link>
              </Button>
            </Col>
          </Row>

          <div className="tournaments-section">
            <h2>Current Tournaments</h2>
            <List
              loading={false}
              itemLayout="horizontal"
              dataSource={this.props.coachTournamentStore!.currentTournaments}
              renderItem={this.renderTournament}
            />
          </div>

          <div className="tournaments-section">
            <h2>Upcoming Tournaments</h2>
            <List
              loading={false}
              itemLayout="horizontal"
              dataSource={this.props.coachTournamentStore!.upcomingTournments}
              renderItem={this.renderTournament}
            />
          </div>

          <div className="tournaments-section">
            <h2>Past Tournaments</h2>
            <List
              loading={false}
              itemLayout="horizontal"
              dataSource={this.props.coachTournamentStore!.pastTournaments}
              renderItem={this.renderTournament}
            />
          </div>
        </div>
      </Layout.Content>
    )
  }
}

const TournamentListingWithRouter = withRouter(TournamentListing)

export default TournamentListingWithRouter
