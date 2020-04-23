import * as React from 'react'
import * as R from 'ramda'
import { inject, observer } from 'mobx-react'
import {
  Icon,
  Input,
  Divider,
  Collapse,
  Tag,
  Select,
  Checkbox,
  Popconfirm,
  Button
} from 'antd'
import { Link, RouteComponentProps } from 'react-router-dom'
import * as moment from 'moment'

import './assigned.less'

import { CoachAssignmentStore } from '../../../../stores/coach-assignment'
import { AssignmentDetails } from './assignment-details/assignment-details'
import { StudentsGroupsStore } from '../../../../stores/students-groups'
import { States } from '../../../../components/states/states'

const { Option } = Select
const LAST_WEEK_BEGIN_MILLIS = moment
  .utc()
  .subtract(1, 'week')
  .valueOf()

interface Props extends RouteComponentProps<any> {
  coachAssignmentStore?: CoachAssignmentStore
  studentsGroupsStore?: StudentsGroupsStore
}

interface State {
  search: string
  sortBy: string
  hideOlderThanOneWeek: boolean
  studentsGroupsFilterUuids: string[]
}

@inject('coachAssignmentStore', 'studentsGroupsStore')
@observer
export class Assigned extends React.Component<Props, State> {
  state = {
    search: '',
    sortBy: 'assignedAt_desc',
    hideOlderThanOneWeek: true,
    studentsGroupsFilterUuids: []
  }

  componentDidMount() {
    this.props.coachAssignmentStore!.load()
    this.props.studentsGroupsStore!.load()
  }

  handleSearchChange = (event: any) => {
    this.setState({ search: event.target.value })
  }

  handleSortByChange = (sortBy: any) => {
    this.setState({ sortBy })
  }

  handleOneWeekToggle = () => {
    this.setState({
      hideOlderThanOneWeek: !this.state.hideOlderThanOneWeek
    })
  }

  handleStudentsGroupsFilterChange = (uuids: any) => {
    this.setState({
      studentsGroupsFilterUuids: uuids as string[]
    })
  }

  sortAssignments = (sortBy: string, assignments: any[]) => {
    const [sortByKey, dir] = sortBy.split('_')

    const sortedList = (() => {
      if (sortByKey === 'level') {
        return R.sortBy((a: any) => {
          switch (a.exercise.difficultyLevel.toLowerCase()) {
            case 'easy':
              return 0
            case 'medium':
              return 1
            case 'hard':
              return 2
          }

          return -1
        }, assignments)
      }

      if (sortByKey === 'count') {
        return R.sortBy((a: any) => a.problemIds.length, assignments)
      }

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

      if (sortByKey === 'visibleFrom') {
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

  filterAssignmentsByStudentsGroupsUuids = (
    studentsGroupsUuids: string[],
    assignments: any[]
  ) => {
    if (studentsGroupsUuids.length > 0) {
      // @FIXME: R as any due to a bug in @types/ramda
      return (R as any).innerJoin(
        (a: any, uuid: string) =>
          a.studentIds.indexOf(uuid) >= 0 || a.groupIds.indexOf(uuid) >= 0,
        assignments,
        studentsGroupsUuids
      )
    }

    return assignments
  }

  // Retain if visible from, deadline or assigned at falls in this week.
  filterAssingmentsOlderThanWeek = (assignments: any[]) => {
    return R.filter((a: any) => {
      const assignedAt = moment.utc(a.assignedAt).valueOf()
      const deadline = moment.utc(a.deadline).valueOf()
      const visibleFrom = moment.utc(a.startDate).valueOf()
      return (
        assignedAt > LAST_WEEK_BEGIN_MILLIS ||
        deadline > LAST_WEEK_BEGIN_MILLIS ||
        visibleFrom > LAST_WEEK_BEGIN_MILLIS
      )
    }, assignments)
  }

  studentSelectFilterOption = (inputValue: string, option: any) => {
    return (
      option.props.children
        .toString()
        .toLowerCase()
        .indexOf(inputValue.toLowerCase()) >= 0
    )
  }

  renderDateString = (date: string | null) => {
    return date ? moment.utc(date).format('DD-MM-YYYY') : ''
  }

  renderBlankState = () => {
    return (
      <div className="blank-state container">
        <Icon type="database" />
        <p className="exception-text">
          You have not assigned any exercises so far.
        </p>
        <span className="action-text">
          <Link to={this.props.match.url.replace('/assigned', '/exercise')}>
            Assign Exercise
          </Link>{' '}
          now!
        </span>
      </div>
    )
  }

  renderLevelTag = (difficultyLevel: string) => {
    if (difficultyLevel === 'easy') {
      return <Tag color="green">Beginner</Tag>
    }

    if (difficultyLevel === 'medium') {
      return <Tag color="blue">Intermediate</Tag>
    }

    if (difficultyLevel === 'hard') {
      return <Tag color="red">Advanced</Tag>
    }
  }

  handleDeleteAssignment = (uuid: string) => () => {
    this.props.coachAssignmentStore!.delete(uuid)
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

    const thisWeekAssignments = this.state.hideOlderThanOneWeek
      ? this.filterAssingmentsOlderThanWeek(assignments)
      : assignments

    if (thisWeekAssignments.length === 0) {
      return (
        <div className="blank-state container">
          <Icon type="flag" />
          <p className="exception-text">
            No assignments found for this week or the search criteria
          </p>
        </div>
      )
    }

    return (
      <div className="assignments container">
        <Collapse className="assignment-collapse" bordered={false}>
          {thisWeekAssignments.map((a: any) => {
            const { studentIds, groupIds } = a

            const header = (
              <div className="panel-header">
                <div className="meta">
                  <span className="name">{a.exercise.name}</span>
                  <span className="count">({a.problemIds.length})</span>
                </div>
                <div className="tags-container">
                  {this.renderLevelTag(a.exercise.difficultyLevel)}
                  {a.exercise.tags.map((t: string) => (
                    <Tag key={t}>{t}</Tag>
                  ))}
                </div>
                <div className="submeta">
                  <span className="description">
                    Assigned to {studentIds.length} students and{' '}
                    {groupIds.length} groups on{' '}
                    {this.renderDateString(a.assignedAt)}.
                  </span>
                  <span className="timeline">
                    Deadline: {this.renderDateString(a.deadline) || 'none'},
                    visible from: {this.renderDateString(a.startDate)}
                  </span>
                </div>
                <div className="action-buttons">
                  <Popconfirm
                    title="Are you sure you want to delete the assignment?"
                    onConfirm={this.handleDeleteAssignment(a.uuid)}
                  >
                    <Button icon="delete" type="danger" size="small"></Button>
                  </Popconfirm>
                </div>
              </div>
            )

            return (
              <Collapse.Panel key={a.uuid} header={header}>
                <AssignmentDetails assignment={a} />
              </Collapse.Panel>
            )
          })}
        </Collapse>
      </div>
    )
  }

  render() {
    if (this.props.coachAssignmentStore!.loading) {
      return (
        <div className="assigned inner">
          <States type="loading" />
        </div>
      )
    }

    if (this.props.coachAssignmentStore!.error) {
      return (
        <div className="assigned inner">
          <States
            type="error"
            exceptionText={this.props.coachAssignmentStore!.error}
            onClick={this.props.coachAssignmentStore!.load}
          />
        </div>
      )
    }

    const assignments = this.sortAssignments(
      this.state.sortBy,
      this.filterAssignmentsByStudentsGroupsUuids(
        this.state.studentsGroupsFilterUuids,
        this.filterAssignments(
          this.state.search,
          this.props.coachAssignmentStore!.assignments || []
        )
      )
    )

    return (
      <div className="assigned inner">
        <div className="action-bar">
          <div className="left">
            <Checkbox
              checked={this.state.hideOlderThanOneWeek}
              onChange={this.handleOneWeekToggle}
            >
              Hide older than 1 week of relevance.
            </Checkbox>
          </div>
          <div className="right">
            Sort by:&nbsp;
            <Select
              className="select-sort-by"
              defaultValue={this.state.sortBy}
              value={this.state.sortBy}
              size="small"
              style={{ width: 160 }}
              onChange={this.handleSortByChange}
            >
              <Option value="assignedAt">
                <Icon type="caret-up" style={{ fontSize: 10 }} /> Assigned Date
              </Option>
              <Option value="assignedAt_desc">
                <Icon type="caret-down" style={{ fontSize: 10 }} /> Assigned
                Date
              </Option>
              <Option value="visibleFrom">
                <Icon type="caret-up" style={{ fontSize: 10 }} /> Visible Date
              </Option>
              <Option value="visibleFrom_desc">
                <Icon type="caret-down" style={{ fontSize: 10 }} /> Visible Date
              </Option>
              <Option value="deadline">
                <Icon type="caret-up" style={{ fontSize: 10 }} /> Deadline Date
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
              <Option value="count">
                <Icon type="caret-up" style={{ fontSize: 10 }} /> Count
              </Option>
              <Option value="count_desc">
                <Icon type="caret-down" style={{ fontSize: 10 }} /> Count
              </Option>
              <Option value="level">
                <Icon type="caret-up" style={{ fontSize: 10 }} /> Level
              </Option>
              <Option value="level_desc">
                <Icon type="caret-down" style={{ fontSize: 10 }} /> Level
              </Option>
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
        <div className="secondary-action-bar action-bar">
          <Select
            className="student-select-input"
            allowClear={true}
            mode="multiple"
            maxTagCount={3}
            placeholder="Filter by Students or Groups"
            filterOption={this.studentSelectFilterOption}
            disabled={
              this.props.studentsGroupsStore!.loading ||
              this.props.studentsGroupsStore!.error.length > 0
            }
            onChange={this.handleStudentsGroupsFilterChange}
            value={this.state.studentsGroupsFilterUuids}
          >
            <Select.OptGroup key="students" label="Students">
              {R.values(this.props.studentsGroupsStore!.students).map(
                (s: any) => (
                  <Select.Option key={s.uuid} value={s.uuid}>
                    {s.firstname + ', ' + s.lastname} ({s.username})
                  </Select.Option>
                )
              )}
            </Select.OptGroup>
            <Select.OptGroup key="groups" label="Groups">
              {R.values(this.props.studentsGroupsStore!.groups).map(
                (g: any) => (
                  <Select.Option key={g.uuid} value={g.uuid}>
                    {g.name}
                  </Select.Option>
                )
              )}
            </Select.OptGroup>
          </Select>
        </div>
        <Divider className="below-action-bar" />
        {this.renderAssignments(assignments)}
      </div>
    )
  }
}
