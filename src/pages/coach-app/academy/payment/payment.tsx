import * as R from 'ramda'
import * as React from 'react'
import {
  Icon,
  InputNumber,
  Form,
  Button,
  Divider,
  Popconfirm,
  Radio,
  message,
  Input,
  Modal,
  Row,
  Col
} from 'antd'
import { inject, observer } from 'mobx-react'
import StripeCheckout from 'react-stripe-checkout'

import './payment.less'
import { PaymentPlanStore } from '../../../../stores/payment-plan'
import { UserStore, userStore } from '../../../../stores/user'
import { PaymentSubscriptionStore } from '../../../../stores/payment-subscription'
import {
  StudentsGroupsStore,
  studentsGroupsStore
} from '../../../../stores/students-groups'
import { AcademyStore } from '../../../../stores/academy'

const RadioButton = Radio.Button
const RadioGroup = Radio.Group

interface Props {
  paymentPlanStore?: PaymentPlanStore
  paymentSubscriptionStore?: PaymentSubscriptionStore
  studentsGroupsStore?: StudentsGroupsStore
  userStore?: UserStore
  academyStore?: AcademyStore
}

interface State {
  planUuid: string
  interval: string
  seats: number
  showPassword: boolean
  coupon: string
  couponApplying: boolean
  couponApplied: any
  showInfoPopup: boolean
}

@inject(
  'paymentPlanStore',
  'paymentSubscriptionStore',
  'studentsGroupsStore',
  'userStore',
  'academyStore'
)
@observer
export class Payment extends React.Component<Props, State> {
  state = {
    planUuid: '',
    interval: 'year',
    showPassword: false,
    coupon: '',
    couponApplying: false,
    couponApplied: null,
    showInfoPopup: false
  }

  componentDidMount() {
    this.props.paymentPlanStore!.load()
    this.props.paymentSubscriptionStore!.load()
    this.props.studentsGroupsStore!.load(true)
  }

  handleCouponChange = e => {
    this.setState({ coupon: e.target.value })
  }

  toggleShowInfoPopup = () => {
    this.setState({ showInfoPopup: !this.state.showInfoPopup })
  }

  handleSubscriptionIntervalChange = e => {
    this.setState({ interval: e.target.value })
  }

  handleStripeToken = plan => async token => {
    const created = await this.props.paymentSubscriptionStore!.createStripe({
      academyShortName: this.props.academyStore!.academy.shortName,
      planId: plan.id,
      stripeEmail: token.email,
      stripeToken: token.id,
      coupon: (this.state.coupon || '').trim()
    })

    if (created) {
      this.props.studentsGroupsStore!.refresh()
    }
  }

  handleSubscriptionCancel = subscriptionUuid => async () => {
    try {
      const result = await this.props.paymentSubscriptionStore!.cancel(
        subscriptionUuid
      )
      if (result) {
        message.success('Cancelled subscription, sorry to see you go!')
      } else {
        message.error('Error cancelling subscription!')
      }
    } catch (e) {
      message.error('Error cancelling subscription!')
    }
  }

  handleShowPassword = () => {
    this.setState({ showPassword: true })
  }

  handleCouponApply = () => {
    if (this.state.coupon.trim()) {
      this.setState({ couponApplying: true }, async () => {
        try {
          const response = await this.props
            .userStore!.getAxiosClient()!
            .get(`/payment/api/v1/coupon/${this.state.coupon}`)
          if (response.data && response.data.valid) {
            message.success('Coupon Applied!')
            this.setState({ couponApplied: response.data })
          } else {
            message.error('Coupon Expired!')
          }
        } catch (e) {
          if (e.response && e.response.status === 404) {
            message.error('Invalid coupon')
          } else {
            message.error('Error fetching coupon')
          }
        } finally {
          this.setState({ couponApplying: false })
        }
      })
    }
  }

  handleCouponCancel = () => {
    this.setState({ couponApplied: null, coupon: '' })
  }

  getCouponReducedAmount = (amount: number, coupon: any) => {
    if (coupon) {
      if (coupon.amount_off) {
        return ((amount - coupon.amount_off) / 100)
          .toFixed(2)
          .replace('.00', '')
      }
      if (coupon.percent_off) {
        return ((amount - (amount * coupon.percent_off) / 100) / 100)
          .toFixed(2)
          .replace('.00', '')
      }
    }

    return amount
  }

  renderErrorState = () => {
    return (
      <div className="error-state container">
        <Icon type="exception" />
        <p className="exception-text">
          {this.props.paymentPlanStore!.error ||
            this.props.studentsGroupsStore!.error ||
            this.props.paymentSubscriptionStore!.error}
        </p>
      </div>
    )
  }

  renderLoadingState = () => {
    return (
      <div className="loading-state container">
        <Icon type="loading" spin={true} />
        <p className="exception-text">Loading</p>
      </div>
    )
  }

  renderPlans = () => {
    const existingSubscription =
      this.props.paymentSubscriptionStore!.subscriptions.length > 0
        ? this.props.paymentSubscriptionStore!.subscriptions[0]
        : null

    const plans = R.compose(
      R.sortBy(R.prop('students')),
      R.filter(R.propEq('interval', this.state.interval))
    )(this.props.paymentPlanStore!.plans)

    if (this.props.paymentSubscriptionStore!.creating) {
      return (
        <div className="plans-list-container">
          <div className="creating">
            <Icon type="loading" spin={true} />
            <h3>Creating subscription...</h3>
          </div>
        </div>
      )
    }

    if (this.props.paymentSubscriptionStore!.created) {
      return (
        <div className="plans-list-container">
          <div className="created">
            <Icon style={{ fontSize: 48, color: '#0a0' }} type="check-circle" />
            <h3>Subscription created</h3>
            <p>The new student accounts are listed below.</p>
          </div>
        </div>
      )
    }

    if (this.props.paymentSubscriptionStore!.createError) {
      return (
        <div className="plans-list-container">
          <div className="create-error">
            <Icon style={{ fontSize: 48, color: '#a00' }} type="exception" />
            <h3>Error creating subscription!</h3>
            <p>
              Try refreshing the page and attempting again. Automatic refunds
              will be made if failure persists.
            </p>
            <p>
              Please contact us at{' '}
              <a href="mailto:support@shortcastle.com?subject=Payment Failure">
                support@shortcastle.com
              </a>{' '}
              in case you retried several times.
            </p>
          </div>
        </div>
      )
    }

    return (
      <div className="plans-list-container">
        <div className="interval-toggle">
          <RadioGroup
            onChange={this.handleSubscriptionIntervalChange}
            value={this.state.interval}
            size="small"
          >
            <RadioButton value="year">Yearly</RadioButton>
            <RadioButton value="month">Monthly</RadioButton>
          </RadioGroup>
        </div>
        <div className="plans-list">
          {plans.map(p => (
            <div key={p.id} className={`plan ${p.popular ? 'popular' : ''}`}>
              {(!existingSubscription ||
                (existingSubscription &&
                  existingSubscription.gatewayDetails.plan.id !== p.id)) && (
                <React.Fragment>
                  {!this.state.couponApplied && (
                    <div className="price">
                      {(p.amount / 100).toFixed(2).replace('.00', '')}
                      <span className="currency">
                        {p.currency === 'usd' ? '$' : ''}
                      </span>
                    </div>
                  )}
                  {this.state.couponApplied && (
                    <div className="price">
                      <div className="original">
                        {(p.amount / 100).toFixed(2).replace('.00', '')}
                        <span className="currency">
                          {p.currency === 'usd' ? '$' : ''}
                        </span>
                      </div>
                      <div className="reduced">
                        {this.getCouponReducedAmount(
                          p.amount,
                          this.state.couponApplied
                        )}
                        <span className="currency">
                          {p.currency === 'usd' ? '$' : ''}
                        </span>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              )}
              {existingSubscription &&
                existingSubscription.gatewayDetails.plan.id === p.id && (
                  <React.Fragment>
                    {!existingSubscription.gatewayDetails.discount && (
                      <div className="price">
                        {(p.amount / 100).toFixed(2).replace('.00', '')}
                        <span className="currency">
                          {p.currency === 'usd' ? '$' : ''}
                        </span>
                      </div>
                    )}
                    {existingSubscription.gatewayDetails.discount && (
                      <div className="price">
                        <div className="original">
                          {(p.amount / 100).toFixed(2).replace('.00', '')}
                          <span className="currency">
                            {p.currency === 'usd' ? '$' : ''}
                          </span>
                        </div>
                        <div className="reduced">
                          {this.getCouponReducedAmount(
                            p.amount,
                            existingSubscription.gatewayDetails.discount.coupon
                          )}
                          <span className="currency">
                            {p.currency === 'usd' ? '$' : ''}
                          </span>
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                )}
              <div className="nickname">{p.nickname}</div>
              {existingSubscription &&
                existingSubscription.gatewayDetails.plan.id === p.id && (
                  <Popconfirm
                    title="Are you sure? This action cannot be reverted!"
                    onConfirm={this.handleSubscriptionCancel(
                      existingSubscription.uuid
                    )}
                  >
                    <Button
                      type="danger"
                      size="small"
                      loading={this.props.paymentSubscriptionStore!.cancelling}
                    >
                      Cancel
                    </Button>
                  </Popconfirm>
                )}
              {existingSubscription &&
                existingSubscription.gatewayDetails.plan.id !== p.id && (
                  <Button
                    type="primary"
                    size="small"
                    onClick={this.toggleShowInfoPopup}
                  >
                    Switch
                  </Button>
                )}
              {!existingSubscription && (
                <StripeCheckout
                  token={this.handleStripeToken(p)}
                  name={`Chesslang Subscription`}
                  description={p.nickname}
                  currency={p.currency.toUpperCase()}
                  stripeKey="pk_live_e93cjT9D7H3yy5hAKNeYciuW"
                >
                  <Button type="primary" size="small">
                    Subscribe
                  </Button>
                </StripeCheckout>
              )}
              {p.popular && <div className="popular-band">POPULAR</div>}
            </div>
          ))}
        </div>
        <div className="coupon-container">
          {!this.state.couponApplied && (
            <Row gutter={5} style={{ position: 'relative', top: 5 }}>
              <Col span={20}>
                <Input
                  disabled={this.state.couponApplying}
                  size="small"
                  placeholder="Add Coupon if any"
                  onChange={this.handleCouponChange}
                  value={this.state.coupon}
                />
              </Col>
              <Col span={4}>
                <Button
                  loading={this.state.couponApplying}
                  size="small"
                  type="primary"
                  onClick={this.handleCouponApply}
                >
                  Apply
                </Button>
              </Col>
            </Row>
          )}
          {this.state.couponApplied && (
            <Row gutter={5} style={{ position: 'relative', top: 5 }}>
              <Col span={20}>
                <strong>
                  {'Coupon Applied: ' +
                    (this.state.couponApplied! as any).name ||
                    `Coupon Applied: ${this.state.coupon}`}
                </strong>
              </Col>
              <Col span={4}>
                <Button
                  type="danger"
                  size="small"
                  onClick={this.handleCouponCancel}
                >
                  Remove
                </Button>
              </Col>
            </Row>
          )}
        </div>
        <p className="muted-text">
          $ - USD. Cancel anytime. If you need help in choosing a plan or face
          any issues, send us an email at{' '}
          <a href="mailto:support@shortcastle.com?subject=Chesslang Subscription">
            support@shortcastle.com
          </a>
        </p>
      </div>
    )
  }

  renderStudents = students => {
    return (
      <div className="networked-students">
        <p className="muted-text">
          Initial password for all accounts:{' '}
          {this.state.showPassword ? (
            <span className="password">
              {this.props.academyStore!.academy.shortName}
            </span>
          ) : (
            <span
              className="click-to-reveal"
              type="dashed"
              size="small"
              onClick={this.handleShowPassword}
            >
              Click to Reveal
            </span>
          )}
        </p>
        <div className="scroller">
          {students.map(s => (
            <div key={s.uuid} className="row">
              <strong>{s.username}</strong> ({s.firstname}, {s.lastname})
            </div>
          ))}
        </div>
      </div>
    )
  }

  render() {
    if (
      this.props.paymentPlanStore!.loading ||
      this.props.studentsGroupsStore!.loading ||
      this.props.paymentSubscriptionStore!.loading
    ) {
      return <div className="payment inner">{this.renderLoadingState()}</div>
    }

    if (
      this.props.paymentPlanStore!.error ||
      this.props.studentsGroupsStore!.error ||
      this.props.paymentSubscriptionStore!.error
    ) {
      return <div className="payment inner">{this.renderErrorState()}</div>
    }

    const students = R.compose(
      R.map(R.nth(1)),
      R.toPairs
    )(studentsGroupsStore.students)

    return (
      <div className="payment inner">
        <div className="container">
          {this.renderPlans()}
          {/*<Divider className="divider">
            Student Accounts ({students.length})
          </Divider>
	  {this.renderStudents(students)}*/}
          <Modal
            visible={this.state.showInfoPopup}
            title="Switch Subscription"
            cancelButtonProps={{ style: { display: 'none' } }}
            onOk={this.toggleShowInfoPopup}
            onCancel={this.toggleShowInfoPopup}
          >
            <h4>To switch your subscription plan, please contact us at:</h4>
            <h4>
              <a href="mailto:support@shortcastle.com">
                support@shortcastle.com
              </a>
            </h4>
          </Modal>
        </div>
      </div>
    )
  }
}
