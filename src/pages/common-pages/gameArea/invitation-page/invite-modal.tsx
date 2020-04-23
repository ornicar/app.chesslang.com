import React, { Component } from 'react'
import { Modal, Select, Row, Col } from 'antd'

interface Props {
  visible: boolean
  handleOk: any
  handleCancel: any
}

interface State {
  time: number
  increment: number
  color: string
}

class InviteModal extends Component<Props, State> {
  state = {
    time: 15,
    increment: 0,
    color: 'black'
  }

  handleTimeChange = (time: number) => {
    this.setState({
      time
    })
  }

  handleColorChange = (color: string) => {
    this.setState({
      color
    })
  }

  handleOk = () => {
    this.props.handleOk(this.state.color, this.state.time, this.state.increment)
  }

  handleTimeIncrement = (increment: number) => {
    this.setState({ increment })
  }

  render() {
    return (
      <div>
        <Modal
          title="Send Invitation"
          visible={this.props.visible}
          onOk={this.handleOk}
          onCancel={this.props.handleCancel}
        >
          <Row type="flex" align="middle">
            <Col span={6}>
              <p style={{ textAlign: 'center', margin: '0' }}>Your color</p>
            </Col>
            <Col span={6}>
              <Select
                value={this.state.color}
                placeholder="Select color"
                style={{ width: 120 }}
                onChange={this.handleColorChange}
              >
                <Select.Option value="white">white</Select.Option>
                <Select.Option value="black">black</Select.Option>
              </Select>
            </Col>
          </Row>
          <br />
          <Row type="flex" align="middle">
            <Col span={6}>
              <p style={{ textAlign: 'center', margin: '0' }}>Time Control</p>
            </Col>
            <Col span={6}>
              <Select
                value={this.state.time}
                placeholder="Select time control"
                style={{ width: 120 }}
                onChange={this.handleTimeChange}
              >
                <Select.Option value={1}>1 minute</Select.Option>
                <Select.Option value={3}>3 minutes</Select.Option>
                <Select.Option value={5}>5 minutes</Select.Option>
                <Select.Option value={10}>10 minutes</Select.Option>
                <Select.Option value={15}>15 minutes</Select.Option>
                <Select.Option value={20}>20 minutes</Select.Option>
                <Select.Option value={30}>30 minutes</Select.Option>
              </Select>
            </Col>
          </Row>
          <br />
          <Row type="flex" align="middle">
            <Col span={6}>
              <p style={{ textAlign: 'center', margin: '0' }}>Time Increment</p>
            </Col>
            <Col span={6}>
              <Select
                value={this.state.increment}
                placeholder="Select time increment"
                style={{ width: 120 }}
                onChange={this.handleTimeIncrement}
                defaultValue={0}
              >
                <Select.Option value={0}>None</Select.Option>
                <Select.Option value={1}>1 second</Select.Option>
                <Select.Option value={2}>2 seconds</Select.Option>
                <Select.Option value={3}>3 seconds</Select.Option>
                <Select.Option value={5}>5 seconds</Select.Option>
                <Select.Option value={10}>10 seconds</Select.Option>
                <Select.Option value={15}>15 seconds</Select.Option>
                <Select.Option value={20}>20 seconds</Select.Option>
                <Select.Option value={30}>30 seconds</Select.Option>
              </Select>
            </Col>
          </Row>
        </Modal>
      </div>
    )
  }
}

export default InviteModal
