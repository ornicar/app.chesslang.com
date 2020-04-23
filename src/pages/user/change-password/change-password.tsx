import * as React from 'react'
import { message, Button, Modal, Form, Input } from 'antd'
import { FormComponentProps } from 'antd/lib/form'

import { UserStore } from '../../../stores/user'
import { inject, observer } from 'mobx-react'

interface Props extends FormComponentProps {
  userStore?: UserStore
}

interface State {
  modalVisible: boolean
  confirmDirty: boolean
  formFields: {
    currentPassword: string
    newPassword: string
    retypePassword: string
  }
}

@inject('userStore')
@observer
class WrappedChangePassword extends React.Component<Props, State> {
  state = {
    modalVisible: false,
    confirmDirty: false,
    formFields: {
      currentPassword: '',
      newPassword: '',
      retypePassword: ''
    }
  }

  handleSubmit = (e: any) => {
    e.preventDefault()
    this.props.form.validateFieldsAndScroll(async (err: any, values: any) => {
      if (!err) {
        const data = {
          currentPassword: this.props.form.getFieldValue('currentPassword'),
          newPassword: this.props.form.getFieldValue('newPassword'),
          retypePassword: this.props.form.getFieldValue('retypePassword')
        }
        const success = await this.props.userStore!.changePassword(data)

        if (success) {
          this.hideModal()
          message.success('Changed password successfully.')
        }
      }
    })
  }

  showModal = () => {
    this.setState({ modalVisible: true })
  }

  hideModal = () => {
    this.setState({ modalVisible: false }, () => {
      this.props.form.resetFields()
      this.props.userStore!.resetChangePasswordErrors()
    })
  }

  compareToFirstPassword = (_: any, value: string, callback: Function) => {
    const form = this.props.form
    if (value && value !== form.getFieldValue('newPassword')) {
      callback('The two passwords need to match')
    } else {
      callback()
    }
  }

  validateToNextPassword = (_: any, value: string, callback: Function) => {
    const form = this.props.form
    if (value && this.state.confirmDirty) {
      form.validateFields(['retypePassword'], { force: true }, () => null)
    }
    callback()
  }

  render() {
    const { getFieldDecorator } = this.props.form

    return (
      <>
        <Modal
          title="Change Password"
          visible={this.state.modalVisible}
          onOk={this.handleSubmit}
          onCancel={this.hideModal}
          closable={false}
          confirmLoading={this.props.userStore!.changingPassword}
        >
          <Form>
            {this.props.userStore!.changePasswordError && (
              <Form.Item
                style={{ marginBottom: 8 }}
                validateStatus="error"
                help={this.props.userStore!.changePasswordError}
              >
                <div />
              </Form.Item>
            )}
            <Form.Item>
              {getFieldDecorator('currentPassword', {
                rules: [
                  { required: true, message: 'Current password is required.' }
                ]
              })(
                <Input
                  type="password"
                  placeholder="Current Password"
                  autoComplete="current-password"
                  disabled={this.props.userStore!.changingPassword}
                />
              )}
            </Form.Item>
            <Form.Item>
              {getFieldDecorator('newPassword', {
                rules: [
                  {
                    required: true,
                    message: 'New password is required.'
                  },
                  {
                    validator: this.validateToNextPassword
                  }
                ]
              })(
                <Input
                  type="password"
                  placeholder="New Password"
                  autoComplete="new-password"
                  disabled={this.props.userStore!.changingPassword}
                />
              )}
            </Form.Item>
            <Form.Item>
              {getFieldDecorator('retypePassword', {
                rules: [
                  {
                    required: true,
                    message: 'You must re-type the new password.'
                  },
                  {
                    validator: this.compareToFirstPassword
                  }
                ]
              })(
                <Input
                  type="password"
                  placeholder="Re-Type New Password"
                  autoComplete="new-password"
                  disabled={this.props.userStore!.changingPassword}
                />
              )}
            </Form.Item>
          </Form>
        </Modal>
        <Button onClick={this.showModal}>ChangePassword</Button>
      </>
    )
  }
}

export const ChangePassword = Form.create()(WrappedChangePassword)
