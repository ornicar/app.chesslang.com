import * as React from 'react'
import { observer, inject } from 'mobx-react'
import { Button } from 'antd'
import { toJS } from 'mobx'

interface Props {
  studentAssignmentStore?: StudentAssignmentStore
  assignmentUuid: string
  totalProblemCount: number
  onClick: (assignmentUuid) => any
}

@inject('studentAssignmentStore')
@observer
export default class SolvedStatus extends React.Component<Props> {
  componentDidMount() {
    this.props.studentAssignmentStore!.loadCompletionDetails(
      this.props.assignmentUuid
    )
  }

  handleSolveClick = () => {
    this.props.onClick(this.props.assignmentUuid)
  }

  render() {
    const loading =
      !this.props.studentAssignmentStore!.completionDetails[
        this.props.assignmentUuid
      ] ||
      this.props.studentAssignmentStore!.completionDetails[
        this.props.assignmentUuid
      ].loading

    if (loading) {
      return (
        <Button style={{ cursor: 'default' }} size="small" disabled={loading}>
          Loading
        </Button>
      )
    }

    var solved = false
    var details = this.props.studentAssignmentStore!.completionDetails[
      this.props.assignmentUuid
    ].details

    if (details != null) {
      solved =
        details.length === this.props.totalProblemCount &&
        details.reduce((acc, status) => acc && status.solved, true)
    } else {
      // FIXME: this is a quick fix to prevent going into "error loading page" state
      // Figure out why deatails is null
      console.log(
        'FATAL: completion details object should not be null. ( This is a quick fix. Please investigate further )'
      )
    }

    if (solved) {
      return (
        <Button
          style={{
            cursor: 'default',
            backgroundColor: '#52c41a',
            color: '#fefefe'
          }}
          size="small"
          onClick={this.handleSolveClick}
        >
          Solved
        </Button>
      )
    }

    return (
      <Button size="small" type="primary" onClick={this.handleSolveClick}>
        Solve
      </Button>
    )
  }
}
