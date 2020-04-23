import * as React from 'react'
import { Layout, Button } from 'antd'
import { inject, observer } from 'mobx-react'
import { Link } from 'react-router-dom'
import * as jsEnv from 'browser-or-node'
import { Menu, Dropdown, Icon } from 'antd'

import { UserStore } from '../stores/user'
import { LocaleStore } from '../stores/locale'
import { cookies } from '../utils/utils'
import { RouteComponentProps } from 'react-router-dom'

interface HeaderProps extends RouteComponentProps {
  userStore?: UserStore
  showLoginButton?: boolean
  localeStore?: LocaleStore
}

@inject('userStore', 'localeStore')
@observer
export class Header extends React.Component<HeaderProps> {
  static defaultProps: Partial<HeaderProps> = {
    showLoginButton: true
  }

  isInCustomDomain = () => {
    if (jsEnv.isBrowser) {
      return !(window.location.hostname.indexOf('chesslang') >= 0)
    }

    return false
  }

  changeLanguage = ({ key }: any) => {
    this.props.localeStore!.setLocale(key)
    window.location.reload()
  }

  render() {
    const right = (() => {
      if (this.props.userStore!.isLoggedIn) {
        return (
          <div className="right">
            {this.props.userStore!.username}&nbsp;
            <Link to="/app">
              <Button>App &rarr;</Button>
            </Link>
          </div>
        )
      }

      const localeDropdown = (
        <Menu>
          {this.props.localeStore!.languages.map(language => {
            return (
              <Menu.Item
                onClick={this.changeLanguage}
                key={language.lng}
              >{`${language.nativeName} (${language.lng})`}</Menu.Item>
            )
          })}
        </Menu>
      )

      return (
        <div className="right">
          {this.props.showLoginButton && (
            <Link to="/login">
              <Button type="primary">Login</Button>
            </Link>
          )}
          {!this.isInCustomDomain() && (
            <Link to="/signup">
              <Button>Sign Up</Button>
            </Link>
          )}

          <Dropdown overlay={localeDropdown} trigger={['click']}>
            <a className="ant-dropdown-link" style={{ color: 'white' }}>
              {this.props.localeStore!.locale.toUpperCase()}{' '}
              <Icon type="down" />
            </a>
          </Dropdown>
        </div>
      )
    })()

    return (
      <Layout className="header">
        <div className="wrapper">
          <div className="left">
            <div className="logo" />
          </div>
          {right}
        </div>
      </Layout>
    )
  }
}
