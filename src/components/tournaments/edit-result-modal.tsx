import React, { Component } from 'react'
import { Modal, Row, Col, Select } from 'antd'

interface Props {
  visible: boolean
  confirmLoading: boolean
  handleOk: (resultValue: string) => void
  handleCancel: () => void
}

interface State {
  value: string
}

export default class EditResultModal extends Component<Props, State> {
  state = {
    value: '1-0'
  }

  handleResultChange = (value: any) => {
    this.setState({
      value
    })
  }

  handleOk = () => {
    return this.props.handleOk(this.state.value)
  }

  render() {
    return (
      <Modal
        visible={this.props.visible}
        title="Edit Result"
        onOk={this.handleOk}
        confirmLoading={this.props.confirmLoading}
        onCancel={this.props.handleCancel}
      >
        <Row type="flex" align="middle">
          <Col span={6}>
            <p style={{ textAlign: 'center', margin: '0' }}>Result</p>
          </Col>
          <Col span={6}>
            <Select
              value={this.state.value}
              style={{ width: 120 }}
              onChange={this.handleResultChange}
            >
              <Select.Option value="1-0">1-0</Select.Option>
              <Select.Option value="0-1">0-1</Select.Option>
              <Select.Option value="0.5-0.5">0.5-0.5</Select.Option>
            </Select>
          </Col>
        </Row>
      </Modal>
    )
  }
}
