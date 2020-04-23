import * as React from 'react'
import { inject, observer } from 'mobx-react'
import { Form, Icon, Button, Input } from 'antd'
import { FormComponentProps } from 'antd/lib/form'
import axios from 'axios'

import './create-academy-form.less'
import { AcademyStore } from '../../../../stores/academy'
import { UserStore, userStore } from '../../../../stores/user'

const { TextArea } = Input

interface Props extends FormComponentProps {
  academyStore?: AcademyStore
  userStore?: UserStore
}

interface State {
  confirmDirty: boolean
  formFields: {
    name: string
    shortname: string
  }
}

@inject('academyStore', 'userStore')
@observer
class WrappedCreateAcademyForm extends React.Component<Props, State> {
  state = {
    confirmDirty: false,
    formFields: {
      name: '',
      shortname: ''
    }
  } as State

  handleSubmit = (e: any) => {
    e.preventDefault()
    this.props.form.validateFieldsAndScroll(async (err: any, values: any) => {
      if (!err) {
        this.props.academyStore!.create(values)
      }
    })
  }

  validateShortname = (_: any, value: string, callback: Function) => {
    if (value && value.indexOf(' ') >= 0) {
      callback('Short name should not contain spaces')
      return
    }

    if (value) {
      userStore
        .getApiCoreAxiosClient()!
        .post(
          `${process.env.API_CORE_URL}academy/shortname-exists`,
          { shortName: (value || '').toLowerCase() },
          {
            headers: {
              'X-Authorization': `Bearer ${this.props.userStore!.accessToken}`
            }
          }
        )
        .then(response => {
          if (response.data.exists) {
            callback('Shortname exists already')
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

    if (this.props.academyStore!.creating) {
      return (
        <div className="loading-state">
          <Icon type="loading" spin={true} />
          <p className="exception-text">Loading</p>
        </div>
      )
    }

    if (this.props.academyStore!.createError) {
      return (
        <div className="error-state">
          <Icon type="exception" />
          <p className="exception-text">
            {this.props.academyStore!.createError}
          </p>
          <Button type="danger" onClick={this.handleSubmit}>
            Retry
          </Button>
        </div>
      )
    }

    return (
      <Form className="create-academy-form">
        <div className="icon-container">
          <Icon type="home" />
          <h2>Create your virtual academy</h2>
        </div>
        <Form.Item>
          {getFieldDecorator('name', {
            rules: [{ required: true, message: 'Name is required' }]
          })(<Input placeholder="Name" />)}
        </Form.Item>
        <Form.Item>
          {getFieldDecorator('shortName', {
            rules: [
              {
                required: true,
                message: 'Short name is required, no spaces'
              },
              {
                whitespace: false,
                message: 'Spaces not allowed'
              },
              {
                validator: this.validateShortname
              }
            ]
          })(<Input placeholder="Short Name" />)}
        </Form.Item>
        <div className="button-container">
          <Button type="primary" onClick={this.handleSubmit}>
            Create
          </Button>
        </div>
      </Form>
    )
  }
}

export const CreateAcademyForm = Form.create()(WrappedCreateAcademyForm)
