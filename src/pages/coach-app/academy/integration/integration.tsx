import * as React from 'react'
import * as R from 'ramda'
import { Form, Input, Checkbox, Button, Alert, Icon } from 'antd'
import { inject, observer } from 'mobx-react'
import { FormComponentProps } from 'antd/lib/form'
import { AcademyStore } from '../../../../stores/academy'

import './integration.less'
import { States } from '../../../../components/states/states'
import {
  StudentsGroupsStore,
  studentsGroupsStore
} from '../../../../stores/students-groups'
import { Link } from 'react-router-dom'

interface Props extends FormComponentProps {
  academyStore?: AcademyStore
  studentsGroupsStore?: StudentsGroupsStore
}

interface State {
  useSubdomain: boolean
  confirmDirty: boolean
  formFields: {
    rootdomain: string
    subdomain: string
  }
}

@inject('academyStore', 'studentsGroupsStore')
@observer
class WrappedIntegration extends React.Component<Props, State> {
  state = {
    useSubdomain: (this.props.academyStore!.academy.subdomain || '').length > 0,
    confirmDirty: false,
    formFields: {
      rootdomain: this.props.academyStore!.academy.rootdomain,
      subdomain: this.props.academyStore!.academy.subdomain
    }
  } as State

  componentDidMount() {
    this.props.studentsGroupsStore!.load()
  }

  handleSubmit = (e: any) => {
    e.preventDefault()
    this.props.form.validateFieldsAndScroll(async (err: any, values: any) => {
      if (!err) {
        let data = {
          ...values
        }
        this.props.academyStore!.edit(
          this.props.academyStore!.academy.uuid,
          data
        )
      }
    })
  }

  handleRetry = () => {
    this.props.academyStore!.load()
    this.props.studentsGroupsStore!.load()
  }

  handleUseSubdomainToggle = () => {
    this.setState({
      useSubdomain: !this.state.useSubdomain
    })
  }

  render() {
    const { getFieldDecorator } = this.props.form

    if (
      this.props.academyStore!.loading ||
      this.props.studentsGroupsStore!.loading
    ) {
      return (
        <div className="integration inner">
          <States type="loading" />
        </div>
      )
    }

    if (
      this.props.academyStore!.error ||
      this.props.studentsGroupsStore!.error
    ) {
      return (
        <div className="integration inner">
          <States
            type="error"
            exceptionText={
              this.props.academyStore!.error || this.props.academyStore!.error
            }
            onClick={this.handleRetry}
          />
        </div>
      )
    }

    if (R.keys(this.props.studentsGroupsStore!.students).length <= 1) {
      return (
        <div className="integration inner">
          <div className="locked-message">
            <Icon type="lock" theme="filled" />
            <h3>Enable this feature by subscribing</h3>
            <h3>
              to one of our paids plans in the{' '}
              <Link to="/app/academy/payment">payment</Link> page.
            </h3>
          </div>
        </div>
      )
    }

    if (this.props.academyStore!.editing) {
      return (
        <div className="integration inner">
          <States type="loading" />
        </div>
      )
    }

    if (this.props.academyStore!.editError) {
      return (
        <div className="integration inner">
          <States
            type="error"
            exceptionText={this.props.academyStore!.editError}
            onClick={this.handleSubmit}
          />
        </div>
      )
    }

    const rootdomain =
      this.props.form.getFieldValue('rootdomain') ||
      this.props.academyStore!.academy.rootdomain ||
      ''
    const subdomain =
      this.props.form.getFieldValue('subdomain') ||
      this.props.academyStore!.academy.subdomain ||
      ''

    return (
      <div className="integration inner">
        <div className="container">
          <div className="status">
            {this.props.academyStore!.academy.integrationStatus ===
              'AWAITING-DOMAIN' && (
              <Alert
                message="Integration Status: Awaiting Domain Settings"
                type="warning"
              />
            )}
            {this.props.academyStore!.academy.integrationStatus === 'DONE' && (
              <Alert message="Integration Status: Done" type="success" />
            )}
          </div>
          <Form>
            <h3>Setup to access Chesslang from your custom domain</h3>
            <Form.Item extra="Example: mychessacademy.com (without www)">
              {getFieldDecorator('rootdomain', {
                rules: [{ required: true, message: 'Root domain is required' }],
                initialValue: this.props.academyStore!.academy.rootdomain
              })(<Input placeholder="Your root domain" />)}
            </Form.Item>
            <Form.Item className="subdomain-checkbox">
              <Checkbox
                checked={this.state.useSubdomain}
                onChange={this.handleUseSubdomainToggle}
              >
                I want to use subdomain like{' '}
                <span className="subdomain">coaching</span>.myacademy.com
              </Checkbox>
            </Form.Item>
            <Form.Item extra="Example: coaching">
              {getFieldDecorator('subdomain', {
                initialValue: this.props.academyStore!.academy.subdomain
              })(
                <Input
                  disabled={!this.state.useSubdomain}
                  placeholder="Subdomain"
                />
              )}
            </Form.Item>
          </Form>
          {rootdomain && (
            <div className="domain-settings">
              <h3>Domain Control Settings</h3>
              <span className="instructions">
                create the following <span className="bold">CNAME records</span>{' '}
                in your domain control
              </span>
              <table>
                <thead>
                  <tr>
                    <th>Point</th>
                    <th>To</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      {this.state.useSubdomain && subdomain
                        ? `${subdomain}.${rootdomain}`
                        : `${rootdomain}`}
                    </td>
                    <td>app.chesslang.com</td>
                  </tr>
                  <tr>
                    <td>
                      _acme-challenge.
                      {this.state.useSubdomain && subdomain
                        ? `${subdomain}.${rootdomain}`
                        : `${rootdomain}`}
                    </td>
                    <td>
                      {this.state.useSubdomain && subdomain
                        ? `${subdomain}.${rootdomain}.app.chesslang.com`
                        : `${rootdomain}.app.chesslang.com`}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
          <Button
            type="primary"
            onClick={this.handleSubmit}
            disabled={!rootdomain}
          >
            Request
          </Button>
        </div>
      </div>
    )
  }
}

export const Integration = Form.create()(WrappedIntegration)
