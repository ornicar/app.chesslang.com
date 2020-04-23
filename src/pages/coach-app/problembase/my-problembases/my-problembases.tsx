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
  Col,
  Modal
} from 'antd'
import { Link, RouteComponentProps, Route, Switch } from 'react-router-dom'

import './my-problembases.less'

import { PrivateProblembaseStore } from '../../../../stores/private-problembase'
import { ProblembaseCreateDrawer } from '../problembase-create-drawer/problembase-create-drawer'
import { States } from '../../../../components/states/states'

const { Option } = Select

interface Props extends RouteComponentProps<any> {
  privateProblembaseStore?: PrivateProblembaseStore
}

interface State {
  sortBy: string
  search: string
  createDrawerVisible: boolean
  isEditNameModalVisible: boolean
  problembaseUuid: string
  problembaseName: string
}

@inject('privateProblembaseStore')
@observer
export class MyProblembases extends React.Component<Props, State> {
  state = {
    sortBy: 'name',
    search: '',
    createDrawerVisible: false,
    isEditNameModalVisible: false,
    problembaseUuid: '',
    problembaseName: ''
  } as State

  componentDidMount() {
    this.props.privateProblembaseStore!.load()
  }

  handleProblembaseClick = (uuid: string) => () => {
    this.props.history.push(this.props.match.url + '/' + uuid)
  }

  handleSortByChange = (sortBy: any) => {
    this.setState({ sortBy: sortBy as string })
  }

  handleSearchChange = (event: any) => {
    this.setState({ search: event.target.value })
  }

  handleProblembaseCreate = () => {
    this.setState({
      createDrawerVisible: true
    })
  }

  handleProblembaseDelete = (uuid: string) => () => {
    this.props.privateProblembaseStore!.delete(uuid)
  }

  handleProblembaseEdit = (name: string, uuid: string) => () => {
    this.setState({
      problembaseName: name,
      problembaseUuid: uuid,
      isEditNameModalVisible: true
    })
  }

  handleEditOk = async () => {
    await this.props.privateProblembaseStore!.edit(
      this.state.problembaseUuid,
      this.state.problembaseName
    )

    this.resetEditState()
  }

  handleEditCancel = () => {
    this.resetEditState()
  }

  resetEditState = () => {
    this.setState({
      isEditNameModalVisible: false,
      problembaseUuid: '',
      problembaseName: ''
    })
  }

  onNameChange = (e: any) => {
    this.setState({
      problembaseName: e.target.value
    })
  }

  handleCreateDrawerClose = () => {
    this.setState({
      createDrawerVisible: false
    })
  }

  sortProblembases = (sortBy: string, problembases: any[]) => {
    return R.sortBy(g => g[sortBy], problembases)
  }

  filterProblembases = (search: string, problembases: any[]) => {
    return R.filter(
      (g: any) => g.name.toLowerCase().indexOf(search.toLowerCase()) >= 0,
      problembases
    )
  }

  getProblembaseNameForUuid = (uuid: string) => {
    const problembase = R.find(
      R.propEq('uuid', uuid),
      this.props.privateProblembaseStore!.problembases! || []
    )
    return problembase ? problembase.name : ''
  }

  renderProblembases = (problembases: any[]) => {
    if (problembases.length === 0) {
      return (
        <div className="blank-state container">
          <Icon type="database" />
          <p className="exception-text">
            No problembases found for the search criteria
          </p>
        </div>
      )
    }

    return (
      <Row className="problembase-cards container">
        {problembases.map((g: any) => {
          return (
            <Col sm={24} md={12} lg={8} key={g.uuid} className="card">
              <span
                className="name"
                onClick={this.handleProblembaseClick(g.uuid)}
              >
                {g.name}
              </span>
              <span className="count">{g.count}</span>
              <Popconfirm
                title="Are you sure you want to delete the problembase?"
                onConfirm={this.handleProblembaseDelete(g.uuid)}
              >
                <Button icon="delete" shape="circle-outline" />
              </Popconfirm>
              <Button
                icon="edit"
                shape="circle-outline"
                onClick={this.handleProblembaseEdit(g.name, g.uuid)}
              />
            </Col>
          )
        })}
      </Row>
    )
  }

  render() {
    if (this.props.privateProblembaseStore!.error) {
      return (
        <div className="my-problembases inner">
          <States
            type="error"
            exceptionText={this.props.privateProblembaseStore!.error}
            onClick={this.props.privateProblembaseStore!.load}
          />
        </div>
      )
    }

    if (this.props.privateProblembaseStore!.loading) {
      return (
        <div className="my-problembases inner">
          <States type="loading" />
        </div>
      )
    }

    if (
      (this.props.privateProblembaseStore!.problembases! || []).length === 0
    ) {
      return (
        <div className="my-problembases inner">
          <ProblembaseCreateDrawer
            visible={this.state.createDrawerVisible}
            onClose={this.handleCreateDrawerClose}
          />
          <States
            type="blank"
            icon="database"
            exceptionText="You have not created any problembases so far"
            button="Create"
            onClick={this.handleProblembaseCreate}
          />
        </div>
      )
    }

    const problembases = this.sortProblembases(
      this.state.sortBy,
      this.filterProblembases(
        this.state.search,
        this.props.privateProblembaseStore!.problembases! || []
      )
    )

    return (
      <div className="my-problembases inner">
        <ProblembaseCreateDrawer
          visible={this.state.createDrawerVisible}
          onClose={this.handleCreateDrawerClose}
        />
        <div className="action-bar">
          <div className="left">
            <Button
              size="small"
              type="primary"
              onClick={this.handleProblembaseCreate}
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
              <Option value="count">Count</Option>
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
        {this.renderProblembases(problembases)}
        <Modal
          title="Edit Problembase Name"
          visible={this.state.isEditNameModalVisible}
          onOk={this.handleEditOk}
          onCancel={this.handleEditCancel}
        >
          <Input
            type="text"
            value={this.state.problembaseName}
            onChange={this.onNameChange}
          />
        </Modal>
      </div>
    )
  }
}
