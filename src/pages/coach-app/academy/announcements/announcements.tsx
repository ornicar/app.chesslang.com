import * as React from 'react'
import { Icon } from 'antd'

export class Announcements extends React.Component {
  render() {
    return (
      <div className="announcements inner">
        <div className="container">
          <div className="coming-soon">
            <Icon type="message" theme="outlined" />
            <h3>Coming Soon</h3>
          </div>
        </div>
      </div>
    )
  }
}
