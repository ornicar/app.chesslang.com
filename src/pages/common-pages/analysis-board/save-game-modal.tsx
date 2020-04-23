import React, { Component } from 'react'
import {
  Modal,
  Form,
  AutoComplete,
  Input,
  Tooltip,
  Icon,
  Row,
  Col,
  Radio,
  DatePicker,
  InputNumber,
  Select,
  Button
} from 'antd'
import { FormComponentProps } from 'antd/lib/form'

interface Props extends FormComponentProps {
  visible: boolean
  recentEvents: string[]
  onCancel?: () => void
  onCreate?: () => void
  onBack?: () => void
}
interface State {}

const SaveGameForm = Form.create<Props>({ name: 'form_in_modal' })(
  class SaveGameModal extends React.Component<Props, State> {
    render() {
      const { visible, onCancel, onCreate, form } = this.props
      const { getFieldDecorator } = form

      const formItemLayout = {
        labelCol: { span: 6 },
        wrapperCol: { span: 18 }
      }

      return (
        <Modal
          visible={visible}
          title={
            <div>
              <Row type="flex" justify="center" align="middle">
                <Col span={8}>
                  <Button
                    icon="arrow-left"
                    size="small"
                    onClick={this.props.onBack}
                  ></Button>
                </Col>
                <Col style={{ textAlign: 'center' }} span={8}>
                  Save Game
                </Col>
                <Col span={8}></Col>
              </Row>
            </div>
          }
          okText="Save"
          onCancel={onCancel}
          onOk={onCreate}
        >
          <Form layout="horizontal" {...formItemLayout}>
            <Form.Item label="Event" style={{ height: 'min-content' }}>
              {getFieldDecorator('event', {
                rules: [
                  {
                    required: true
                  }
                ]
              })(
                <AutoComplete
                  dataSource={this.props.recentEvents}
                  filterOption={(inputValue, option) =>
                    option.props
                      .children!.toString()
                      .toUpperCase()
                      .indexOf(inputValue.toUpperCase()) !== -1
                  }
                ></AutoComplete>
              )}
            </Form.Item>
            <Form.Item label="White">
              {getFieldDecorator('white', {
                rules: [
                  {
                    required: true
                  }
                ]
              })(<Input />)}
            </Form.Item>
            <Form.Item label="Black">
              {getFieldDecorator('black', {
                rules: [
                  {
                    required: true
                  }
                ]
              })(<Input />)}
            </Form.Item>
            <Form.Item label="White ELO">
              {getFieldDecorator('white_elo', {
                rules: []
              })(<InputNumber />)}
            </Form.Item>
            <Form.Item label="Black ELO">
              {getFieldDecorator('black_elo', {
                rules: []
              })(<InputNumber />)}
            </Form.Item>
            <Form.Item label="Result">
              {getFieldDecorator('result', {
                rules: [
                  {
                    required: true
                  }
                ]
              })(
                <Select>
                  <Select.Option value="1-0">White won ( 1-0 )</Select.Option>
                  <Select.Option value="0-1">Black won ( 0-1 )</Select.Option>
                  <Select.Option value="1/2-1/2">
                    draw ( 1/2-1/2 )
                  </Select.Option>
                  <Select.Option value="*">other ( * )</Select.Option>
                </Select>
              )}
            </Form.Item>
            <Form.Item label="Round">
              {getFieldDecorator('round', {
                rules: [
                  {
                    required: true
                  }
                ]
              })(<InputNumber />)}
            </Form.Item>
            <Form.Item label="Date">
              {getFieldDecorator('date', {
                rules: [
                  {
                    required: true
                  }
                ]
              })(<DatePicker />)}
            </Form.Item>
          </Form>
        </Modal>
      )
    }
  }
)

export default SaveGameForm
