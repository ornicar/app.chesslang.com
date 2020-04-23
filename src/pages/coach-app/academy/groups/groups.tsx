import * as React from 'react'
import * as R from 'ramda'
import { Input, Button, Icon, Divider, Popconfirm } from 'antd'
import { FormComponentProps } from 'antd/lib/form'
import { inject, observer } from 'mobx-react'
import { StudentsGroupsStore } from '../../../../stores/students-groups'
import { CreateGroupDrawer } from './create-group-drawer/create-group-drawer'

import './groups.less'
import { EditGroupDrawer } from './edit-group-drawer/edit-group-drawer'
import { States } from '../../../../components/states/states'

interface Props extends FormComponentProps {
  studentsGroupsStore: StudentsGroupsStore
}

interface State {
  search: string
  createDrawerVisible: boolean
  groupDetail: any
}

@inject('studentsGroupsStore')
@observer
export class Groups extends React.Component<Props, State> {
  state = {
    search: '',
    createDrawerVisible: false,
    groupDetail: null
  } as State

  componentDidMount() {
    this.props.studentsGroupsStore!.load()
  }

  handleGroupCreate = () => {
    this.setState({
      createDrawerVisible: true
    })
  }

  handleCreateGroupClose = () => {
    this.setState({
      createDrawerVisible: false
    })
  }

  handleSearchChange = (event: any) => {
    this.setState({
      search: event.target.value
    })
  }

  filterGroups = (search: string, groups: any[]) => {
    const gs = R.values(groups)
    return R.filter(
      (g: any) => g.name.toLowerCase().indexOf(search.toLowerCase()) >= 0,
      gs
    )
  }

  sortGroups = (sortByKey: string, groups: any[]) => {
    return R.sortBy((g: any) => g[sortByKey].toLowerCase(), groups)
  }

  handleDeleteGroup = (uuid: string) => () => {
    this.props.studentsGroupsStore!.delete(uuid)
  }

  handleEditGroup = (uuid: string) => () => {
    this.setState({
      groupDetail: this.props.studentsGroupsStore.groups[uuid]
    })
  }

  handleEditGroupClose = () => {
    this.setState({
      groupDetail: null
    })
  }

  renderGroups = (groups: any[]) => {
    if (groups.length === 0) {
      return (
        <div className="blank-state container">
          <Icon type="team" />
          <p className="exception-text">
            No groups found for the search criteria
          </p>
        </div>
      )
    }

    return (
      <div className="group-cards container">
        {groups.map((g: any) => {
          return (
            <div key={g.uuid} className="card">
              <span className="name">{g.name}</span>
              <span className="count">
                {g.userIds.length}{' '}
                {g.userIds.length === 1 ? 'student' : 'students'}
              </span>
              <Button
                icon="edit"
                shape="circle-outline"
                onClick={this.handleEditGroup(g.uuid)}
              />
              <Popconfirm
                title="Are you sure you want to delete the group?"
                onConfirm={this.handleDeleteGroup(g.uuid)}
              >
                <Button icon="delete" shape="circle-outline" />
              </Popconfirm>
            </div>
          )
        })}
      </div>
    )
  }

  render() {
    if (this.props.studentsGroupsStore!.loading) {
      return (
        <div className="groups inner">
          <States type="loading" />
        </div>
      )
    }

    if (this.props.studentsGroupsStore!.error) {
      return (
        <div className="groups inner">
          <States
            type="error"
            exceptionText={this.props.studentsGroupsStore!.error}
            onClick={this.props.studentsGroupsStore!.load}
          />
        </div>
      )
    }

    if (R.keys(this.props.studentsGroupsStore!.groups! || {}).length === 0) {
      return (
        <div className="groups inner">
          <States
            type="blank"
            icon="usergroup-add"
            exceptionText="You have not created any student groups so far"
            button="Create one now"
            onClick={this.handleGroupCreate}
          />
          <CreateGroupDrawer
            visible={this.state.createDrawerVisible}
            onClose={this.handleCreateGroupClose}
          />
        </div>
      )
    }

    const groups = this.sortGroups(
      'name',
      this.filterGroups(
        this.state.search,
        this.props.studentsGroupsStore!.groups! || {}
      )
    )

    return (
      <div className="groups inner">
        <div className="action-bar">
          <div className="left">
            <Button
              size="small"
              type="primary"
              onClick={this.handleGroupCreate}
            >
              Create
            </Button>
          </div>
          <div className="right">
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
        {this.renderGroups(groups)}
        <CreateGroupDrawer
          visible={this.state.createDrawerVisible}
          onClose={this.handleCreateGroupClose}
        />
        <EditGroupDrawer
          visible={this.state.groupDetail !== null}
          onClose={this.handleEditGroupClose}
          groupDetail={this.state.groupDetail}
        />
      </div>
    )
  }
}
