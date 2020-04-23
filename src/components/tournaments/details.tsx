import React, { Component, Ref } from 'react'
import { Row, Col, Table, Spin } from 'antd'
import { TournamentViewStore, DataStatus } from '../../stores/tournament-view'
import { observer, inject } from 'mobx-react'
import moment from 'moment'
import { AcademyStore } from '../../stores/academy'

interface Props {
  tournamentViewStore?: TournamentViewStore
  academyStore?: AcademyStore
}

@inject('tournamentViewStore', 'academyStore')
@observer
export default class Details extends Component<Props> {
  tournamentDecription: any = React.createRef()

  componentDidMount() {
    this.props.academyStore!.load()
  }

  componentDidUpdate() {
    // JSX doesn't allows html content, so we directly set the innerHTML of the div element
    if (this.tournamentDecription.current) {
      this.tournamentDecription.current.innerHTML = this.props.tournamentViewStore!.tournament.description
    }
  }

  dateFormat(date: any) {
    return moment(date).format('YYYY-MM-DD')
  }

  handleDownloadTournamentPgn = () => () => {
    this.props.tournamentViewStore!.downloadTournamentPgn()
  }

  renderContent() {
    const columns = [
      {
        title: 'Round',
        dataIndex: 'round',
        key: 'round'
      },
      {
        title: 'Starts at',
        dataIndex: 'starts_at',
        key: 'starts_at',
        render(text: string, record: any) {
          return `${record.date} ${record.start_time} `
        }
      }
    ]

    return (
      <div>
        <Row className="detail-section">
          <Col md={2} sm={24}>
            Description
          </Col>
          <Col md={22} sm={24}>
            <div ref={this.tournamentDecription}></div>
          </Col>
        </Row>
        <Row className="detail-section">
          <Col md={2} sm={24}>
            Time Control
          </Col>
          <Col md={22} sm={24}>
            {`${this.props.tournamentViewStore!.tournament.time_control} minutes
            ${
              this.props.tournamentViewStore!.tournament.time_increment
            } seconds`}
          </Col>
        </Row>
        <Row className="detail-section">
          <Col md={2} sm={24}>
            Rounds
          </Col>
          <Col md={22} sm={24}>
            {this.props.tournamentViewStore!.tournament.rounds}
          </Col>
        </Row>
        <Row className="detail-section">
          <Col md={2} sm={24}>
            Duration
          </Col>
          <Col md={22} sm={24}>
            {`${this.dateFormat(
              this.props.tournamentViewStore!.tournament.start_date
            )} - ${this.dateFormat(
              this.props.tournamentViewStore!.tournament.end_date
            )}`}
          </Col>
        </Row>
        <Row className="detail-section">
          <Col md={2} sm={24}>
            PGN File
          </Col>
          <Col md={22} sm={24}>
            <a onClick={this.handleDownloadTournamentPgn()}>Download</a>
          </Col>
        </Row>
        <Row className="detail-section">
          <Col md={2} sm={24}>
            DBF File
          </Col>
          <Col md={22} sm={24}>
            <a href="#">Download</a>
          </Col>
        </Row>
        <Row className="detail-section">
          <Col md={2} sm={24}>
            Schedule
          </Col>
          <Col md={22} sm={24}>
            <Table
              columns={columns}
              dataSource={this.props.tournamentViewStore!.tournament.schedule}
            ></Table>
          </Col>
        </Row>
      </div>
    )
  }

  render() {
    return this.props.tournamentViewStore!.detailStatus ==
      DataStatus.LOADING ? (
      <div className="flex-center">
        <Spin />
      </div>
    ) : (
      this.renderContent()
    )
  }
}
