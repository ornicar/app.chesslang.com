import * as React from 'react'
import * as R from 'ramda'
import { Button, Drawer, Form, Select, Input, message, Icon, Radio } from 'antd'
import { FormComponentProps } from 'antd/lib/form'
import { inject, observer } from 'mobx-react'
import { StudentsGroupsStore } from '../../../../../stores/students-groups'

import './create-group-drawer.less'

const { TextArea } = Input
const Option = Select.Option

interface Props extends FormComponentProps {
  visible: boolean
  onClose: () => any
  studentsGroupsStore?: StudentsGroupsStore
}

interface State {
  confirmDirty: boolean
  formFields: {
    name: string
    description: string
    groupType: string
    purpose: string
    userIds: string[]
  }
}

@inject('studentsGroupsStore')
@observer
class WrappedCreateGroupDrawer extends React.Component<Props, State> {
  state = {
    confirmDirty: false,
    formFields: {
      name: '',
      description: '',
      groupType: 'academy',
      purpose: 'student',
      userIds: []
    }
  }

  handleCancelClick = () => {
    this.props.form.resetFields()
    this.props.onClose()
  }

  handleSubmit = (e: any) => {
    e.preventDefault()
    this.props.form.validateFieldsAndScroll(async (err: any, values: any) => {
      if (!err) {
        console.log('---> values: ', values)
        const success = await this.props.studentsGroupsStore!.create(values)
        if (success) {
          message.success('Created group successfully.')
          this.props.onClose()
        } else {
          message.error('Failed to create group.')
        }
      }
    })
  }

  handleClose = () => {
    this.props.form.resetFields()
    this.props.onClose()
  }

  studentSelectFilterOption = (inputValue: string, option: any) => {
    return (
      option.props.children
        .toString()
        .toLowerCase()
        .indexOf(inputValue.toLowerCase()) >= 0
    )
  }

  renderSubmittingState = () => {
    return (
      <div className="drawer-inner">
        <div className="title">
          <h3>Create Group</h3>
        </div>
        <div className="content">
          <div className="loading-state container">
            <Icon type="loading" spin={true} />
            <p className="exception-text">Creating</p>
          </div>
        </div>
        <div className="button-bar">
          <Button className="cancel-button" onClick={this.props.onClose}>
            Close
          </Button>
          <Button type="primary" disabled={true}>
            Create
          </Button>
        </div>
      </div>
    )
  }

  renderSubmitErrorState = () => {
    return (
      <div className="drawer-inner">
        <div className="title">
          <h3>Create Group</h3>
        </div>
        <div className="content">
          <div className="error-state container">
            <Icon type="exception" />
            <p className="exception-text">Error creating group.</p>
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
    if (this.props.studentsGroupsStore!.creating) {
      return this.renderSubmittingState()
    }

    if (this.props.studentsGroupsStore!.createError) {
      return this.renderSubmitErrorState()
    }

    const { getFieldDecorator } = this.props.form

    const form = (() => {
      return (
        <Form>
          <Form.Item>
            {getFieldDecorator('name', {
              rules: [{ required: true, message: 'Name is required' }],
              initialValue: this.state.formFields.name
            })(<Input placeholder="Group Name" />)}
          </Form.Item>
          <Form.Item>
            {getFieldDecorator('userIds', {
              rules: [
                {
                  required: true,
                  message: 'At least one student must be selected'
                }
              ],
              initialValue: this.state.formFields.userIds
            })(
              <Select
                mode="multiple"
                placeholder="Select Students"
                filterOption={this.studentSelectFilterOption}
              >
                {R.values(this.props.studentsGroupsStore!.students).map(
                  (s: any) => (
                    <Option key={s.uuid} value={s.uuid}>
                      {s.firstname + ', ' + s.lastname} ({s.username})
                    </Option>
                  )
                )}
              </Select>
            )}
          </Form.Item>
          <Form.Item>
            {getFieldDecorator('description', {
              rules: [{ required: true, message: 'Description is required' }],
              initialValue: this.state.formFields.description
            })(<TextArea rows={2} placeholder="Group Description" />)}
          </Form.Item>
        </Form>
      )
    })()

    return (
      <div className="drawer-inner">
        <div className="title">
          <h3>Create Group</h3>
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
        className="create-group-drawer"
        width={450}
        placement="right"
        onClose={this.handleClose}
        maskClosable={false}
        closable={false}
        visible={this.props.visible}
      >
        {this.renderContent()}
      </Drawer>
    )
  }
}

export const CreateGroupDrawer = Form.create()(WrappedCreateGroupDrawer)
