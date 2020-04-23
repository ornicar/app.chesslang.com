import * as React from 'react'
import * as R from 'ramda'
import { Link } from 'react-router-dom'
import { Layout, Form, Input, Button, Radio, DatePicker, Icon } from 'antd'
import { FormComponentProps } from 'antd/lib/form'
import axios,  from 'axios'
import moment from 'moment'
import { inject, observer } from 'mobx-react'
import { userStore } from './../../stores/user'


import './signup.less'
import { Header } from '../header'
import { SignupStore } from '../../stores/signup'
import { MixpanelStore } from '../../stores/mixpanel'

interface SignupState {
  confirmDirty: boolean
  formFields: SignupStore
}

interface SignupProps extends FormComponentProps {
  signupStore: SignupStore
  mixpanelStore?: MixpanelStore
}

@inject('signupStore', 'mixpanelStore')
@observer
class WrappedSignup extends React.Component<SignupProps, SignupState> {
  state = {
    confirmDirty: false,
    formFields: this.props.signupStore
  }

  backingFormRef = React.createRef<HTMLFormElement>()

  handleSubmit = (e: any) => {
    e.preventDefault()
    this.props.form.validateFieldsAndScroll((err: any, values: any) => {
      if (!err) {
        this.setState(
          {
            formFields: { ...this.state.formFields, ...values }
          },
          () => {
            this.signup()

            this.props.mixpanelStore!.getMixpanel() &&
              this.props.mixpanelStore!.getMixpanel().track(
                'signup',
                R.omit(['password', 'retypePassword'], {
                  ...this.state.formFields
                })
              )
          }
        )
      }
    })
  }

  signup = async () => {
    console.log('Sending sign up request')
    try {
      const response = await userStore
        .getApiCoreAxiosClient()!
        .post(
          `identity/account/signup`,
          {
            ...this.state.formFields
          }
        )

      this.props.signupStore!.complete = true
      this.props.signupStore!.error = ''
    } catch (error) {
      console.log(error)
      this.props.signupStore.complete = false
      this.props.signupStore.error = 'Server error. Please try again later'
    }
  }

  handleConfirmBlur = (e: any) => {
    const value = e.target.value
    this.setState({ confirmDirty: this.state.confirmDirty || !!value })
  }

  compareToFirstPassword = (_: any, value: string, callback: Function) => {
    const form = this.props.form
    if (value && value !== form.getFieldValue('password')) {
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

  validateUsername = (_: any, value: string, callback: Function) => {
    if (value && value.indexOf(' ') !== -1) {
      callback('Username should not contain spaces')
      return
    }

    if (value) {
      userStore
        .getApiCoreAxiosClient()!
        .post(`identity/account/username-exists`, {
          username: value
        })
        .then(response => {
          if (response.data.exists) {
            callback('Username exists already')
          } else {
            callback()
          }
        })
        .catch(e => {
          callback()
        })
    } else {
      callback()
    }
  }

  validateEmail = (_: any, value: string, callback: Function) => {
    const form = this.props.form
    if (value && value.indexOf('@') === -1) {
      callback()
      return
    }

    if (value) {
      userStore
        .getApiCoreAxiosClient()!
        .post(`/identity/account/email-exists`, {
          email: value
        })
        .then(response => {
          if (response.data.exists) {
            callback('E-Mail exists already')
          } else {
            callback()
          }
        })
        .catch(e => {
          callback()
        })
    } else {
      callback()
    }
  }

  render() {
    const { getFieldDecorator } = this.props.form

    if (this.props.signupStore.complete) {
      return (
        <Layout className="page signup">
          <Header />
          <Layout className="content">
            <div className="wrapper">
              <h1 className="title">Sign Up</h1>
              <div className="message-box">
                <Icon className="check-icon" type="check-circle-o" />
                <h3>Congrats!</h3>
                <h3>Check your inbox for further instructions</h3>
              </div>
            </div>
          </Layout>
        </Layout>
      )
    }

    return (
      <Layout className="page signup">
        <Header />
        <Layout className="content">
          <div className="wrapper">
            <h2 className="title">Sign Up</h2>
            <p className="message">
              Already have an account? <Link to="/login">Login</Link>
            </p>
            <p className="muted-message">All fields are required.</p>
            <form
              className="hidden-form"
              ref={this.backingFormRef}
              action="/signup"
              method="POST"
            >
              <input name="firstname" type="hidden" value="FirstName" />
              <input name="lastname" type="hidden" value="LastName" />
              <input
                name="dateOfBirth"
                type="hidden"
                value={new Date().toISOString()}
              />
              <input name="gender" type="hidden" value="M" />
              <input
                name="username"
                type="hidden"
                value={this.state.formFields.username}
              />
              <input
                name="email"
                type="hidden"
                value={this.state.formFields.email}
              />
              <input
                name="phoneNumber"
                type="hidden"
                value={this.state.formFields.phone}
              />
              <input
                name="password"
                type="hidden"
                value={this.state.formFields.password}
              />
              <input
                name="role"
                type="hidden"
                value={this.state.formFields.role}
              />
            </form>
            <Form className="signup-form" onSubmit={this.handleSubmit}>
              <Form.Item>
                {getFieldDecorator('username', {
                  initialValue: this.props.signupStore.username,
                  rules: [
                    {
                      required: true,
                      message: 'Username is required, no spaces',
                      whitespace: false
                    },
                    {
                      validator: this.validateUsername
                    }
                  ]
                })(
                  <Input
                    size="large"
                    placeholder="Username"
                    autoComplete="username"
                  />
                )}
              </Form.Item>
              <Form.Item>
                {getFieldDecorator('email', {
                  initialValue: this.props.signupStore.email,
                  rules: [
                    {
                      required: true,
                      type: 'email',
                      message: 'A valid email address is required'
                    },
                    {
                      validator: this.validateEmail
                    }
                  ]
                })(
                  <Input
                    size="large"
                    placeholder="E-Mail"
                    type="email"
                    autoComplete="email"
                  />
                )}
              </Form.Item>
              <Form.Item>
                {getFieldDecorator('phoneNumber', {
                  initialValue: this.props.signupStore.phone,
                  rules: [
                    {
                      required: false,
                      message: 'Phone number is required, no spaces',
                      whitespace: false
                    },
                    {
                      validator: this.validatePhone
                    }
                  ]
                })(
                  <Input
                    size="large"
                    placeholder="Phone Number"
                    autoComplete="Phone Number"
                  />
                )}
              </Form.Item>
              <Form.Item>
                {getFieldDecorator('password', {
                  initialValue: this.props.signupStore.password,
                  rules: [
                    {
                      required: true,
                      message: 'Password is required'
                    },
                    {
                      validator: this.validateToNextPassword
                    }
                  ]
                })(
                  <Input
                    size="large"
                    placeholder="Password"
                    type="password"
                    autoComplete="new-password"
                  />
                )}
              </Form.Item>
              <Form.Item>
                {getFieldDecorator('retypePassword', {
                  initialValue: this.props.signupStore.retypePassword,
                  rules: [
                    {
                      required: true,
                      message: 'Password confirmation is required'
                    },
                    {
                      validator: this.compareToFirstPassword
                    }
                  ]
                })(
                  <Input
                    size="large"
                    placeholder="Re-Type Password"
                    type="password"
                    autoComplete="new-password"
                    onBlur={this.handleConfirmBlur}
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
      </Layout>
    )
  }
}

export const Signup = Form.create()(WrappedSignup)
