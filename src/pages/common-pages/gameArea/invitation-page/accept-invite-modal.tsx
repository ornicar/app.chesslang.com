import React, { Component } from 'react'
import { Modal } from 'antd'
import { toJS } from 'mobx'

interface Props {
  visible: boolean
  handleOk: any
  handleCancel: any
  invitationDetails: any
}

class AcceptInviteModal extends Component<Props> {
  handleOk = () => {
    return this.props.handleOk(toJS(this.props.invitationDetails))
  }

  render() {
    return (
      <div>
        <Modal
          title="Accept Invitation"
          visible={this.props.visible}
          onOk={this.handleOk}
          onCancel={this.props.handleCancel}
        >
          <p>{JSON.stringify(this.props.invitationDetails)}</p>
        </Modal>
      </div>
    )
  }
}

export default AcceptInviteModal
