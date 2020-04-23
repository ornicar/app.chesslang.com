import * as R from 'ramda'
import * as React from 'react'
import { inject, observer } from 'mobx-react'
import {
  Icon,
  Button,
  Divider,
  Select,
  Input,
  Breadcrumb,
  Row,
  Col
} from 'antd'
import { Link, RouteComponentProps, Route, Switch } from 'react-router-dom'

import './public-gamebases.less'

import { PublicGamebaseStore } from '../../../../stores/public-gamebase'
import { States } from '../../../../components/states/states'

const { Option } = Select

interface Props extends RouteComponentProps<any> {
  publicGamebaseStore?: PublicGamebaseStore
}

interface State {
  sortBy: string
  search: string
}

@inject('publicGamebaseStore')
@observer
export class PublicGamebases extends React.Component<Props, State> {
  state = {
    sortBy: 'name',
    search: ''
  } as State

  componentDidMount() {
    this.props.publicGamebaseStore!.load()
  }

  handleGamebaseClick = (uuid: string) => () => {
    this.props.history.push(this.props.match.url + '/' + uuid)
  }

  handleSortByChange = (sortBy: any) => {
    this.setState({ sortBy })
  }

  handleSearchChange = (event: any) => {
    this.setState({ search: event.target.value })
  }

  sortGamebases = (sortBy: string, gamebases: any[]) => {
    return R.sortBy(g => g[sortBy], gamebases)
  }

  filterGamebases = (search: string, gamebases: any[]) => {
    return R.filter(
      (g: any) => g.name.toLowerCase().indexOf(search.toLowerCase()) >= 0,
      gamebases
    )
  }

  getGamebaseNameForUuid = (uuid: string) => {
    const gamebase = R.find(
      R.propEq('uuid', uuid),
      this.props.publicGamebaseStore!.gamebases! || []
    )
    return gamebase ? gamebase.name : ''
  }

  renderGamebases = (gamebases: any[]) => {
    if (gamebases.length === 0) {
      return (
        <div className="blank-state container">
          <Icon type="database" />
          <p className="exception-text">
            No gamebases found for the search criteria
          </p>
        </div>
      )
    }

    return (
      <Row className="gamebase-cards container">
        {gamebases.map((g: any) => {
          return (
            <Col
              sm={24}
              md={12}
              lg={8}
              key={g.uuid}
              className="card"
              onClick={this.handleGamebaseClick(g.uuid)}
            >
              <span className="name">{g.name}</span>
              <span className="count">{g.count}</span>
            </Col>
          )
        })}
      </Row>
    )
  }

  render() {
    if (this.props.publicGamebaseStore!.error) {
      return (
        <div className="public-gamebases inner">
          <States
            type="error"
            exceptionText={this.props.publicGamebaseStore!.error}
            onClick={this.props.publicGamebaseStore!.load}
          />
        </div>
      )
    }

    if (this.props.publicGamebaseStore!.loading) {
      return (
        <div className="public-gamebases inner">
          <States type="loading" />
        </div>
      )
    }

    const gamebases = this.sortGamebases(
      this.state.sortBy,
      this.filterGamebases(
        this.state.search,
        this.props.publicGamebaseStore!.gamebases! || []
      )
    )

    return (
      <div className="public-gamebases inner">
        <div className="action-bar">
          <div className="left" />
          <div className="right">
            Sort by:&nbsp;
            <Select
              className="select-sort-by"
              defaultValue={this.state.sortBy}
              value={this.state.sortBy}
              size="small"
              style={{ width: 120 }}
              onChange={this.handleSortByChange}
            >
              <Option value="name">Name</Option>
              <Option value="count">Game Count</Option>
              <Option value="createdAt">Created</Option>
            </Select>
            &nbsp;&nbsp;
            <Input.Search
              placeholder="Search"
              style={{ width: 200 }}
              size="small"
              value={this.state.search}
              onChange={this.handleSearchChange}
            />
          </div>
        </div>
        <Divider className="below-action-bar" />
        {gamebases.length === 0 ? (
          <States
            type="blank"
            icon="database"
            exceptionText="There are no public gamebases to show"
          />
        ) : (
          this.renderGamebases(gamebases)
        )}
      </div>
    )
  }
}
