import * as React from 'react'
import * as R from 'ramda'
import moment from 'moment'
import { inject, observer } from 'mobx-react'
import {
  Layout,
  Input,
  Icon,
  Button,
  Select,
  Divider,
  Tag,
  Modal,
  Row,
  Col
} from 'antd'

import { StudentAssignmentStore } from '../../../stores/student-assignment'
import { ProblemsSolve } from './problems-solve/problems-solve'

import './assignment.less'
import SolvedStatus from './solved-status/solved-status'
import { toJS } from 'mobx'

const { Content } = Layout
const { Option } = Select

interface Props {
  studentAssignmentStore?: StudentAssignmentStore
}

interface State {
  sortBy: string
  search: string
  problemSolveModalVisible: boolean
  assignmentToSolve: any
  problemUuids: string[]
}

@inject('studentAssignmentStore')
@observer
export class Assignment extends React.Component<Props, State> {
  state = {
    sortBy: 'assignedAt_desc',
    search: '',
    problemSolveModalVisible: false,
    assignmentToSolve: null,
    problemUuids: []
  } as State

  componentDidMount() {
    this.props.studentAssignmentStore!.load()

    document
      .querySelector('meta[name="viewport"]')!
      .setAttribute('content', 'width=device-width, initial-scale=1.0')
  }

  componentWillUnmount() {
    document.querySelector('meta[name="viewport"]')!.setAttribute('content', '')
  }

  handleSolveAssignment = assignmentUuid => {
    const assignment = R.find(
      ({ uuid }) => uuid === assignmentUuid,
      this.props.studentAssignmentStore!.assignments
    )
    this.setState({
      assignmentToSolve: assignment,
      problemUuids: assignment.problemIds,
      problemSolveModalVisible: true
    })
  }

  sortAssignments = (sortBy: string, assignments: any[]) => {
    const [sortByKey, dir] = sortBy.split('_')

    const sortedList = (() => {
      if (sortByKey === 'name') {
        return R.sortBy((a: any) => a.exercise.name, assignments)
      }

      if (sortByKey === 'assignedAt') {
        return R.sortBy(
          (a: any) => moment.utc(a.assignedAt).valueOf(),
          assignments
        )
      }

      if (sortByKey === 'deadline') {
        return R.sortBy(
          (a: any) => (a.deadline ? moment.utc(a.deadline).valueOf() : 0),
          assignments
        )
      }

      return R.sortBy(a => a[sortByKey], assignments)
    })()

    return dir === 'desc' ? R.reverse(sortedList) : sortedList
  }

  filterAssignments = (search: string, assignments: any[]) => {
    return R.filter(
      (a: any) =>
        a.exercise.name.toLowerCase().indexOf(search.toLowerCase()) >= 0,
      assignments
    )
  }

  renderErrorState = () => {
    return (
      <div className="error-state container">
        <Icon type="exception" />
        <p className="exception-text">
          {this.props.studentAssignmentStore!.error}.
        </p>
        <span className="action-text">
          <Button
            type="danger"
            onClick={this.props.studentAssignmentStore!.load}
          >
            Retry
          </Button>
        </span>
      </div>
    )
  }

  renderLoadingState = () => {
    return (
      <div className="loading-state container">
        <Icon type="loading" spin={true} />
        <p className="exception-text">Loading</p>
      </div>
    )
  }

  renderBlankState = () => {
    return (
      <div className="blank-state container">
        <Icon type="flag" />
        <p className="exception-text">
          You have not been assigned any exercises at the moment.
        </p>
      </div>
    )
  }

  renderLevelTag = (difficultyLevel: string) => {
    if (difficultyLevel === 'easy') {
      return (
        <Tag className="difficulty-tag" color="green">
          Beginner
        </Tag>
      )
    }

    if (difficultyLevel === 'medium') {
      return (
        <Tag className="difficulty-tag" color="blue">
          Intermediate
        </Tag>
      )
    }

    if (difficultyLevel === 'hard') {
      return (
        <Tag className="difficulty-tag" color="red">
          Advanced
        </Tag>
      )
    }
  }

  renderAssignedAt = (assignedAt: string) => {
    return moment.utc(assignedAt).format('DD-MM-YYYY')
  }

  renderAssignments = (assignments: any[]) => {
    if (assignments.length === 0) {
      return (
        <div className="blank-state container">
          <Icon type="flag" />
          <p className="exception-text">
            No assignments found for the search criteria
          </p>
        </div>
      )
    }
    return (
      <div className="assignment-list">
        {assignments.map(e => {
          return (
            <Row className="assignment-item" key={e.uuid}>
              <Col md={{ span: 6 }} sm={24}>
                <div className="name">
                  {e.exercise.name}
                  <span className="count">({e.problemIds.length})</span>
                </div>

                <div className="tags-container">
                  {e.exercise.tags.map((t: string) => (
                    <Tag className="exercise-tag" key={t}>
                      {t}
                    </Tag>
                  ))}
                </div>
                <span className="description">{e.exercise.description}</span>

                <span className="created">
                  Deadline - {this.renderAssignedAt(e.deadline)}
                </span>
              </Col>
              <Col md={4} sm={24}>
                <SolvedStatus
                  assignmentUuid={e.uuid}
                  onClick={this.handleSolveAssignment}
                  totalProblemCount={e.problemIds.length}
                />
              </Col>
            </Row>
          )
        })}
      </div>
    )
  }

  handleSortByChange = (sortBy: any) => {
    this.setState({ sortBy } as State)
  }

  handleSearchChange = (event: any) => {
    this.setState({ search: event.target.value })
  }

  renderAssignmentPage() {
    if (this.props.studentAssignmentStore!.error) {
      return this.renderErrorState()
    }
    if (this.props.studentAssignmentStore!.loading) {
      return this.renderLoadingState()
    }
    const assignments = this.props.studentAssignmentStore!.assignments
    return (
      <>
        {assignments.length > 0 ? (
          <>
            {/* refactor action bar */}
            <div className="action-bar right">
              <span>Sort by &nbsp;</span>
              <Select
                className="select-sort-by"
                defaultValue={this.state.sortBy}
                value={this.state.sortBy}
                size="small"
                style={{ width: 160 }}
                onChange={this.handleSortByChange}
              >
                <Option value="assignedAt">
                  <Icon type="caret-up" style={{ fontSize: 10 }} /> Assigned
                  Date
                </Option>
                <Option value="assignedAt_desc">
                  <Icon type="caret-down" style={{ fontSize: 10 }} /> Assigned
                  Date
                </Option>
                <Option value="deadline">
                  <Icon type="caret-up" style={{ fontSize: 10 }} /> Deadline
                  Date
                </Option>
                <Option value="deadline_desc">
                  <Icon type="caret-down" style={{ fontSize: 10 }} /> Deadline
                  Date
                </Option>
                <Option value="name">
                  <Icon type="caret-up" style={{ fontSize: 10 }} /> Name
                </Option>
                <Option value="name_desc">
                  <Icon type="caret-down" style={{ fontSize: 10 }} /> Name
                </Option>
              </Select>
              <Input.Search
                placeholder="Search"
                className="assignments-search"
                style={{ width: 200 }}
                size="small"
                value={this.state.search}
                onChange={this.handleSearchChange}
              />
            </div>

            <Divider className="below-action-bar" />
            {this.renderAssignments(
              this.sortAssignments(
                this.state.sortBy,
                this.filterAssignments(this.state.search, assignments)
              )
            )}
          </>
        ) : (
          this.renderBlankState()
        )}
      </>
    )
  }

  handleproblemSolveModalCancel = () => {
    this.setState({ problemSolveModalVisible: false })
    if (this.state.assignmentToSolve) {
      this.props.studentAssignmentStore!.loadCompletionDetails(
        this.state.assignmentToSolve.uuid
      )
    }
  }

  render() {
    return (
      <Content className="content">
        <div className="assignment inner">{this.renderAssignmentPage()}</div>
        <div
          className={`modal ${
            this.state.problemSolveModalVisible ? 'show' : 'hide'
          }`}
        >
          <div className="modal-content modal-lg">
            <Icon
              className="close-btn"
              type="close"
              onClick={this.handleproblemSolveModalCancel}
            />
            {this.state.problemSolveModalVisible && (
              <ProblemsSolve
                assignment={this.state.assignmentToSolve}
                problemUuids={this.state.problemUuids}
              />
            )}
          </div>
        </div>
      </Content>
    )
  }
}
