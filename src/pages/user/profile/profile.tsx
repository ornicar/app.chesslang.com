import * as React from 'react'
import { inject, observer } from 'mobx-react'
import { Icon } from 'antd'

import './profile.less'

import { UserStore } from '../../../stores/user'
import { ChangeName } from '../change-name/change-name'

interface Props {
  userStore?: UserStore
}

@inject('userStore')
@observer
export class Profile extends React.Component<Props> {
  componentDidMount() {
    this.props.userStore!.loadProfile()
  }

  render() {
    if (this.props.userStore!.profileLoading) {
      return (
        <div className="profile section">
          <Icon type="loading" spin={true} />
        </div>
      )
    }

    const profile = this.props.userStore!.profile!
    return (
      <div className="profile section">
        <div className="subsection">
          <span className="firstname">{profile.firstname}</span>
          <span className="lastname">{profile.lastname}</span>
          <ChangeName />
        </div>
        <div className="subsection">
          <span className="username">{profile.username}</span>
        </div>
        <div className="subsection">
          <span className="email">{profile.email}</span>
        </div>
        {/* <div className="subsection">
          <span className="gender">
            {profile.gender === 'M' ? 'Male' : 'Female'}.
          </span>
          <span className="dob">Born on {profile.dateOfBirth}</span>
        </div> */}
      </div>
    )
  }
}
