import * as React from 'react'
import * as R from 'ramda'
import { Modal, Input, Button, message, Form, Row, Col, List } from 'antd'
import { inject, observer } from 'mobx-react'
import { StudentsGroupsStore } from '../../../../stores/students-groups'
import { AcademyStore } from '../../../../stores/academy'

import './students.less'
import _ from 'lodash'
import RatingSystem from '../../../../types/RatingSystem'
import { RatingSystemStore } from '../../../../stores/rating-system'
import { Rating } from '../../../../types/Rating'
import { getFormattedName } from '../../../../utils/utils'

interface Props {
  studentsGroupsStore?: StudentsGroupsStore
  academyStore?: AcademyStore
  ratingSystemStore: RatingSystemStore
}

interface State {
  showPassword: boolean
  resetPasswordModalVisible: boolean
  resetNameMovdalVisible: boolean
  ratingModalVisible: boolean
  studentUuid: string
  studentPassword: string
  studentUsername: string
  studentFirstname: string
  studentLastname: string
  studentRatings: { [name: string]: number }
  loading: boolean
  resetNameModalVisible: boolean
}

@inject('academyStore', 'studentsGroupsStore', 'ratingSystemStore')
@observer
export class Students extends React.Component<Props, State> {
  state = {
    showPassword: false,
    resetPasswordModalVisible: false,
    resetNameMovdalVisible: false,
    ratingModalVisible: false,
    studentUuid: '',
    studentPassword: '',
    studentUsername: '',
    studentFirstname: '',
    studentLastname: '',
    studentRatings: {},
    loading: false,
    resetNameModalVisible: false
  }

  componentDidMount() {
    this.props.ratingSystemStore.load()
  }

  handleShowPassword = () => {
    this.setState({ showPassword: true })
  }

  handlePasswordEdit = (uuid: string) => () => {
    this.setState({
      studentUuid: uuid,
      resetPasswordModalVisible: true
    })
  }

  handleRatingEdit = (uuid: string, ratings: Rating[]) => () => {
    const ratingObj = {}
    if (ratings) {
      ratings.forEach(r => {
        _.set(ratingObj, r.ratingSystemId, r.value)
      })
    }
    this.setState({
      studentUuid: uuid,
      studentRatings: ratingObj,
      ratingModalVisible: true
    })
  }

  handleResetOk = async () => {
    const success = await this.props.academyStore!.resetPassword(
      this.state.studentUuid,
      this.state.studentPassword
    )
    if (success) {
      message.success('Password has been reset successfully.')
      this.resetPasswordState()
    } else {
      message.error('Failed to reset password')
    }
  }

  handleResetCancel = () => {
    this.resetPasswordState()
  }

  resetPasswordState = () => {
    this.setState({
      resetPasswordModalVisible: false,
      studentUuid: '',
      studentPassword: ''
    })
  }

  onPasswordChange = (e: any) => {
    this.setState({
      studentPassword: e.target.value
    })
  }

  handleNameEdit = (
    username: string,
    firstname: string,
    lastname: string,
    uuid: string
  ) => () => {
    this.setState({
      studentUsername: username,
      studentFirstname: firstname,
      studentLastname: lastname,
      studentUuid: uuid,
      resetNameModalVisible: true
    })
  }

  handleResetNameOk = async () => {
    const resp: any = await this.props.academyStore!.resetDetails(
      this.state.studentUuid,
      this.state.studentUsername,
      this.state.studentFirstname,
      this.state.studentLastname
    )
    if (resp.success) {
      message.success(resp.message)
      this.resetFirstnameState(), this.resetLastnameState()
    } else {
      message.error(resp.message)
    }
  }

  handleResetNameCancel = () => {
    this.resetFirstnameState(), this.resetLastnameState()
  }

  resetFirstnameState = () => {
    this.setState({
      resetNameModalVisible: false,
      studentUuid: '',
      studentFirstname: ''
    })
  }

  resetLastnameState = () => {
    this.setState({
      resetNameModalVisible: false,
      studentUuid: '',
      studentLastname: ''
    })
  }

  onChange = (key: 'studentUsername') => (e: any) => {
    this.setState({
      [key]: e.target.value
    })
  }

  onFirstnameChange = (e: any) => {
    this.setState({
      studentFirstname: e.target.value
    })
  }

  onLastnameChange = (d: any) => {
    this.setState({
      studentLastname: d.target.value
    })
  }

  renderRating = (ratings: Rating[]) => {
    if (_.isEmpty(ratings)) {
      return ''
    }

    const ratingSystems = this.props.ratingSystemStore!.ratingSystems

    return ratingSystems
      .map(rs => {
        const rating = ratings.find(r => r.ratingSystemId == rs.id)
        if (!rating) {
          return `${rs.name}: Unrated`
        }
        return `${rs.name}: ${rating.value}`
      })
      .join(' | ')
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
            <span className="click-to-reveal" onClick={this.handleShowPassword}>
              Click to Reveal
            </span>
          )}
        </p>
        <div className="scroller">
          <List
            itemLayout="horizontal"
            dataSource={students}
            renderItem={(s: any) => (
              <List.Item
                key={s.uuid}
                actions={[
                  <Button
                    type="link"
                    size="small"
                    onClick={this.handleNameEdit(
                      s.username,
                      s.firstname,
                      s.lastname,
                      s.uuid
                    )}
                  >
                    Edit
                  </Button>,
                  <Button
                    type="link"
                    size="small"
                    onClick={this.handleRatingEdit(s.uuid, s.ratings)}
                  >
                    Ratings
                  </Button>,
                  <Button
                    type="link"
                    size="small"
                    onClick={this.handlePasswordEdit(s.uuid)}
                  >
                    Reset Password
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={
                    <>
                      <strong>{s.username}</strong> ({s.firstname}, {s.lastname}
                      )
                    </>
                  }
                  description={this.renderRating(s.ratings)}
                />
              </List.Item>
            )}
          />
        </div>
      </div>
    )
  }

  handleRatingChange = (ratingSystem: RatingSystem) => (event: any) => {
    this.setState({
      studentRatings: _.set(
        this.state.studentRatings,
        ratingSystem.id,
        parseInt(event.target.value) || 0
      )
    })
  }

  handleUpdateRating = async () => {
    this.setState({ loading: true })

    const ratings: Pick<Rating, 'ratingSystemId' | 'value'>[] = []

    _.forOwn(this.state.studentRatings, (value, ratingSystemId) =>
      ratings.push({ value, ratingSystemId })
    )

    const newRatings = await this.props.academyStore!.updateRatings(
      this.state.studentUuid,
      ratings
    )

    this.props.studentsGroupsStore!.updateStudentRatings(
      this.state.studentUuid,
      newRatings
    )
    this.closeRatingsModal()
  }

  closeRatingsModal = () => {
    this.setState({
      loading: false,
      ratingModalVisible: false,
      studentRatings: {}
    })
  }

  renderRatingModal = () => {
    const { ratingSystems } = this.props.ratingSystemStore
    return (
      <Modal
        title={getFormattedName(
          this.props.studentsGroupsStore!.students[this.state.studentUuid]
        )}
        visible={this.state.ratingModalVisible}
        onCancel={this.closeRatingsModal}
        footer={[
          <Button key="btn-rating-cancel" onClick={this.closeRatingsModal}>
            Cancel
          </Button>,
          <Button
            key="btn-rating-update"
            type="primary"
            loading={this.state.loading}
            onClick={this.handleUpdateRating}
          >
            Save
          </Button>
        ]}
      >
        <Row>
          {ratingSystems.map(rs => (
            <Col key={rs.id} span={24} style={{ padding: '.5rem' }}>
              <div>{rs.name}</div>
              <Input
                onChange={this.handleRatingChange(rs)}
                placeholder="rating"
                value={_.get(this.state.studentRatings, rs.id, 0)}
              />
            </Col>
          ))}
        </Row>
      </Modal>
    )
  }

  render() {
    const students = R.compose(
      R.map(R.nth(1)),
      R.toPairs
    )(this.props.studentsGroupsStore!.students)
    return (
      <div className="students inner">
        <div className="container">
          {this.renderStudents(students)}
          <Modal
            title="Reset Password"
            visible={this.state.resetPasswordModalVisible}
            onOk={this.handleResetOk}
            onCancel={this.handleResetCancel}
          >
            <Input
              type="text"
              value={this.state.studentPassword}
              onChange={this.onPasswordChange}
            />
          </Modal>
          <Modal
            title="Reset Name"
            visible={this.state.resetNameModalVisible}
            onOk={this.handleResetNameOk}
            onCancel={this.handleResetNameCancel}
          >
            <Form.Item>
              <Input
                type="text"
                placeholder="User Name"
                value={this.state.studentUsername}
                onChange={this.onChange('studentUsername')}
              />
            </Form.Item>
            <Form.Item>
              <Input
                type="text"
                placeholder="First Name"
                autoComplete="first-name"
                value={this.state.studentFirstname}
                onChange={this.onFirstnameChange}
              />
            </Form.Item>
            <Form.Item>
              <Input
                type="text"
                placeholder="Last Name"
                value={this.state.studentLastname}
                onChange={this.onLastnameChange}
              />
            </Form.Item>
          </Modal>
        </div>
        {this.renderRatingModal()}
      </div>
    )

    // if (this.props.studentsGroupsStore!.loading) {
    //   return (
    //     <div className="students inner">
    //       <States type="loading" />
    //     </div>
    //   )
    // }

    // if (this.props.studentsGroupsStore!.error) {
    //   return (
    //     <div className="students inner">
    //       <States type="error" exceptionText={this.props.studentsGroupsStore!.error} onClick={this.props.studentsGroupsStore!.load} />
    //     </div>
    //   )
    // }

    // if (R.keys(this.props.studentsGroupsStore!.students || {}).length === 0) {
    //   return (
    //     <div className="students inner">
    //       <States type="blank"
    //         icon="user-add"
    //         exceptionText="You have not any student so far"
    //       />
    //     </div>
    //   )
    // }

    // return (
    //   <div className="students inner">
    //     <div className="students-list">
    //       {R.values(this.props.studentsGroupsStore!.students).map((s: any) => {
    //         return (
    //           <div key={s.uuid}>{s.firstname} {s.lastname}</div>
    //         )
    //       })}
    //     </div>
    //   </div>
    // )
  }
}
