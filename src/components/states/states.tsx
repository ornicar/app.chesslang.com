import * as React from 'react'
import { Icon, Button } from 'antd'

import './states.less'

interface Props {
  type: 'loading' | 'blank' | 'error'
  icon?: string
  exceptionText?: string
  button?: string
  onClick?: (e?: any) => any
}

export class States extends React.Component<Props> {
  renderErrorState = () => {
    return (
      <>
        <Icon type="exception" />
        <p className="exception-text">{this.props.exceptionText}</p>
        <span className="action-text">
          <Button type="danger" onClick={this.props.onClick}>
            Retry
          </Button>
        </span>
      </>
    )
  }

  renderLoadingState = () => {
    return (
      <>
        <Icon type="loading" spin={true} />
        <p className="exception-text">Loading</p>
      </>
    )
  }

  renderBlankState = () => {
    return (
      <>
        {this.props.icon && <Icon type={this.props.icon} />}
        <p className="exception-text">{this.props.exceptionText}</p>
        {this.props.button && (
          <span className="action-text">
            <Button type="primary" onClick={this.props.onClick}>
              {this.props.button}
            </Button>
          </span>
        )}
      </>
    )
  }

  render() {
    return (
      <div className="states">
        {this.props.type === 'error'
          ? this.renderErrorState()
          : this.props.type === 'blank'
          ? this.renderBlankState()
          : this.renderLoadingState()}
      </div>
    )
  }
}
