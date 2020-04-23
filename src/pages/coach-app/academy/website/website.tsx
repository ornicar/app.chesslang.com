import * as React from 'react'
import { Form, Input, Button, Alert } from 'antd'
import { inject, observer } from 'mobx-react'
import { FormComponentProps } from 'antd/lib/form'
import { Link } from 'react-router-dom'

import './website.less'
import { States } from '../../../../components/states/states'
import { AcademyStore } from '../../../../stores/academy'
import { RichTextEditor } from '../../../../components/rich-text-editor/rich-text-editor'

interface Props extends FormComponentProps {
  academyStore?: AcademyStore
}

interface State {
  confirmDirty: boolean
  aboutUs: string
  formFields: {
    name: string
    tagline: string
    facebookLink: string
    twitterLink: string
    linkedInLink: string
    youtubeLink: string
    homepageContent: string
    aboutUs: string
    addressAndContact: string
  }
}

@inject('academyStore')
@observer
class WrappedWebsite extends React.Component<Props, State> {
  state = {
    confirmDirty: false,
    aboutUs: '',
    formFields: {
      name: this.props.academyStore!.academy.name,
      tagline: this.props.academyStore!.academy.tagline,
      facebookLink: this.props.academyStore!.academy.facebookLink,
      twitterLink: this.props.academyStore!.academy.twitterLink,
      youtubeLink: this.props.academyStore!.academy.youtubeLink,
      linkedInLink: this.props.academyStore!.academy.linkedInLink,
      homepageContent: this.props.academyStore!.academy.homepageContent,
      aboutUs: this.props.academyStore!.academy.aboutUs,
      addressAndContact: this.props.academyStore!.academy.addressAndContact
    }
  } as State

  componentDidUpdate() {
    this.props.academyStore!.load()
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

  handleAboutUsChange = (htmlContent: string) => {
    this.setState({ aboutUs: htmlContent })
  }

  render() {
    const { getFieldDecorator } = this.props.form

    if (this.props.academyStore!.loading) {
      return (
        <div className="integration inner">
          <States type="loading" />
        </div>
      )
    }

    if (this.props.academyStore!.error) {
      return (
        <div className="integration inner">
          <States
            type="error"
            exceptionText={this.props.academyStore!.error}
            onClick={this.props.academyStore!.load}
          />
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

    return (
      <div className="website inner">
        <div className="container">
          <div className="status">
            {!rootdomain && (
              <Alert
                message={
                  <span>
                    Integration is mandatory for website. Go to{' '}
                    <Link to="/app/academy/integration">integration page.</Link>
                  </span>
                }
                type="error"
              />
            )}
          </div>
          <Form>
            <h3>Items to display on the homepage</h3>
            <Form.Item>
              {getFieldDecorator('name', {
                rules: [
                  { required: true, message: 'Academy name is required' }
                ],
                initialValue: this.props.academyStore!.academy.name
              })(<Input placeholder="Academy Name" />)}
            </Form.Item>
            <Form.Item>
              {getFieldDecorator('tagline', {
                initialValue: this.props.academyStore!.academy.tagline
              })(<Input placeholder="Tagline" />)}
            </Form.Item>
            <Form.Item>
              {getFieldDecorator('facebookLink', {
                initialValue: this.props.academyStore!.academy.facebookLink
              })(<Input placeholder="Facebook Link" />)}
            </Form.Item>
            <Form.Item>
              {getFieldDecorator('twitterLink', {
                initialValue: this.props.academyStore!.academy.twitterLink
              })(<Input placeholder="Twitter Link" />)}
            </Form.Item>
            <Form.Item>
              {getFieldDecorator('linkedInLink', {
                initialValue: this.props.academyStore!.academy.linkedInLink
              })(<Input placeholder="LinkedIn Link" />)}
            </Form.Item>
            <Form.Item>
              {getFieldDecorator('youtubeLink', {
                initialValue: this.props.academyStore!.academy.youtubeLink
              })(<Input placeholder="Youtube Link" />)}
            </Form.Item>
            <Form.Item>
              {getFieldDecorator('homepageContent', {
                initialValue: this.props.academyStore!.academy.homepageContent
              })(<RichTextEditor minHeight={125} />)}
            </Form.Item>
            <Form.Item label="About Us">
              {getFieldDecorator('aboutUs', {
                initialValue: this.props.academyStore!.academy.aboutUs
              })(<RichTextEditor minHeight={125} />)}
            </Form.Item>
            <Form.Item label="Address and Contact">
              {getFieldDecorator('addressAndContact', {
                initialValue: this.props.academyStore!.academy.addressAndContact
              })(<RichTextEditor minHeight={125} />)}
            </Form.Item>
          </Form>
          <Button type="primary" onClick={this.handleSubmit}>
            Submit
          </Button>
        </div>
      </div>
    )
  }
}

export const Website = Form.create()(WrappedWebsite)
