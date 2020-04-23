import * as React from 'react'
import * as R from 'ramda'
import {
  message,
  Modal,
  InputNumber,
  Button,
  Drawer,
  Form,
  Radio,
  Input,
  Select,
  DatePicker,
  Checkbox,
  Icon
} from 'antd'
import { FormComponentProps } from 'antd/lib/form'
import moment, { Moment } from 'moment'

import './create-exercise-drawer.less'

import { ExerciseStore } from '../../../../../stores/exercise'
import { PublicProblembaseStore } from '../../../../../stores/public-problembase'
import { PrivateProblembaseStore } from '../../../../../stores/private-problembase'
import { ProblembaseContentStore } from '../../../../../stores/problembase-content'
import ProblembaseDrawer from '../problembase-drawer/problembase-drawer'
import { inject, observer } from 'mobx-react'

const TODAY_MOMENT = moment()

const EXERCISE_TAGS = [
  'pin',
  'fork',
  'double attack',
  'double check',
  'discovered check',
  'inteference',
  'backrank',
  'clearance',
  'queen sacrifice',
  'overloaded piece',
  'pawn promotion',
  'skewer',
  'zugzwang',
  'blockade',
  'space clearance',
  'intermediate move',
  'x-ray attack',
  'defence elimination',
  'surprise move',
  'opening trap',
  'endgame study',
  'mate in one',
  'mate in two',
  'mate in three'
]

interface Props extends FormComponentProps {
  visible: boolean
  onClose: () => any
  publicProblembaseStore?: PublicProblembaseStore
  privateProblembaseStore?: PrivateProblembaseStore
  problembaseContentStore?: ProblembaseContentStore
  exerciseStore?: ExerciseStore
}

interface State {
  showLimitExceededModal: boolean
  batchSize: number
  confirmDirty: boolean
  problembaseDrawerVisible: boolean
  selectedProblembaseUuid: string
  selectedProblemUuids: string[]
  selectedProblemUuidsError: string
  formFields: {
    name: string
    description: string
    level: string
    tags: string[]
    assignOnCreation: boolean
    students: string[]
    scheduleDate: Moment
    deadlineDate: Moment
  }
}

@inject('exerciseStore')
@observer
class WrappedCreateExerciseDrawer extends React.Component<Props, State> {
  MAX_BATCH_SIZE = 50
  state = {
    showLimitExceededModal: false,
    batchSize: 20,
    confirmDirty: false,
    problembaseDrawerVisible: false,
    selectedProblembaseUuid: '',
    selectedProblemUuids: [],
    selectedProblemUuidsError: '',
    formFields: {
      name: '',
      description: '',
      level: '',
      tags: [],
      assignOnCreation: false,
      students: [],
      scheduleDate: moment.utc(TODAY_MOMENT),
      deadlineDate: moment.utc(TODAY_MOMENT).add(10, 'days')
    }
  }

  handleCleanupAndClose = () => {
    this.setState(
      {
        problembaseDrawerVisible: false,
        selectedProblembaseUuid: '',
        selectedProblemUuids: [],
        selectedProblemUuidsError: ''
      },
      () => {
        this.props.form.resetFields()
        this.props.onClose()
      }
    )
  }

  handleProblembaseDrawerClose = () => {
    this.setState({
      problembaseDrawerVisible: false
    })
  }

  handleAddProblemsClick = () => {
    this.setState({
      problembaseDrawerVisible: true
    })
  }

  handleSelectedProblemsChange = (uuids: string[]) => {
    this.setState({
      selectedProblemUuids: uuids
    })
  }

  handleSubmit = (e: any) => {
    e.preventDefault()
    if (
      this.state.selectedProblemUuids.length > 0 &&
      this.state.selectedProblemUuids.length <= this.MAX_BATCH_SIZE
    ) {
      this.setState(
        {
          selectedProblemUuidsError: ''
        },
        () => {
          this.props.form.validateFieldsAndScroll(
            async (err: any, values: any) => {
              if (!err) {
                const data = {
                  name: this.props.form.getFieldValue('name'),
                  description: this.props.form.getFieldValue('description'),
                  tags: this.props.form.getFieldValue('tags'),
                  problemIds: this.state.selectedProblemUuids,
                  difficultyLevel: this.props.form.getFieldValue('level')
                }

                const success = await this.props.exerciseStore!.submit(data)
                if (success) {
                  message.success('Created Exercise.')
                  this.handleCleanupAndClose()
                } else {
                  message.error('Failed to create exercise.')
                }
              }
            }
          )
        }
      )
    } else if (this.state.selectedProblemUuids.length > this.MAX_BATCH_SIZE) {
      this.props.form.validateFieldsAndScroll((err: any, values: any) => {
        if (err) {
          return
        }

        this.setState({
          selectedProblemUuidsError: '',
          showLimitExceededModal: true
        })
      })
    } else {
      this.setState({ selectedProblemUuidsError: 'Add a few problems' })
    }
  }

  handleLimitExceededOk = async (e: any) => {
    this.setState({ showLimitExceededModal: false })

    const name = this.props.form.getFieldValue('name')
    const description = this.props.form.getFieldValue('description')
    const tags = this.props.form.getFieldValue('tags')
    const difficultyLevel = this.props.form.getFieldValue('level')

    let success = true

    for (
      let i = 0;
      i * this.state.batchSize < this.state.selectedProblemUuids.length;
      i++
    ) {
      success &= await this.props.exerciseStore!.submit({
        name: `${name}-${i + 1}`,
        description,
        tags,
        problemIds: this.state.selectedProblemUuids.slice(
          this.state.batchSize * i,
          this.state.batchSize * (i + 1)
        ),
        difficultyLevel
      })
    }

    if (success) {
      message.success('Created Exercise.')
    } else {
      // TODO: Rollback when creation fails
      message.error('Failed to create exercise.')
    }

    this.handleCleanupAndClose()
  }

  handleLimitExceededCancel = (e: any) => {
    this.setState({ showLimitExceededModal: false })
  }

  handleBatchSizeChange = (batchSize: number) => {
    this.setState({ batchSize })
  }

  handleConfirmBlur = (e: any) => {
    const value = e.target.value
    this.setState({ confirmDirty: this.state.confirmDirty || !!value })
  }

  renderSubmittingState = () => {
    return (
      <div className="drawer-inner">
        <div className="title">
          <h3>Create Exercise</h3>
        </div>
        <div className="content">
          <div className="loading-state container">
            <Icon type="loading" spin={true} />
            <p className="exception-text">Submitting</p>
          </div>
        </div>
        <div className="button-bar">
          <Button className="cancel-button" onClick={this.props.onClose}>
            Close
          </Button>
          <Button type="primary" disabled={true}>
            Submit
          </Button>
        </div>
      </div>
    )
  }

  renderSubmitErrorState = () => {
    return (
      <div className="drawer-inner">
        <div className="title">
          <h3>Create Exercise</h3>
        </div>
        <div className="content">
          <div className="error-state container">
            <Icon type="exception" />
            <p className="exception-text">Error submitting exercise.</p>
            <span className="action-text">
              <Button type="danger" onClick={this.handleSubmit}>
                Retry
              </Button>
            </span>
          </div>
        </div>
        <div className="button-bar">
          <Button className="cancel-button" onClick={this.props.onClose}>
            Close
          </Button>
          <Button type="primary" disabled={true}>
            Submit
          </Button>
        </div>
      </div>
    )
  }

  renderContent = () => {
    if (this.props.exerciseStore!.submitting) {
      return this.renderSubmittingState()
    }

    if (this.props.exerciseStore!.submitError) {
      return this.renderSubmitErrorState()
    }

    const { getFieldDecorator } = this.props.form
    const exerciseTagOptions = EXERCISE_TAGS.map(t => (
      <Select.Option key={t} value={t}>
        {t}
      </Select.Option>
    ))

    return (
      <div className="drawer-inner">
        <Modal
          title="Split exercise"
          visible={this.state.showLimitExceededModal}
          onOk={this.handleLimitExceededOk}
          onCancel={this.handleLimitExceededCancel}
        >
          {/* You have exceeded the max number of problems for an exercise (
          {this.MAX_BATCH_SIZE}). Would you like to split it into batches of */}
          We recommend splitting the exercise to less than {this.MAX_BATCH_SIZE}{' '}
          per batch. Would you like to split it into batches of
          <InputNumber
            style={{ width: '60px' }}
            className="batch-size"
            min={1}
            max={this.MAX_BATCH_SIZE}
            defaultValue={20}
            value={this.state.batchSize}
            onChange={this.handleBatchSizeChange}
          />{' '}
          ?
        </Modal>
        <div className="title">
          <h3>Create Exercise</h3>
        </div>
        <div className="content">
          <Form className="create-exercise-form">
            <Form.Item>
              {getFieldDecorator('name', {
                rules: [
                  {
                    required: true,
                    message: 'Name is required'
                  }
                ]
              })(<Input placeholder="Name" autoComplete="false" />)}
            </Form.Item>
            <Form.Item>
              {getFieldDecorator('description')(
                <Input.TextArea
                  rows={3}
                  placeholder="Description"
                  autoComplete="false"
                />
              )}
            </Form.Item>
            <Form.Item>
              {getFieldDecorator('level', {
                rules: [
                  {
                    required: true,
                    message: 'Level is required'
                  }
                ]
              })(
                <Radio.Group size="large">
                  <Radio value="easy">Beginner</Radio>
                  <Radio value="medium">Intermediate</Radio>
                  <Radio value="hard">Advanced</Radio>
                </Radio.Group>
              )}
            </Form.Item>
            <Button onClick={this.handleAddProblemsClick}>
              Add Problems{' '}
              {this.state.selectedProblemUuids.length > 0
                ? `(${this.state.selectedProblemUuids.length} selected)`
                : ''}
            </Button>
            <div
              className="ant-form-item-control has-error"
              style={{ marginTop: 8 }}
            >
              <div className="ant-form-explain">
                {this.state.selectedProblemUuidsError &&
                this.state.selectedProblemUuids.length === 0
                  ? this.state.selectedProblemUuidsError
                  : ''}
              </div>
            </div>
            <Form.Item className="tags-field">
              {getFieldDecorator('tags')(
                <Select mode="multiple" placeholder="Tags">
                  {exerciseTagOptions}
                </Select>
              )}
            </Form.Item>
          </Form>
        </div>
        <div className="button-bar">
          <Button
            className="cancel-button"
            onClick={this.handleCleanupAndClose}
          >
            Cancel
          </Button>
          <Button type="primary" onClick={this.handleSubmit}>
            Submit
          </Button>
        </div>
      </div>
    )
  }

  renderProblembaseViewDrawer = () => {}

  render() {
    return (
      <Drawer
        className="create-exercise-drawer"
        width={450}
        placement="right"
        onClose={this.props.onClose}
        maskClosable={false}
        closable={false}
        visible={this.props.visible}
      >
        <ProblembaseDrawer
          onClose={this.handleProblembaseDrawerClose}
          visible={this.state.problembaseDrawerVisible}
          onSelectedProblemsChange={this.handleSelectedProblemsChange}
          selectedProblemUuids={this.state.selectedProblemUuids}
        />
        {this.renderContent()}
      </Drawer>
    )
  }
}

export const CreateExerciseDrawer = Form.create()(WrappedCreateExerciseDrawer)
