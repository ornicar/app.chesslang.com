import * as React from 'react'
import { Link } from 'react-router-dom'
import { Layout, Form, Input, Button, message, Row, Col } from 'antd'
import { FormComponentProps } from 'antd/lib/form'
import { inject, observer } from 'mobx-react'
import { Redirect, withRouter, RouteComponentProps } from 'react-router-dom'
import * as jsEnv from 'browser-or-node'

import pawnImage from '../../images/pawn.png'

import liveLessons from '../../images/Live-lessons.png'
import solvePuzzles from '../../images/Solve-puzzles.png'
import playFeature from '../../images/play-feature.png'
import storeGames from '../../images/store-games.png'
import improveCalc from '../../images/blindbot.png'
import practicePositions from '../../images/practice-positions.png'

import './login.less'
import { LoginStore } from '../../stores/login'
import { UserStore, userStore } from '../../stores/user'
import { Header } from '../header'
import { MixpanelStore } from '../../stores/mixpanel'
import { InvitationStore } from '../../stores/invitation-store'
import { FormattedMessage } from '../../locize/index'
import { LiveGameStore } from '../../stores/live-game'

interface LoginState {
  confirmDirty: boolean
  formFields: {
    username: string
    password: string
  }
  features: Array<Object>
}

interface LoginProps extends FormComponentProps, RouteComponentProps<any> {
  loginStore: LoginStore
  userStore: UserStore
  mixpanelStore?: MixpanelStore
  invitationStore: InvitationStore
  liveGameStore: LiveGameStore
}

@inject(
  'loginStore',
  'userStore',
  'mixpanelStore',
  'invitationStore',
  'liveGameStore'
)
@observer
class WrappedLogin extends React.Component<LoginProps, LoginState> {
  state = {
    confirmDirty: false,
    formFields: this.props.loginStore,
    features: [
      {
        image: playFeature,
        feature: 'playFeature',
        title: (
          <FormattedMessage
            id="login.playFeature.title"
            defaultMessage="Play with other students in the academy"
          />
        ),
        points: [
          <FormattedMessage
            id="login.playFeature.points.0"
            defaultMessage="Within the online chess arena, you can play with other students anytime and improve your game. Games are recorded automatically for analysis"
          />
        ]
      },
      {
        image: solvePuzzles,
        feature: 'solvePuzzles',
        title: (
          <FormattedMessage
            id="login.solvePuzzles.title"
            defaultMessage="Solve tactics and improve your game"
          />
        ),
        points: [
          <FormattedMessage
            id="login.solvePuzzles.points.0"
            defaultMessage="We will provide you tailor-made homework puzzles to solve. Keeping solving them and unlock performance insights"
          />
        ]
      },
      {
        image: liveLessons,
        feature: 'liveLessons',
        title: (
          <FormattedMessage
            id="login.liveLessons.title"
            defaultMessage="Online coaching"
          />
        ),
        points: [
          <FormattedMessage
            id="login.liveLessons.points.0"
            defaultMessage="Rain or shine, stay connected with us anytime, anywhere. Collaboratively discuss plans and strategy remotely during tournaments."
          />,
          <FormattedMessage
            id="login.liveLessons.points.1"
            defaultMessage="Attend online classes with our renowned coaches."
          />
        ]
      },
      {
        image: storeGames,
        feature: 'storeGames',
        title: (
          <FormattedMessage
            id="login.storeGames.title"
            defaultMessage="Store and share your tournament games"
          />
        ),
        points: [
          <FormattedMessage
            id="login.storeGames.points.0"
            defaultMessage="Store your tournament games in the platform and share it with us for analysis"
          />
        ]
      },
      {
        image: improveCalc,
        feature: 'improveCalc',
        title: (
          <FormattedMessage
            id="login.improveCalc.title"
            defaultMessage="Improve your calculations with Blindfold Chess"
          />
        ),
        points: [
          <FormattedMessage
            id="login.improveCalc.points.0"
            defaultMessage="Play blindfold chess in multiple levels and visualise your calculations better during the game"
          />
        ]
      },
      {
        image: practicePositions,
        feature: 'practicePositions',
        title: (
          <FormattedMessage
            id="login.practicePositions.title"
            defaultMessage="Practice positions with engine"
          />
        ),
        points: [
          <FormattedMessage
            id="login.practicePositions.points.0"
            defaultMessage="Practice positions with the engine and improve your accuracy."
          />
        ]
      }
    ]
  }

  backingFormRef = React.createRef<HTMLFormElement>()

  handleSubmit = (e: any) => {
    e.preventDefault()
    this.props.form.validateFields((err: any, values: any) => {
      if (!err) {
        this.setState(
          {
            formFields: { ...values }
          },
          () => {
            // send login request
            this.login()

            this.props.mixpanelStore!.getMixpanel() &&
              this.props
                .mixpanelStore!.getMixpanel()
                .track('login', { username: this.state.formFields.username })
          }
        )
      }
    })
  }

  refresh = () => {
    window.location.reload(false)
    console.log('refresh page')
  }

  login = async () => {
    console.log('Sending login request')
    try {
      const response = await userStore
        .getApiCoreAxiosClient()!
        .post('identity/oauth/token', {
          username: this.state.formFields.username,
          password: this.state.formFields.password,
          grant_type: 'password',
          client_id: 'default',
          client_secret: 'xyzfgh'
        })
      const { access_token, refresh_token } = response.data
      if (access_token && refresh_token) {
        this.props.userStore.consumeTokens(access_token, refresh_token)
        this.props.invitationStore.init()
        this.props.liveGameStore.init()
        this.props.history.push('/app')
        this.refresh()
      } else {
        throw new Error('Server Error')
      }
    } catch (e) {
      if (e.response && e.response.status === 400) {
        message.error(
          <FormattedMessage
            id="login.log_in_area.invalid_creds"
            defaultMessage="Invalid Credentials"
          />
        )
      } else {
        message.error(
          <FormattedMessage
            id="login.log_in_area.server_error"
            defaultMessage="Server Error"
          />
        )
      }
    }
  }

  componentDidMount() {
    if (this.props.loginStore.complete === true) {
      this.props.history.push('/app')
    }

    document
      .querySelector('meta[name="viewport"]')!
      .setAttribute('content', 'width=device-width, initial-scale=1.0')
  }

  componentWillUnmount() {
    document.querySelector('meta[name="viewport"]')!.setAttribute('content', '')
  }

  isInCustomDomain = () => {
    if (jsEnv.isBrowser) {
      return !(window.location.hostname.indexOf('chesslang') >= 0)
    }

    return false
  }

  hostName() {
    return window.location.hostname.replace('www.', '')
  }

  appName() {
    const hostname = this.hostName()
    const lastDot = hostname.lastIndexOf('.')
    return hostname.substring(0, lastDot == -1 ? hostname.length : lastDot)
  }

  render() {
    const { getFieldDecorator } = this.props.form

    return (
      <Layout className="page login">
        <Header showLoginButton={false} />
        <Layout className="content">
          <div className="wrapper">
            <form
              className="backing-form"
              ref={this.backingFormRef}
              action="/login"
              method="POST"
            >
              <input
                name="username"
                type="hidden"
                value={this.state.formFields.username}
              />
              <input
                name="password"
                type="hidden"
                value={this.state.formFields.password}
              />
            </form>

            <Row
              type="flex"
              justify="space-around"
              style={{ margin: '2rem 1rem' }}
            >
              <Col md={{ span: 12, order: 0 }} xs={{ span: 24, order: 1 }}>
                <img className="auto-center" src={pawnImage} />
                <Row style={{ marginTop: '1rem' }}>
                  <Col md={8} xs={24}>
                    <h2 className="hero-point text-center">
                      <FormattedMessage
                        id="login.learn"
                        defaultMessage="Learn"
                      />
                    </h2>
                  </Col>
                  <Col md={8} xs={24}>
                    <h2 className="hero-point text-center">
                      <FormattedMessage
                        id="login.measure"
                        defaultMessage="Measure"
                      />
                    </h2>
                  </Col>
                  <Col md={8} xs={24}>
                    <h2 className="hero-point text-center">
                      <FormattedMessage
                        id="login.improve"
                        defaultMessage="Improve"
                      />
                    </h2>
                  </Col>
                </Row>
              </Col>
              <Col md={12} xs={24}>
                <Form className="login-form" onSubmit={this.handleSubmit}>
                  {this.props.loginStore.error && (
                    <p className="error-message">
                      {this.props.loginStore.error}
                    </p>
                  )}
                  <Form.Item
                    label={
                      <FormattedMessage
                        id="login.log_in_area.username"
                        defaultMessage="Username or Email"
                      />
                    }
                  >
                    {getFieldDecorator('username', {
                      initialValue: this.props.loginStore.username,
                      rules: [
                        {
                          required: true,
                          message: (
                            <FormattedMessage
                              id="login.log_in_area.username_required_message"
                              defaultMessage="username is required"
                            />
                          )
                        }
                      ]
                    })(
                      // <FormattedMessage
                      //   id="login.log_in_area.username"
                      //   defaultMessage="Username or Email23"
                      // >
                      //   {(placeholder: any) => (
                      //     <Input
                      //       placeholder={placeholder}
                      //       autoComplete="Username"
                      //       size="large"
                      //     />
                      //   )}
                      // </FormattedMessage>
                      <Input
                        placeholder="Username or Email"
                        autoComplete="Username"
                        size="large"
                      />
                    )}
                  </Form.Item>
                  <Form.Item
                    label={
                      <FormattedMessage
                        id="login.log_in_area.password"
                        defaultMessage="Password"
                      />
                    }
                  >
                    {getFieldDecorator('password', {
                      initialValue: this.props.loginStore.password,
                      rules: [
                        {
                          required: true,
                          message: (
                            <FormattedMessage
                              id="login.log_in_area.password_required_message"
                              defaultMessage="password is required"
                            />
                          )
                        }
                      ]
                    })(
                      <Input
                        type="password"
                        placeholder="Password"
                        // {getFormattedMessage(
                        //   'login.log_in_area.password',
                        //   'Password'
                        // )}
                        autoComplete="current-password"
                        size="large"
                      />
                    )}
                  </Form.Item>
                  <Form.Item className="submit-button-container">
                    <Button size="large" type="primary" htmlType="submit" block>
                      {
                        <FormattedMessage
                          id="login.log_in_area.log_in"
                          defaultMessage="Log in"
                        />
                      }
                    </Button>
                    <div className="login-help">
                      <p>
                        {
                          <FormattedMessage
                            id="login.log_in_area.forgot_password"
                            defaultMessage="Forgot Password?"
                          />
                        }{' '}
                        <Link to="/reset-password">
                          {
                            <FormattedMessage
                              id="login.log_in_area.reset_password"
                              defaultMessage="Reset"
                            />
                          }
                        </Link>
                      </p>
                      {!this.isInCustomDomain() && (
                        <p>
                          {
                            <FormattedMessage
                              id="login.log_in_area.no_account?"
                              defaultMessage="Don't have an account?"
                            />
                          }{' '}
                          <Link to="/signup">
                            {
                              <FormattedMessage
                                id="login.log_in_area.sign_up"
                                defaultMessage="Sign Up"
                              />
                            }
                          </Link>
                        </p>
                      )}
                    </div>
                  </Form.Item>
                </Form>
              </Col>
            </Row>

            {this.state.features.map(
              ({ feature, title, image, points }, index) => (
                <Row type="flex" className="feature" key={index}>
                  <Col
                    className="feature-image"
                    md={{ span: 12, order: index % 2 == 0 ? 1 : 0 }}
                    xs={24}
                  >
                    <img className="auto-center" src={image} alt={title} />
                  </Col>
                  <Col className="feature-content" md={12} xs={24}>
                    <h2>{title}</h2>
                    {points.map((point, i) => (
                      <p key={i}>{point}</p>
                    ))}
                  </Col>
                </Row>
              )
            )}
          </div>
        </Layout>
      </Layout>
    )
  }
}

export const Login = Form.create()(withRouter(WrappedLogin))
