import * as React from 'react'
import { Icon } from 'antd'

export class Calendar extends React.Component {
  render() {
    return (
      <div className="calendar inner">
        <div className="container">
          <div className="coming-soon">
            <Icon type="calendar" theme="outlined" />
            <h3>Coming Soon</h3>
          </div>
        </div>
      </div>
    )
  }
}
