import * as React from 'react'
import * as R from 'ramda'
import { inject, observer } from 'mobx-react'
import { toJS } from 'mobx'
import { Collapse, Icon, Button } from 'antd'

import './assignment-details.less'

import { StudentsGroupsStore } from '../../../../../stores/students-groups'
import { CoachAssignmentCompletionDetailsStore } from '../../../../../stores/coach-assignment-completion-details'
import { ProblemsList } from '../../exercise/problems-list/problems-list'

interface Props {
  assignment: any
  studentsGroupsStore?: StudentsGroupsStore
  coachAssignmentCompletionDetailsStore?: CoachAssignmentCompletionDetailsStore
}

interface State {}

@inject('studentsGroupsStore', 'coachAssignmentCompletionDetailsStore')
@observer
export class AssignmentDetails extends React.Component<Props, State> {
  componentDidMount() {
    this.props.studentsGroupsStore!.load()
    this.props.coachAssignmentCompletionDetailsStore!.load(
      this.props.assignment.uuid
    )
  }

  handleRetry = () => {
    this.props.studentsGroupsStore!.load()
    this.props.coachAssignmentCompletionDetailsStore!.load(
      this.props.assignment.uuid
    )
  }

  // Extract the list of unique students and groups
  getStudents = (studentUuids: string[], groupUuids: string[]) => {
    const studentUuidsInGroups = R.chain(
      uuid => this.props.studentsGroupsStore!.groups[uuid].userIds,
      groupUuids
    )
    const allStudentUuids = R.uniq(R.concat(studentUuids, studentUuidsInGroups))
    return R.map(
      uuid => this.props.studentsGroupsStore!.students[uuid as string],
      allStudentUuids
    )
  }

  getDetailsForStudent = (
    studentUuid: string,
    completionDetails: any[],
    totalCount: number
  ) => {
    const details = R.find(
      (d: any) => d.studentId === studentUuid,
      completionDetails
    )
    return R.reduce(
      (acc: any, d: any) => {
        const solvedCount =
          acc.solved +
          (R.find((ad: any) => ad.status === 'solved', d.attemptDetails)
            ? 1
            : 0)
        const lastAttempt = R.last(d.attemptDetails) as any
        const time =
          acc.time + (lastAttempt ? parseInt(lastAttempt.timeTaken) : 0)

        return {
          time,
          solved: solvedCount,
          total: totalCount,
          attempts: acc.attempts + d.attemptDetails.length,
          status:
            time === 0
              ? 'yet to start'
              : solvedCount === totalCount
              ? 'complete'
              : 'incomplete',
          problemDetails: acc.problemDetails
        }
      },
      {
        solved: 0,
        total: totalCount,
        time: 0,
        attempts: 0,
        status: 'yet-to-start',
        problemDetails: toJS((details && details.problemDetails) || [])
      },
      (details && details.problemDetails) || []
    )
  }

  renderCompletionDetails = (
    assignment: any,
    completionDetails: any[],
    students: any[]
  ) => {
    return (
      <Collapse accordion={true}>
        {students.map(s => {
          const details = this.getDetailsForStudent(
            s.uuid,
            completionDetails,
            assignment.problemIds.length
          )
          const problemUuids = assignment.problemIds

          const header = (
            <div className="student-panel-header">
              <span className="name">
                {s.firstname + ', ' + s.lastname} ({s.username})
              </span>
              <div className="summary">
                <span className="solved">
                  <span className="bold">
                    {details.solved}/{details.total}
                  </span>{' '}
                  solved
                </span>
                <span className="time">
                  <span className="bold">{details.time}s</span> spent
                </span>
                <span className="attempts">
                  <span className="bold">{details.attempts}</span> attempts
                </span>
              </div>
              <span className={`status ${details.status}`}>
                {details.status.toUpperCase()}
              </span>
            </div>
          )

          return (
            <Collapse.Panel
              key={s.uuid}
              header={header}
              className={`assignment-attempt-panel status-${details.status}`}
            >
              <ProblemsList
                problemUuids={problemUuids}
                problemDetails={details.problemDetails}
              />
            </Collapse.Panel>
          )
        })}
      </Collapse>
    )
  }

  render() {
    if (
      this.props.studentsGroupsStore!.loading ||
      !this.props.coachAssignmentCompletionDetailsStore!.content[
        this.props.assignment.uuid
      ] ||
      this.props.coachAssignmentCompletionDetailsStore!.content[
        this.props.assignment.uuid
      ].loading
    ) {
      return (
        <div className="assignment-details container">
          <Icon type="loading" spin={true} />
        </div>
      )
    }

    if (
      this.props.studentsGroupsStore!.error ||
      this.props.coachAssignmentCompletionDetailsStore!.content[
        this.props.assignment.uuid
      ].error
    ) {
      return (
        <div className="error-state container">
          <Icon type="exception" />
          <p className="exception-text">
            {this.props.studentsGroupsStore!.error ||
              this.props.coachAssignmentCompletionDetailsStore!.content[
                this.props.assignment.uuid
              ].error}
          </p>
          <span className="action-text">
            <Button type="danger" size="small" onClick={this.handleRetry}>
              Retry
            </Button>
          </span>
        </div>
      )
    }

    const students = R.sortBy(
      s => s.firstname,
      this.getStudents(
        this.props.assignment.studentIds,
        this.props.assignment.groupIds
      )
    )

    return (
      <div className="assignment-details">
        {this.renderCompletionDetails(
          this.props.assignment,
          this.props.coachAssignmentCompletionDetailsStore!.content[
            this.props.assignment.uuid
          ].data,
          students
        )}
      </div>
    )
  }
}
