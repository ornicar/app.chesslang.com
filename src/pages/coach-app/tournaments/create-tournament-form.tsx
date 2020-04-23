import React, { Component } from 'react'
import {
  Layout,
  Steps,
  Row,
  Col,
  Form,
  Input,
  DatePicker,
  Select,
  Button,
  Tree,
  message,
  Icon,
  Table,
  TimePicker,
  Popconfirm,
  Modal,
  Divider,
  Spin
} from 'antd'
import { CreateTournamentFormStore } from '../../../stores/create-tournament-form'
import { inject, observer } from 'mobx-react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { FormComponentProps } from 'antd/es/form'
import { SetupChessboard } from '../../../components/chessboard/setup-chessboard'
import { ChessTypes } from '@chesslang/chess'

const { TreeNode } = Tree

import './create-tournament-form.less'
import moment from 'moment-timezone'
import { RouteComponentProps, withRouter } from 'react-router-dom'
import { StudentsGroupsStore } from '../../../stores/students-groups'
import { ConfiguredChessboard } from '../../../components/chessboard/configured-chessboard'
import { DEFAULT_FEN } from '../../../utils/utils'
import { RatingSystemStore } from '../../../stores/rating-system'
import { AcademyStore } from '../../../stores/academy'

interface Props extends RouteComponentProps<any> {
  createTournamentFormStore: CreateTournamentFormStore
}

@inject('createTournamentFormStore')
@observer
export default class CreateTournamentForm extends Component<Props> {
  componentDidMount() {
    if (this.props.match.params.uuid) {
      this.props.createTournamentFormStore.load(this.props.match.params.uuid)
    }
  }
  componentWillUnmount() {
    this.props.createTournamentFormStore.init()
  }

  render() {
    const WrappedTournamentDetailsStep = Form.create({ name: 'step_one' })(
      TournamentDetailsStep
    )
    const WrappedScheduleStep = Form.create({ name: 'step_two' })(
      withRouter(ScheduleStep)
    )
    const WrappedPartipantsStep = Form.create({ name: 'step_three' })(
      withRouter(PartipantsStep)
    )

    const steps = [
      {
        title: 'Details',
        content: <WrappedTournamentDetailsStep />
      },
      {
        title: 'Schedule',
        content: <WrappedScheduleStep />
      },
      {
        title: 'Participants',
        content: <WrappedPartipantsStep />
      }
    ]

    return (
      <Layout.Content className="content create-tournament-form">
        <Spin spinning={this.props.createTournamentFormStore!.loading}>
          <div className="inner">
            <h1>
              {this.props.createTournamentFormStore!.isEditing
                ? 'Edit tournament'
                : 'Create new tournament'}
            </h1>
            <Row>
              <Col offset={6} span={12}>
                <Steps
                  current={this.props.createTournamentFormStore.currentStep}
                >
                  {steps.map(item => (
                    <Steps.Step key={item.title} title={item.title} />
                  ))}
                </Steps>
              </Col>
            </Row>

            <Row style={{ padding: '1rem 0' }}>
              <Col span={24}>
                {
                  steps[this.props.createTournamentFormStore.currentStep]
                    .content
                }
              </Col>
            </Row>
          </div>
        </Spin>
      </Layout.Content>
    )
  }
}

interface TournamentDetailsStepProps {
  form: any
  createTournamentFormStore: CreateTournamentFormStore
  studentsGroupsStore: StudentsGroupsStore
  ratingSystemStore: RatingSystemStore
  academyStore: AcademyStore
}

interface TournamentDetailsStepState {
  // moves: String
  modalState: string
  selectedDatabase: { uuid: string; name: string }
  setupPositionModalVisible: boolean
  setupPositionFen: ChessTypes.FEN
  orientation: string
  gameType: string
}

@inject('createTournamentFormStore', 'ratingSystemStore', 'academyStore')
@observer
class TournamentDetailsStep extends Component<
  TournamentDetailsStepProps,
  TournamentDetailsStepState
> {
  state = {
    modalState: 'HIDDEN',
    selectedDatabase: { uuid: '', name: '' },
    setupPositionModalVisible: false,
    setupPositionFen: '',
    orientation: 'white',
    gameType: 'standard'
    // moves: []
  }

  componentDidMount() {
    this.props.academyStore.load().then(() => {
      this.props.ratingSystemStore.loadAcademyRatingSystems()
    })
    this.props.createTournamentFormStore!.loadBookOpenings()
  }

  handleSubmit = (event: any) => {
    event.preventDefault()
    this.props.form.validateFields((err: any, values: any) => {
      if (!err) {
        this.props.createTournamentFormStore.setTournamentDetails(values)
        this.props.createTournamentFormStore.generateSchedule()
        this.props.createTournamentFormStore.gotoScheduleStep()
      }
    })
  }

  greaterThanOrEqualTo = (minValue: number) => {
    return (rule: any, value: number, callback: any) => {
      if (value && value < minValue) {
        callback(`Field value must be at least ${minValue}`)
      } else {
        callback()
      }
    }
  }

  handleSetupPosition = () => {
    this.setState({
      setupPositionModalVisible: true,
      setupPositionFen: this.props.createTournamentFormStore!.initialFen
    })
  }

  handleSetupPositionCancel = () => {
    this.setState({
      setupPositionModalVisible: false,
      setupPositionFen: ''
    })
  }

  handleSetupPositionOk = () => {
    this.props.createTournamentFormStore!.setInitialFen(
      this.state.setupPositionFen
    )
    this.setState({
      setupPositionModalVisible: false
    })
  }

  handleSetupPositionFenChange = (fen: any) => {
    this.setState({
      setupPositionFen: fen
    })
  }

  handleFenChange = (e: any) => {
    this.props.createTournamentFormStore!.setInitialFen(e.target.value)
  }

  handleBookFenChange = (fen: any) => {
    this.props.createTournamentFormStore!.setInitialFen(fen)
  }

  validateFen = (_: any, value: string, callback: Function) => {
    const isValid: any = this.props.createTournamentFormStore!.isValidFen(value)
    if (isValid.valid === false) {
      callback(isValid.error)
      return
    }
    callback()
  }

  setStandardFen = () => {
    if (this.state.gameType === 'standard') {
      const fen = DEFAULT_FEN
      this.props.createTournamentFormStore!.setInitialFen(fen)
    }
  }

  render() {
    const { getFieldDecorator } = this.props.form

    const gameTypes = [
      {
        type: 'standard',
        title: 'Standard'
      },
      {
        type: 'book_opening',
        title: 'Book Opening'
      },
      {
        type: 'custom_fen',
        title: 'Custom FEN'
      }
    ]

    return (
      <Form onSubmit={this.handleSubmit}>
        <Form.Item label="Tournament name">
          {getFieldDecorator('name', {
            initialValue:
              this.props.createTournamentFormStore.tournamentDetails.name || '',
            rules: [{ required: true }]
          })(<Input placeholder="Tournament name" />)}
        </Form.Item>

        <Form.Item label="Description">
          {getFieldDecorator('description', {
            initialValue:
              this.props.createTournamentFormStore.tournamentDetails
                .description || ''
          })(<ReactQuill />)}
        </Form.Item>

        <Row>
          <Col span={8}>
            <Form.Item label="Choose date range" labelAlign="left">
              {getFieldDecorator('time_range', {
                initialValue: this.props.createTournamentFormStore
                  .tournamentDetails.time_range || [moment(), moment()],
                rules: [{ required: true }]
              })(
                <DatePicker.RangePicker
                  format="YYYY-MM-DD"
                  placeholder={['Start Date', 'End Date']}
                />
              )}
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Choose start time ( HH:MM )" labelAlign="left">
              {getFieldDecorator('start_time', {
                initialValue: moment(
                  this.props.createTournamentFormStore.tournamentDetails
                    .start_time,
                  'HH:mm'
                ),
                rules: [{ required: true }]
              })(<TimePicker format="HH:mm" />)}
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item label="Timezone">
              {getFieldDecorator('timezone', {
                initialValue:
                  this.props.createTournamentFormStore.tournamentDetails
                    .timezone || 'Asia/Kolkata',
                rules: [{ required: true }]
              })(
                <Select
                  showSearch
                  filterOption={(input, option: any) =>
                    option.props.children
                      .toLowerCase()
                      .indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {moment.tz.names().map(tz => {
                    return (
                      <Select.Option key={tz} value={tz}>
                        {tz}
                      </Select.Option>
                    )
                  })}
                </Select>
              )}
            </Form.Item>
          </Col>
        </Row>

        <Row>
          <Col span={12}>
            <Form.Item label="Rating System" style={{ paddingRight: 8 }}>
              {getFieldDecorator('rating_system_id', {
                initialValue:
                  this.props.createTournamentFormStore.tournamentDetails
                    .rating_system_id || null
              })(
                <Select>
                  <Select.Option value={null}>Unrated</Select.Option>
                  {this.props.ratingSystemStore.ratingSystems.map(rs => (
                    <Select.Option key={rs.id} value={rs.id}>
                      {rs.name}
                    </Select.Option>
                  ))}
                </Select>
              )}
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label="Number of rounds" style={{ paddingRight: 8 }}>
              {getFieldDecorator('rounds', {
                initialValue:
                  this.props.createTournamentFormStore.tournamentDetails
                    .rounds || '1',
                rules: [
                  { required: true },
                  {
                    validator: this.greaterThanOrEqualTo(1)
                  }
                ]
              })(<Input placeholder="Number of rounds" type="number" />)}
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Time Control ( minutes )"
              style={{ paddingRight: 8 }}
            >
              {getFieldDecorator('time_control', {
                initialValue:
                  this.props.createTournamentFormStore.tournamentDetails
                    .time_control || 10,
                rules: [
                  {
                    required: true,
                    message: 'Time Control is required'
                  },
                  {
                    validator: this.greaterThanOrEqualTo(2)
                  }
                ]
              })(<Input placeholder="Time Control" type="number" />)}
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Time Increment per move ( seconds )"
              style={{ paddingRight: 8 }}
            >
              {getFieldDecorator('time_increment', {
                initialValue:
                  this.props.createTournamentFormStore.tournamentDetails
                    .time_increment || 3,
                rules: [
                  { required: true, message: 'Time Increment is required' },
                  {
                    validator: this.greaterThanOrEqualTo(0)
                  }
                ]
              })(<Input placeholder="Time Increment" type="number" />)}
            </Form.Item>
          </Col>
        </Row>

        <Row>
          <Col span={3}>
            <Form.Item label="Game type" style={{ marginRight: 8 }}>
              {getFieldDecorator('game_type', {
                initialValue:
                  this.props.createTournamentFormStore.initialFen != DEFAULT_FEN
                    ? 'custom_fen'
                    : 'standard',
                rules: [{ required: true }]
              })(
                <Select
                  onChange={type =>
                    this.setState({ gameType: type.toString() }, () => {
                      this.setStandardFen()
                    })
                  }
                >
                  {gameTypes.map(({ type, title }) => (
                    <Select.Option key={type} value={type}>
                      {title}
                    </Select.Option>
                  ))}
                </Select>
              )}
            </Form.Item>
          </Col>

          {this.state.gameType === 'custom_fen' && (
            <Col span={10}>
              <Form.Item label="FEN:">
                {getFieldDecorator('custom_fen', {
                  initialValue: this.props.createTournamentFormStore.initialFen,
                  rules: [
                    {
                      required: true,
                      message: 'Valid FEN required'
                    },
                    {
                      validator: this.validateFen
                    }
                  ]
                })(
                  <Input
                    style={{ display: 'block' }}
                    onChange={this.handleFenChange}
                  />
                )}
              </Form.Item>
            </Col>
          )}

          {this.state.gameType === 'book_opening' && (
            <Col span={10}>
              <Form.Item label="Book Openings">
                {getFieldDecorator('openings', {
                  initialValue: '',
                  rules: [{ required: true }]
                })(
                  <Select
                    onChange={this.handleBookFenChange}
                    showSearch
                    filterOption={(input, option: any) =>
                      option.props.children
                        .toLowerCase()
                        .indexOf(input.toLowerCase()) >= 0
                    }
                  >
                    {this.props.createTournamentFormStore.bookOpenings.map(
                      ({ name, fen }) => {
                        return (
                          <Select.Option key={name} value={fen}>
                            {name}
                          </Select.Option>
                        )
                      }
                    )}
                  </Select>
                )}
              </Form.Item>
            </Col>
          )}
          <Col
            span={9}
            style={{
              padding: '5px',
              verticalAlign: 'middle',
              marginTop: '30px'
            }}
          >
            <ConfiguredChessboard
              fen={this.props.createTournamentFormStore.initialFen}
              width={150}
              height={150}
              interactionMode="NONE"
            />
            {this.state.gameType != 'standard' && (
              <Button
                onClick={this.handleSetupPosition}
                style={{ width: 150, top: 5 }}
              >
                Setup Chessboard
              </Button>
            )}
          </Col>
        </Row>
        {this.state.setupPositionModalVisible && (
          <Modal
            title="Setup Position"
            visible={this.state.setupPositionModalVisible}
            style={{ top: 25 }}
            width={800}
            maskClosable={false}
            onCancel={this.handleSetupPositionCancel}
            onOk={this.handleSetupPositionOk}
          >
            <div className="position-setup-modal" title="Setup Position">
              <SetupChessboard
                width={550}
                height={550}
                initialFen={this.state.setupPositionFen as ChessTypes.FEN}
                onChange={this.handleSetupPositionFenChange}
              />
            </div>
          </Modal>
        )}
        <Form.Item>
          <Button
            style={{ marginTop: '1rem' }}
            type="primary"
            htmlType="submit"
          >
            Next
          </Button>
        </Form.Item>
      </Form>
    )
  }
}

interface ScheduleStepProps extends RouteComponentProps<any> {
  createTournamentFormStore: CreateTournamentFormStore
}

const EditableContext = React.createContext({})

interface EditableCellProps {
  inputType: string
}

class EditableCell extends React.Component<EditableCellProps> {
  getInput = () => {
    if (this.props.inputType === 'datepicker') {
      return <DatePicker />
    } else if (this.props.inputType === 'timepicker') {
      return <TimePicker format="HH:mm" />
    }
    return <Input />
  }

  renderCell = ({ getFieldDecorator }: any) => {
    const {
      editing,
      dataIndex,
      title,
      inputType,
      record,
      index,
      children,
      ...restProps
    }: any = this.props
    return (
      <td {...restProps}>
        {editing ? (
          <Form.Item style={{ margin: 0 }}>
            {getFieldDecorator(dataIndex, {
              initialValue: this.formatFieldValue(record[dataIndex], inputType)
            })(this.getInput())}
          </Form.Item>
        ) : (
          children
        )}
      </td>
    )
  }

  formatFieldValue(value: any, type: string) {
    if (type == 'datepicker') {
      return moment(value)
    } else if (type == 'timepicker') {
      return moment(value, 'HH:mm:ss')
    }
  }

  render() {
    return (
      <EditableContext.Consumer>{this.renderCell}</EditableContext.Consumer>
    )
  }
}

interface EditableTableProps extends FormComponentProps {
  createTournamentFormStore: CreateTournamentFormStore
}

interface EditableTableState {
  editingKey: string
}

@inject('createTournamentFormStore')
@observer
class EditableTable extends React.Component<
  EditableTableProps,
  EditableTableState
> {
  columns = [
    {
      title: 'Round',
      dataIndex: 'round',
      key: 'round'
    },
    {
      key: 'date',
      title: 'Date',
      dataIndex: 'date',
      onCell: (record: any) => ({
        record,
        inputType: 'datepicker',
        title: 'Date',
        dataIndex: 'date',
        editing: this.isEditing(record)
      })
    },
    {
      key: 'start_time',
      title: 'Start Time',
      dataIndex: 'start_time',
      onCell: (record: any) => ({
        record,
        inputType: 'timepicker',
        title: 'Start Time',
        dataIndex: 'start_time',
        editing: this.isEditing(record)
      })
    },
    {
      title: 'Action',
      dataIndex: 'action',
      render: (text: any, record: any) => {
        const { editingKey } = this.state
        const editable = this.isEditing(record)
        console.log({ editable })
        return editable ? (
          <span>
            <EditableContext.Consumer>
              {form => (
                <a
                  onClick={() => this.save(form, record.key)}
                  style={{ marginRight: 8 }}
                >
                  Save
                </a>
              )}
            </EditableContext.Consumer>
            <Divider type="vertical" />
            <Popconfirm title="Sure to cancel?" onConfirm={() => this.cancel()}>
              <a>Cancel</a>
            </Popconfirm>
          </span>
        ) : (
          <Button
            disabled={editingKey !== ''}
            onClick={() => this.edit(record.key)}
          >
            Edit
          </Button>
        )
      }
    }
  ]

  constructor(props: EditableTableProps) {
    super(props)

    this.state = {
      editingKey: ''
    }
  }

  isEditing = ({ key }: any) => key === this.state.editingKey

  cancel = () => {
    this.setState({ editingKey: '' })
  }

  save(form: any, key: string) {
    form.validateFields((error: any, row: any) => {
      if (error) {
        return
      }
      const newData = [...this.props.createTournamentFormStore.schedule]
      const index = newData.findIndex(item => key === item.key)
      if (index > -1) {
        const item = newData[index]
        newData.splice(index, 1, {
          ...item,
          start_time: row.start_time.format('hh:mm'),
          date: row.date.format('DD MMM, YYYY')
        })
        this.props.createTournamentFormStore.schedule = newData
        this.setState({ editingKey: '' })
      }
    })
  }

  edit(key: string) {
    this.setState({ editingKey: key })
  }

  render() {
    const components = {
      body: {
        cell: EditableCell
      }
    }

    return (
      <EditableContext.Provider value={this.props.form}>
        <Table
          components={components}
          dataSource={this.props.createTournamentFormStore.schedule}
          columns={this.columns}
        />
      </EditableContext.Provider>
    )
  }
}

const EditableFormTable = Form.create()(EditableTable)

@inject('createTournamentFormStore')
@observer
class ScheduleStep extends Component<ScheduleStepProps> {
  handleBufferMinutesChange = (ev: any) => {
    this.props.createTournamentFormStore.setBufferMinutes(ev.target.value)
  }

  handleGenerateSchedule = () => {
    this.props.createTournamentFormStore.generateSchedule()
  }

  render() {
    return (
      <div>
        {/* <Row className="detail-section" type="flex" align="middle">
          <Col md={4} sm={24}>
            Buffer Time
          </Col>
          <Col md={4} sm={24}>
            <Input
              type="number"
              addonAfter="minutes"
              value={this.props.createTournamentFormStore.bufferMinutes}
              onChange={this.handleBufferMinutesChange}
            />
          </Col>
          <Col md={4} sm={24}>
            <Button
              type="primary"
              style={{ marginLeft: '1rem' }}
              onClick={this.handleGenerateSchedule}
            >
              Generate Schedule
            </Button>
          </Col>
        </Row> */}
        <Row
          className="detail-section"
          style={{ marginTop: '1rem' }}
          type="flex"
          align="middle"
        >
          <Col md={4} sm={24}>
            Schedule
          </Col>
          <Col md={20} sm={24}>
            <EditableFormTable />
          </Col>
        </Row>
        <Row>
          <Col md={4} sm={24}>
            <Button
              style={{ marginRight: '.25rem' }}
              onClick={this.props.createTournamentFormStore.gotoDetailsStep}
            >
              Previous
            </Button>
            <Button
              type="primary"
              style={{ marginRight: '.25rem' }}
              onClick={
                this.props.createTournamentFormStore.gotoParticipantsStep
              }
            >
              Next
            </Button>
          </Col>
        </Row>
      </div>
    )
  }
}

interface PartipantsStepProps extends RouteComponentProps<any> {
  createTournamentFormStore: CreateTournamentFormStore
  studentsGroupsStore: StudentsGroupsStore
}

@inject('createTournamentFormStore', 'studentsGroupsStore')
@observer
class PartipantsStep extends Component<PartipantsStepProps> {
  componentDidMount() {
    this.props.studentsGroupsStore.load()
  }

  upsert = async () => {
    const { createTournamentFormStore } = this.props

    if (createTournamentFormStore.participants.length < 2) {
      return message.info('At least 2 participants are required')
    }

    const response = createTournamentFormStore!.isEditing
      ? await createTournamentFormStore.update()
      : await createTournamentFormStore.create()

    if (response.status != 200) {
      return message.error(
        'Error while creating/editing tournament. Please try again later.'
      )
    }

    this.props.history.push('/app/tournaments/' + response.data.uuid)
  }

  onCheck = (checkedKeys: any) => {
    this.props.createTournamentFormStore.setCheckedKeys(checkedKeys)
  }

  loadingDisplay() {
    return (
      <div className={'loadingOverlay'} style={{ height: 500 }}>
        <Icon type="loading" />
      </div>
    )
  }

  renderStudentTree(students: any) {
    return students.map((s: any) => (
      <TreeNode
        title={`${s.firstname}, ${s.lastname} (${s.username})`}
        key={`student-${s.uuid}`}
      ></TreeNode>
    ))
  }

  render() {
    return (
      <div>
        {this.props.studentsGroupsStore.loading && this.loadingDisplay()}

        {!this.props.studentsGroupsStore.loading && (
          <>
            <Tree
              className="participants-section"
              checkable
              onCheck={this.onCheck}
              defaultCheckedKeys={
                this.props.createTournamentFormStore!.checkedKeys
              }
            >
              <TreeNode title="Groups" key="groups">
                {this.props.studentsGroupsStore.groups &&
                  Object.values(this.props.studentsGroupsStore.groups).map(
                    (g: any) => (
                      <TreeNode title={g.name} key={`group-${g.uuid}`}>
                        {this.renderStudentTree(
                          g.userIds
                            .map(
                              (id: string) =>
                                this.props.studentsGroupsStore.students[id]
                            )
                            .filter((s: any) => s != null)
                        )}
                      </TreeNode>
                    )
                  )}
              </TreeNode>
              <TreeNode title="All students" key="all">
                {this.props.studentsGroupsStore.students &&
                  this.renderStudentTree(
                    Object.values(this.props.studentsGroupsStore.students)
                  )}
              </TreeNode>
            </Tree>

            <Button
              style={{ marginRight: '.25rem' }}
              onClick={this.props.createTournamentFormStore.gotoScheduleStep}
            >
              Previous
            </Button>
            <Button
              type="primary"
              loading={this.props.createTournamentFormStore!.loading}
              onClick={this.upsert}
            >
              {this.props.createTournamentFormStore!.isEditing
                ? 'Save'
                : 'Create'}
            </Button>
          </>
        )}
      </div>
    )
  }
}
