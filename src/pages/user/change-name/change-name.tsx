import * as React from 'react'
import * as R from 'ramda'
import { message, Modal, Form, Input, Icon } from 'antd'
import { FormComponentProps } from 'antd/lib/form'
import { inject, observer } from 'mobx-react'

import { UserStore } from '../../../stores/user'

interface Props extends FormComponentProps {
  userStore?: UserStore
}

interface State {
  modalVisible: boolean
  confirmDirty: boolean
  formFields: {
    firstname: string
    lastname: string
  }
}

@inject('userStore')
@observer
class WrappedChangeName extends React.Component<Props, State> {
  state = {
    modalVisible: false,
    confirmDirty: false,
    formFields: {
      firstname: this.props.userStore!.profile.firstname,
      lastname: this.props.userStore!.profile.lastname
    }
  } as State

  componentDidMount() {
    this.props
      .userStore!.loadProfile()
      .then(() => {
        const firstname = R.trim(
          this.props.userStore!.profile.firstname.toLowerCase()
        )
        const lastname = R.trim(
          this.props.userStore!.profile.lastname.toLowerCase()
        )
        if (firstname === 'firstname' || lastname === 'lastname') {
          this.setState({ modalVisible: true })
        }
      })
      .catch(() => {})
  }

  handleSubmit = (e: any) => {
    e.preventDefault()
    this.props.form.validateFieldsAndScroll(async (err: any, values: any) => {
      if (!err) {
        const data = {
          firstname: this.props.form.getFieldValue('firstname'),
          lastname: this.props.form.getFieldValue('lastname')
        }
        const success = await this.props.userStore!.changeName(data)

        if (success) {
          this.hideModal()
          message.success('Changes Saved successfully.')
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
      this.props.userStore!.resetChangeNameErrors()
    })
  }

  render() {
    const { getFieldDecorator } = this.props.form

    return (
      <>
        <Modal
          title="Change Name"
          visible={this.state.modalVisible}
          onOk={this.handleSubmit}
          onCancel={this.hideModal}
          closable={false}
          confirmLoading={this.props.userStore!.changingName}
        >
          <Form>
            {this.props.userStore!.changeNameError && (
              <Form.Item
                style={{ marginBottom: 8 }}
                validateStatus="error"
                help={this.props.userStore!.changeNameError}
              >
                <div />
              </Form.Item>
            )}
            <Form.Item>
              {getFieldDecorator('firstname', {
                rules: [{ required: true, message: 'First Name is required.' }],
                initialValue: this.props.userStore!.profile.firstname
              })(
                <Input
                  type="text"
                  placeholder="First Name"
                  autoComplete="first-name"
                  disabled={this.props.userStore!.changingName}
                />
              )}
            </Form.Item>
            <Form.Item>
              {getFieldDecorator('lastname', {
                rules: [{ required: true, message: 'Last Name is required.' }],
                initialValue: this.props.userStore!.profile.lastname
              })(
                <Input
                  type="text"
                  placeholder="Last Name"
                  autoComplete="last-name"
                  disabled={this.props.userStore!.changingName}
                />
              )}
            </Form.Item>
          </Form>
        </Modal>
        <Icon
          style={{ cursor: 'pointer' }}
          type="edit"
          onClick={this.showModal}
        />
      </>
    )
  }
}

export const ChangeName = Form.create()(WrappedChangeName)
