import React, { Component } from 'react'
import { Input } from 'antd'
import { TournamentChatStore } from '../../stores/tournament-chat-store'
import { observer, inject } from 'mobx-react'
import moment from 'moment-timezone'

interface State {
  message: string
}

interface Props {
  tournamentChatStore?: TournamentChatStore
}

@inject('tournamentChatStore')
@observer
export default class Chat extends Component<Props, State> {
  state = {
    message: ''
  }

  messagesRef = React.createRef<any>()

  componentDidMount() {
    this.scrollMessagesToBottom()
    this.props.tournamentChatStore!.onNewMessage(this.scrollMessagesToBottom)
  }

  scrollMessagesToBottom = () => {
    this.messagesRef.current.scroll(0, this.messagesRef.current.scrollHeight)
  }

  handleInputChange = (e: any) => {
    this.setState({
      message: e.target.value
    })
  }

  handleSendMessage = () => {
    if (this.state.message != '') {
      this.props.tournamentChatStore!.send(this.state.message)
    }
    this.setState({
      message: ''
    })
  }

  render() {
    return (
      <div className="chatbox">
        <div ref={this.messagesRef} className="chatbox__messages">
          {this.props.tournamentChatStore!.messages.map((message: any) => (
            <div
              key={`${message.from}_${message.timestamp}`}
              className="message"
            >
              <div>
                <span className="from-name" style={{ fontWeight: 'bold' }}>
                  {message.fromName}
                </span>
                &nbsp;
                <span>{moment(message.timestamp).format('hh:mm A')}</span>
              </div>
              <div>
                <span className="body">{message.body}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="chatbox__userinput">
          <Input.Search
            placeholder="Type your message"
            enterButton="Send"
            size="large"
            allowClear={true}
            value={this.state.message}
            onChange={this.handleInputChange}
            onSearch={this.handleSendMessage}
          />
        </div>
      </div>
    )
  }
}
