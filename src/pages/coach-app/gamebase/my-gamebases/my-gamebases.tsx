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
  Popconfirm,
  Row,
  Col
} from 'antd'
import { Link, RouteComponentProps, Route, Switch } from 'react-router-dom'

import './my-gamebases.less'

import { PrivateGamebaseStore } from '../../../../stores/private-gamebase'
import { GamebaseCreateDrawer } from '../gamebase-create-drawer/gamebase-create-drawer'
import { States } from '../../../../components/states/states'

const { Option } = Select

interface Props extends RouteComponentProps<any> {
  privateGamebaseStore?: PrivateGamebaseStore
}

interface State {
  sortBy: string
  search: string
  createDrawerVisible: boolean
}

@inject('privateGamebaseStore')
@observer
export class MyGamebases extends React.Component<Props, State> {
  state = {
    sortBy: 'name',
    search: '',
    createDrawerVisible: false
  } as State

  componentDidMount() {
    this.props.privateGamebaseStore!.load()
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

  handleGamebaseCreate = () => {
    this.setState({
      createDrawerVisible: true
    })
  }

  handleGamebaseDelete = (uuid: string) => () => {
    this.props.privateGamebaseStore!.delete(uuid)
  }

  handleCreateDrawerClose = () => {
    this.setState({
      createDrawerVisible: false
    })
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
      this.props.privateGamebaseStore!.gamebases! || []
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
            <Col sm={24} md={12} lg={8} key={g.uuid} className="card">
              <span className="name" onClick={this.handleGamebaseClick(g.uuid)}>
                {g.name}
              </span>
              <span className="count">{g.count}</span>
              <Popconfirm
                title="Are you sure you want to delete the gamebase?"
                onConfirm={this.handleGamebaseDelete(g.uuid)}
              >
                <Button icon="delete" shape="circle-outline" />
              </Popconfirm>
            </Col>
          )
        })}
      </Row>
    )
  }

  render() {
    if (this.props.privateGamebaseStore!.error) {
      return (
        <div className="public-gamebases inner">
          <States
            type="error"
            exceptionText={this.props.privateGamebaseStore!.error}
            onClick={this.props.privateGamebaseStore!.load}
          />
        </div>
      )
    }

    if (this.props.privateGamebaseStore!.loading) {
      return (
        <div className="public-gamebases inner">
          <States type="loading" />
        </div>
      )
    }

    if ((this.props.privateGamebaseStore!.gamebases! || []).length === 0) {
      return (
        <div className="public-gamebases inner">
          <GamebaseCreateDrawer
            visible={this.state.createDrawerVisible}
            onClose={this.handleCreateDrawerClose}
          />
          <States
            type="blank"
            exceptionText="You have not created any gamebases so far"
            icon="database"
            button="Create"
            onClick={this.handleGamebaseCreate}
          />
        </div>
      )
    }

    const gamebases = this.sortGamebases(
      this.state.sortBy,
      this.filterGamebases(
        this.state.search,
        this.props.privateGamebaseStore!.gamebases! || []
      )
    )

    return (
      <div className="my-gamebases inner">
        <GamebaseCreateDrawer
          visible={this.state.createDrawerVisible}
          onClose={this.handleCreateDrawerClose}
        />
        <div className="action-bar">
          <div className="left">
            <Button
              size="small"
              type="primary"
              onClick={this.handleGamebaseCreate}
            >
              Create
            </Button>
          </div>
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
        {this.renderGamebases(gamebases)}
      </div>
    )
  }
}
