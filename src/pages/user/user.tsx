import * as React from 'react'
import { Layout, Menu, Select } from 'antd'
import { observer, inject } from 'mobx-react'

import './user.less'

import { UserStore } from '../../stores/user'
import { LocaleStore } from '../../stores/locale'
import { BoardPrefs } from './board-prefs/board-prefs'
import { BrandPrefs } from './brand-prefs'
import { Profile } from './profile/profile'
import { ChangePassword } from './change-password/change-password'

const { Content } = Layout
const { Option } = Select

interface Props {
  userStore?: UserStore
  localeStore?: LocaleStore
}

@inject('userStore', 'localeStore')
@observer
export class User extends React.Component<Props> {
  componentDidMount() {
    this.props.userStore!.loadProfile()
  }

  changeLanguage = (locale: string) => {
    this.props.localeStore!.setLocale(locale)
    window.location.reload()
  }

  renderLanguageSettings() {
    return (
      <div className="section">
        <h2 className="my-2 text-base">Language</h2>
        <Select
          defaultValue={this.props.localeStore!.locale}
          style={{ width: 120 }}
          onChange={this.changeLanguage}
        >
          {this.props.localeStore!.languages.map(language => {
            return (
              <Option
                key={language.lng}
                value={language.lng}
              >{`${language.nativeName} (${language.lng})`}</Option>
            )
          })}
        </Select>
      </div>
    )
  }

  render() {
    return (
      // <Content className="content user">
      //   <div className="inner">
      //     <div className="container">
      //       <div className="actions">
      //         <ChangePassword />
      //       </div>
      //       <Profile />
      //       <BoardPrefs />
      //       <BrandPrefs />
      //       {this.renderLanguageSettings()}
      //     </div>
      //   </div>
      // </Content>
      <div className="w-full">
        <div className="flex items-center flex-wrap mx-4 mt-6 bg-scWhite rounded">
          <div className="w-full px-4 pt-3">
            <p className="text-sm">Settings</p>
          </div>
        </div>
        <div className="flex items-center flex-wrap mx-4 mt-2 bg-scWhite rounded">
          <div className="w-full px-4 py-2">
            <Profile />
            <div className="actions pb-4">
              <ChangePassword />
            </div>
          </div>
        </div>
        <div className="flex items-center flex-wrap mx-4 mt-2 bg-scWhite rounded">
          <div className="w-full px-4 py-2 h-full">
            <BoardPrefs />
            {/* {this.props.userStore!.role == 'coach' && <BrandPrefs />} */}
            <div className="my-2">{this.renderLanguageSettings()}</div>
          </div>
        </div>
      </div>
    )
  }
}
