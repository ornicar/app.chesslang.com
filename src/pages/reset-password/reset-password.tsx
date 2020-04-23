import * as React from 'react'
import { Layout, Form, Input, Button, Icon } from 'antd'
import { FormComponentProps } from 'antd/lib/form'
import { observer, inject } from 'mobx-react'

import './reset-password.less'
import { ResetPasswordStore } from '../../stores/reset-password'
import { Footer } from '../footer'
import { Header } from '../header'
import { MixpanelStore } from '../../stores/mixpanel'
import axios from 'axios'
import { userStore } from './../../stores/user'


interface ResetPasswordState {
  confirmDirty: boolean
  formFields: {
    email: string
  }
}

interface ResetPasswordProps extends FormComponentProps {
  resetPasswordStore: ResetPasswordStore
  mixpanelStore?: MixpanelStore
}

@inject('resetPasswordStore', 'mixpanelStore')
@observer
class WrappedResetPassword extends React.Component<
ResetPasswordProps,
ResetPasswordState
> {
  state = {
    confirmDirty: false,
    formFields: this.props.resetPasswordStore
  }

  backingFormRef = React.createRef<HTMLFormElement>()

  handleSubmit = (e: any) => {
    e.preventDefault()
    this.props.form.validateFieldsAndScroll((err: any, values: any) => {
      if (!err) {
        this.setState(
          {
            formFields: { ...values }
          },
          () => {
            // send reset password request
            this.resetPassword()

            this.props.mixpanelStore!.getMixpanel() &&
              this.props
                .mixpanelStore!.getMixpanel()
                .track('resetPassword', { email: this.state.formFields.email })
          }
        )
      }
    })
  }

  resetPassword = async () => {
    console.log('Sending reset password request')
    try {
      const response = await userStore.getApiCoreAxiosClient()!.post(
        `identity/account/generate-reset-password-link`,
        {
          email: this.state.formFields.email
        }
      )

      this.props.resetPasswordStore!.complete = true
      this.props.resetPasswordStore!.error = ''
    } catch (error) {
      console.log(error)
      this.props.resetPasswordStore.email = this.state.formFields.email
      if (error.response && error.response.status === 400) {
        this.props.resetPasswordStore.complete = false
        this.props.resetPasswordStore.error = 'Invalid email'
      } else {
        this.props.resetPasswordStore.complete = false
        this.props.resetPasswordStore.error =
          'Server error. Please try again later'
      }
    }
  }

  render() {
    const { getFieldDecorator } = this.props.form

    if (this.props.resetPasswordStore.complete) {
      return (
        <Layout className="reset-password page">
          <Layout className="header">
            <div className="wrapper">
              <div className="logo" />
            </div>
          </Layout>
          <Layout className="content">
            <div className="wrapper">
              <h2 className="title">Reset Password</h2>
              <div className="message-box">
                <Icon className="check-icon" type="check-circle-o" />
                <h3>Check your inbox for further instructions</h3>
              </div>
            </div>
          </Layout>
          <Footer />
        </Layout>
      )
    }

    return (
      <Layout className="reset-password page">
        <Header />
        <Layout className="content">
          <div className="wrapper">
            <h2 className="title">Reset Password</h2>
            <form
              className="backing-form"
              ref={this.backingFormRef}
              action="/reset-password"
              method="POST"
            >
              <input
                name="email"
                type="hidden"
                value={this.state.formFields.email}
              />
            </form>
            <Form className="reset-password-form" onSubmit={this.handleSubmit}>
              {this.props.resetPasswordStore.error && (
                <p className="error-message">
                  {this.props.resetPasswordStore.error}
                </p>
              )}
              <Form.Item extra="Enter the email with which the account was created">
                {getFieldDecorator('email', {
                  initialValue: this.props.resetPasswordStore.email,
                  rules: [
                    {
                      required: true,
                      type: 'email',
                      message: 'A valid email address is required'
                    }
                  ]
                })(
                  <Input
                    placeholder="E-mail"
                    autoComplete="email"
                    size="large"
                  />
                )}
              </Form.Item>
              <Form.Item className="submit-button-container">
                <Button size="large" type="primary" htmlType="submit">
                  Submit
                </Button>
              </Form.Item>
            </Form>
          </div>
        </Layout>
        <Footer />
      </Layout>
    )
  }
}

export const ResetPassword = Form.create()(WrappedResetPassword)
