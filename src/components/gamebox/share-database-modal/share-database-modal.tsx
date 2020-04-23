import * as R from 'ramda'
import React from 'react'
import { inject, observer } from 'mobx-react'
import { message, Modal, Select } from 'antd'
import Form, { FormComponentProps } from 'antd/lib/form'

import './share-database-modal.less'
import { StudentsGroupsStore } from '../../../stores/students-groups'
import { userStore } from '../../../stores/user'
import { GameboxDatabaseStore } from '../../../stores/gamebox-database'
import { CoachNetworkStore } from '../../../stores/coach-network'

interface Props extends FormComponentProps {
  type: 'student' | 'coach'
  databaseUuid: string
  gameboxDatabaseStore?: GameboxDatabaseStore
  coachNetworkStore?: CoachNetworkStore
  studentsGroupsStore?: StudentsGroupsStore
  registerSubmitHandler: (submitHandler: Function) => any
  cleanupAndClose: () => any
}

interface State {
  confirmDirty: boolean
  loading: boolean
  formFields: {
    coaches: string[]
    students: string[]
  }
}

const INIT_STATE: State = {
  confirmDirty: false,
  loading: false,
  formFields: {
    coaches: [],
    students: []
  }
}

@inject('studentsGroupsStore', 'coachNetworkStore', 'gameboxDatabaseStore')
@observer
class WrappedShareDatabaseModal extends React.Component<Props, State> {
  state = INIT_STATE

  async componentDidMount() {
    await this.load()
    this.props.registerSubmitHandler(this.handleShare.bind(this))
  }

  async load() {
    if (this.props.type === 'coach') {
      await this.props.studentsGroupsStore!.load()
    }
    if (this.props.type === 'student') {
      await this.props.coachNetworkStore!.load()
    }
  }

  studentSelectFilterOption = (inputValue: string, option: any) => {
    return (
      option.props.children
        .toString()
        .toLowerCase()
        .indexOf(inputValue.toLowerCase()) >= 0
    )
  }

  coachSelectFilterOption = (inputValue: string, option: any) => {
    return (
      option.props.children
        .toString()
        .toLowerCase()
        .indexOf(inputValue.toLowerCase()) >= 0
    )
  }

  handleShare = () => {
    this.props.form.validateFieldsAndScroll(async (err: any, values: any) => {
      if (!err) {
        const userUuids = (() => {
          if (this.props.type === 'coach') {
            const [studentUuids, groupUuids] = R.partition(
              uuid => this.props.studentsGroupsStore!.students[uuid],
              this.props.form.getFieldValue('students')
            )
            const studentUuidsFromGroups = R.chain(
              uuid => this.props.studentsGroupsStore!.groups[uuid].userIds,
              groupUuids
            )

            return R.concat(studentUuids, studentUuidsFromGroups) as string[]
          }

          if (this.props.type === 'student') {
            return this.props.form.getFieldValue('coaches')
          }

          return [] as string[]
        })()

        try {
          this.setState({ loading: true })

          const response = await userStore
            .getApiCoreAxiosClient()!
            .put(`game-collections/${this.props.databaseUuid}/share`, {
              sharedWith: userUuids.map((uuid: string) => ({
                user_uuid: uuid,
                type: 'w'
              }))
            })
          message.success('Database shared successfuly')
          this.props.cleanupAndClose()
        } catch (e) {
          message.error('Error sharing database')
        } finally {
          this.setState({ loading: false })
        }
      }
    })
  }

  render() {
    const { getFieldDecorator } = this.props.form
    const database = this.props.gameboxDatabaseStore!.findByUuid(
      this.props.databaseUuid
    )

    if (this.props.type === 'coach') {
      const studentIds = database
        ? database.sharedWith.map(({ user_uuid }: any) => user_uuid)
        : []

      return (
        <Form>
          <Form.Item>
            {getFieldDecorator('students', {
              initialValue: studentIds
            })(
              <Select
                size="large"
                mode="multiple"
                placeholder="Students and Groups"
                filterOption={this.studentSelectFilterOption}
                disabled={this.props.studentsGroupsStore!.loading}
              >
                <Select.OptGroup key="students" label="Students">
                  {R.values(this.props.studentsGroupsStore!.students).map(
                    (s: any) => (
                      <Select.Option key={s.uuid} value={s.uuid}>
                        {s.firstname + ', ' + s.lastname} ({s.username})
                      </Select.Option>
                    )
                  )}
                </Select.OptGroup>
                <Select.OptGroup key="groups" label="Groups">
                  {R.values(this.props.studentsGroupsStore!.groups).map(
                    (g: any) => (
                      <Select.Option key={g.uuid} value={g.uuid}>
                        {g.name}
                      </Select.Option>
                    )
                  )}
                </Select.OptGroup>
              </Select>
            )}
          </Form.Item>
        </Form>
      )
    }

    if (this.props.type === 'student') {
      const coachIds = database
        ? database.sharedWith.map(({ user_uuid }: any) => user_uuid)
        : []

      return (
        <Form>
          <Form.Item>
            {getFieldDecorator('coaches', {
              initialValue: coachIds
            })(
              <Select
                size="large"
                mode="multiple"
                placeholder="Coaches"
                filterOption={this.coachSelectFilterOption}
                disabled={this.props.coachNetworkStore!.loading}
              >
                {R.values(this.props.coachNetworkStore!.coaches).map(
                  (c: any) => (
                    <Select.Option key={c.uuid} value={c.uuid}>
                      {c.firstname + ', ' + c.lastname} ({c.username})
                    </Select.Option>
                  )
                )}
              </Select>
            )}
          </Form.Item>
        </Form>
      )
    }
  }
}

const ShareModalForm = Form.create()(WrappedShareDatabaseModal)

interface OuterProps {
  type: 'student' | 'coach'
  visible: boolean
  databaseUuid: string
  onClose: () => any
}

interface OuterState {
  loading: boolean
}

export default class ShareDatabaseModal extends React.Component<
  OuterProps,
  OuterState
> {
  state = {
    loading: false
  }

  submitHandler: Function | null = null

  cleanUpAndClose = () => {
    this.props.onClose()
    this.setState({ loading: false })
  }

  handleRegisterSubmitHandler = (handler: Function) => {
    this.submitHandler = handler
  }

  handleShare = () => {
    if (this.submitHandler) {
      this.submitHandler()
    }
  }

  render() {
    return (
      <Modal
        title="Share Database"
        style={{ width: 600 }}
        visible={this.props.visible}
        onCancel={this.cleanUpAndClose}
        maskClosable={false}
        okButtonProps={{
          loading: this.state.loading
        }}
        okText="Share"
        closable={!this.state.loading}
        destroyOnClose={true}
        onOk={this.handleShare}
      >
        <ShareModalForm
          type={this.props.type}
          databaseUuid={this.props.databaseUuid}
          registerSubmitHandler={this.handleRegisterSubmitHandler}
          cleanupAndClose={this.cleanUpAndClose}
        />
      </Modal>
    )
  }
}
