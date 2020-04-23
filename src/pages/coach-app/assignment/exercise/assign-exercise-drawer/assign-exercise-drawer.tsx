import * as React from 'react'
import * as R from 'ramda'
import { message, Button, Drawer, Form, Select, DatePicker, Icon } from 'antd'
import { FormComponentProps } from 'antd/lib/form'
import moment, { Moment } from 'moment'
import { inject, observer } from 'mobx-react'

import './assign-exercise-drawer.less'
import { StudentsGroupsStore } from '../../../../../stores/students-groups'
import { CoachAssignmentStore } from '../../../../../stores/coach-assignment'

const TODAY_MOMENT = moment()

interface Props extends FormComponentProps {
  visible: boolean
  onClose: () => any
  exerciseUuid: string
  problemUuids: string[]
  studentsGroupsStore?: StudentsGroupsStore
  coachAssignmentStore?: CoachAssignmentStore
}

interface State {
  confirmDirty: boolean
  formFields: {
    students: string[]
    scheduleDate: Moment
    deadlineDate: Moment
  }
}

@inject('studentsGroupsStore', 'coachAssignmentStore')
@observer
class WrappedAssignExerciseDrawer extends React.Component<Props, State> {
  state = {
    confirmDirty: false,
    formFields: {
      students: [],
      scheduleDate: moment.utc(TODAY_MOMENT),
      deadlineDate: moment.utc(TODAY_MOMENT).add(10, 'days')
    }
  }

  componentDidMount() {
    this.props.studentsGroupsStore!.load()
  }

  handleCancelClick = () => {
    this.props.onClose()
  }

  handleSubmit = (e: any) => {
    e.preventDefault()
    this.props.form.validateFieldsAndScroll(async (err: any, values: any) => {
      if (!err) {
        // Expand groupIds manually (TODO: backend fix for accepting groupIds)
        const [studentUuids, groupUuids] = R.partition(
          uuid => this.props.studentsGroupsStore!.students[uuid],
          this.props.form.getFieldValue('students')
        )
        const studentUuidsFromGroups = R.chain(
          uuid => this.props.studentsGroupsStore!.groups[uuid].userIds,
          groupUuids
        )

        const startDate = this.props.form.getFieldValue('scheduleDate')
        const deadline = this.props.form.getFieldValue('deadlineDate')
          ? this.props.form.getFieldValue('deadlineDate')
          : moment.utc(startDate).add(10, 'days')

        const data = {
          assignedAt: moment.utc(TODAY_MOMENT).format('YYYY-MM-DD'),
          deadline: deadline.format('YYYY-MM-DD'),
          startDate: startDate.format('YYYY-MM-DD'),
          exerciseId: this.props.exerciseUuid,
          problemIds: this.props.problemUuids,
          studentIds: R.uniq(
            R.concat(studentUuids, studentUuidsFromGroups)
          ) as string[]
        }

        const success = await this.props.coachAssignmentStore!.submit(data)
        if (success) {
          message.success('Created assignment successfully.')
          this.props.onClose()
        } else {
          message.error('Failed to create assignment.')
        }
      }
    })
  }

  handleConfirmBlur = (e: any) => {
    const value = e.target.value
    this.setState({ confirmDirty: this.state.confirmDirty || !!value })
  }

  isDateInPast = (date?: Moment) => {
    if (!date) {
      return false
    }

    return date.isBefore(TODAY_MOMENT)
  }

  studentSelectFilterOption = (inputValue: string, option: any) => {
    return (
      option.props.children
        .toString()
        .toLowerCase()
        .indexOf(inputValue.toLowerCase()) >= 0
    )
  }

  validateDeadline = (_: any, value: Moment, callback: Function) => {
    const form = this.props.form

    if (!value) {
      callback()
    } else {
      const scheduleDate = form.getFieldValue('scheduleDate') as Moment
      if (!scheduleDate || scheduleDate.isBefore(value)) {
        callback()
      } else {
        callback('Deadline must be greater than visible from date.')
      }
    }
  }

  renderSubmittingState = () => {
    return (
      <div className="drawer-inner">
        <div className="title">
          <h3>Assign Exercise</h3>
        </div>
        <div className="content">
          <div className="loading-state container">
            <Icon type="loading" spin={true} />
            <p className="exception-text">Submitting</p>
          </div>
        </div>
        <div className="button-bar">
          <Button className="cancel-button" onClick={this.props.onClose}>
            Close
          </Button>
          <Button type="primary" disabled={true}>
            Submit
          </Button>
        </div>
      </div>
    )
  }

  // TODO: Be a bit more careful about the global state of the coachAssignmentStore
  renderSubmitErrorState = () => {
    return (
      <div className="drawer-inner">
        <div className="title">
          <h3>Assign Exercise</h3>
        </div>
        <div className="content">
          <div className="error-state container">
            <Icon type="exception" />
            <p className="exception-text">Error submitting assignment.</p>
            <span className="action-text">
              <Button type="danger" onClick={this.handleSubmit}>
                Retry
              </Button>
            </span>
          </div>
        </div>
        <div className="button-bar">
          <Button className="cancel-button" onClick={this.props.onClose}>
            Close
          </Button>
          <Button type="primary" disabled={true}>
            Submit
          </Button>
        </div>
      </div>
    )
  }

  renderContent = () => {
    if (this.props.coachAssignmentStore!.submitting) {
      return this.renderSubmittingState()
    }

    if (this.props.coachAssignmentStore!.submitError) {
      return this.renderSubmitErrorState()
    }

    const { getFieldDecorator } = this.props.form

    const form = (() => {
      if (this.props.studentsGroupsStore!.loading) {
        return (
          <>
            <Icon type="loading" spin={true} />
            <h3>Loading</h3>
          </>
        )
      }

      if (this.props.studentsGroupsStore!.error) {
        return (
          <div className="error-state">
            <Icon type="exception" />
            <h3>{this.props.studentsGroupsStore!.error}</h3>
          </div>
        )
      }

      return (
        <Form className="create-exercise-form" onSubmit={this.handleSubmit}>
          <Form.Item>
            {getFieldDecorator('students', {
              rules: [
                {
                  required: true,
                  message: 'At least one student/group must be selected'
                }
              ]
            })(
              <Select
                mode="multiple"
                placeholder="Students and Groups"
                filterOption={this.studentSelectFilterOption}
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
            )}
          </Form.Item>
          <Form.Item extra="The exercise will be visible to the student only from this date.">
            {getFieldDecorator('scheduleDate', {
              initialValue: TODAY_MOMENT,
              rules: [
                {
                  type: 'object'
                }
              ]
            })(
              <DatePicker
                style={{ width: '100%' }}
                placeholder="Visible From"
                disabledDate={this.isDateInPast}
              />
            )}
          </Form.Item>
          <Form.Item extra="The student will not be able to solve the exercise after this date. Leave the field blank to grant 10 days by default">
            {getFieldDecorator('deadlineDate', {
              rules: [
                {
                  type: 'object'
                },
                {
                  validator: this.validateDeadline
                }
              ]
            })(
              <DatePicker
                style={{ width: '100%' }}
                placeholder="Deadline"
                allowClear={true}
                disabledDate={this.isDateInPast}
              />
            )}
          </Form.Item>
        </Form>
      )
    })()

    return (
      <div className="drawer-inner">
        <div className="title">
          <h3>Assign Exercise</h3>
        </div>
        <div className="content">{form}</div>
        <div className="button-bar">
          <Button className="cancel-button" onClick={this.handleCancelClick}>
            Cancel
          </Button>
          <Button
            type="primary"
            disabled={this.props.studentsGroupsStore!.loading}
            onClick={this.handleSubmit}
          >
            Submit
          </Button>
        </div>
      </div>
    )
  }

  render() {
    return (
      <Drawer
        className="assign-exercise-drawer"
        width={450}
        placement="right"
        onClose={this.props.onClose}
        maskClosable={false}
        closable={false}
        visible={this.props.visible}
      >
        {this.renderContent()}
      </Drawer>
    )
  }
}

export const AssignExerciseDrawer = Form.create()(WrappedAssignExerciseDrawer)
