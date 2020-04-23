import React, { Component } from 'react'
import { Modal, Row, Col, Select, InputNumber } from 'antd'
import { ConfiguredChessboard } from '../chessboard/configured-chessboard'
import GamePreview from '../gamebox/game-preview/game-preview'

interface Props {
  visible: boolean
  confirmLoading: boolean
  handleOk: (blackTime: number, whiteTime: number) => void
  handleCancel: () => void
  fen: string
}

interface State {}

export default class RestartGameModal extends Component<Props, State> {
  state = {
    blackTime: 10,
    whiteTime: 10
  }

  handleOk = () => {
    return this.props.handleOk(this.state.blackTime, this.state.whiteTime)
  }

  handleTimeChange = (color: string) => (value: any) => {
    if (color == 'black') {
      this.setState({
        blackTime: value
      })
    } else {
      this.setState({
        whiteTime: value
      })
    }
  }

  render() {
    return (
      <Modal
        visible={this.props.visible}
        title="Restart Game"
        onOk={this.handleOk}
        confirmLoading={this.props.confirmLoading}
        onCancel={this.props.handleCancel}
      >
        <Row type="flex" justify="center" align="middle">
          <Col>
            <ConfiguredChessboard
              fen={this.props.fen}
              width={250}
              height={250}
              interactionMode="NONE"
            />
          </Col>
        </Row>
        <br />
        <Row type="flex" justify="center" align="middle">
          <Col span={6}>
            <p style={{ textAlign: 'center', margin: '0' }}>White Time</p>
          </Col>

          <Col span={6}>
            <InputNumber
              value={this.state.whiteTime}
              min={1}
              max={100}
              onChange={this.handleTimeChange('white')}
            />
          </Col>
        </Row>
        <br />
        <Row type="flex" justify="center" align="middle">
          <Col span={6}>
            <p style={{ textAlign: 'center', margin: '0' }}>Black Time</p>
          </Col>

          <Col span={6}>
            <InputNumber
              value={this.state.blackTime}
              min={1}
              max={100}
              onChange={this.handleTimeChange('black')}
            />
          </Col>
        </Row>
      </Modal>
    )
  }
}
