import * as React from 'react'
import * as R from 'ramda'
import {
  Layout,
  Input,
  Icon,
  Select,
  Divider,
  Tag,
  Tabs,
  Button,
  Drawer,
  Form,
  Modal,
  Popconfirm
} from 'antd'
import { inject, observer } from 'mobx-react'
import { withRouter } from 'react-router-dom'
import { PracticeStore } from '../../../../stores/practice'

import './item-list.less'
import { RouteComponentProps } from 'react-router'
import { States } from '../../../../components/states/states'
import { FormComponentProps } from 'antd/lib/form'
import TextArea from 'antd/lib/input/TextArea'
import { useState } from 'react'
import { ChessTypes, Util } from '@chesslang/chess'
import { SetupChessboard } from '../../../../components/chessboard/setup-chessboard'
import { UserStore, userStore } from '../../../../stores/user'
import { ConfiguredChessboard } from '../../../../components/chessboard/configured-chessboard'

const { Content } = Layout
const { Option } = Select

interface Props extends RouteComponentProps<any> {
  practiceStore?: PracticeStore
  userStore: UserStore
}

interface State {
  sortBy: string
  search: string
  problemSolveModalVisible: boolean
  assignmentToSolve: any
  problemUuids: string[]
  createDrawerVisible: boolean
}

@inject('practiceStore', 'userStore')
@observer
class WrappedItemList extends React.Component<Props, State> {
  state = {
    sortBy: 'difficulty_asc',
    search: '',
    createDrawerVisible: false
  } as State

  componentDidMount() {
    this.props.practiceStore!.load()
  }

  sortItems = (sortBy: string, items: any[]) => {
    const [sortByKey, dir] = sortBy.split('_')
    const sortedList = (() => R.sortBy(item => item[sortByKey], items))()
    return dir === 'desc' ? R.reverse(sortedList) : sortedList
  }

  filterItems = (search: string, items: any[]) => {
    return R.filter(
      (item: any) => item.name.toLowerCase().indexOf(search.toLowerCase()) >= 0,
      items
    )
  }

  handleItemClick = (item: any) => () => {
    this.props.history.push(this.props.match.path + 'play/' + item.uuid)
  }

  renderLevelTag = (difficultyLevel: string) => {
    if (difficultyLevel === 'EASY') {
      return <Tag color="green">Easy</Tag>
    }
    if (difficultyLevel === 'MEDIUM') {
      return <Tag color="blue">Medium</Tag>
    }
    if (difficultyLevel === 'HARD') {
      return <Tag color="red">Hard</Tag>
    }
  }

  handleDeleteDrill = (uuid: string) => () => {
    this.props.practiceStore!.deleteDrill(uuid)
  }

  renderDelete = (i: any) => {
    if (i.created_by == userStore.uuid) {
      return (
        <div className="action-buttons">
          <Popconfirm
            title="Are you sure you want to delete the exercise?"
            onConfirm={this.handleDeleteDrill(i.uuid)}
          >
            <Button icon="delete" type="danger" size="small"></Button>
          </Popconfirm>
        </div>
      )
    }
  }

  renderItems = (items: any[]) => {
    if (items.length === 0) {
      return (
        <States
          type="blank"
          icon="fire"
          exceptionText="No items found for the search criteria"
        />
      )
    }
    return (
      <div className="items-list">
        {items.map(i => (
          <div className="item" key={i.name}>
            <div className="name" onClick={this.handleItemClick(i)}>
              {i.name}
            </div>
            <div className="tags">
              {this.renderLevelTag(i.level)}
              {i.tags.map((t: string) => (
                <Tag key={t}>{t}</Tag>
              ))}
            </div>
            {this.renderDelete(i)}
          </div>
        ))}
      </div>
    )
  }

  handleSortByChange = (sortBy: any) => {
    this.setState({ sortBy } as State)
  }

  handleSearchChange = (event: any) => {
    this.setState({ search: event.target.value })
  }

  handleOnCreate = (event: any) => {
    this.setState({ createDrawerVisible: true })
  }

  handleOnDrawerClose = () => {
    this.setState({ createDrawerVisible: false })
  }

  render() {
    const WrappedCreatePracticeProblemForm = Form.create({
      name: 'CreatePractiseProblemForm'
    })(CreatePractiseProblemForm)

    if (this.props.practiceStore!.loading) {
      return (
        <Content className="content">
          <div className="practice inner">
            <States type="loading" />
          </div>
        </Content>
      )
    }

    if (this.props.practiceStore!.error) {
      return (
        <Content className="content">
          <div className="practice inner">
            <States
              type="error"
              exceptionText={this.props.practiceStore!.error}
              icon="fire"
            />
          </div>
        </Content>
      )
    }

    return (
      <div className="practice inner">
        <div className="action-bar">
          <div className="right">
            {this.props.userStore!.role === 'coach' && (
              <Button
                style={{ marginRight: 8 }}
                type="primary"
                onClick={this.handleOnCreate}
              >
                Create
              </Button>
            )}
            {/* Sort by &nbsp;
            <Select
              className="select-sort-by"
              defaultValue={this.state.sortBy}
              value={this.state.sortBy}
              size="small"
              style={{ width: 160 }}
              onChange={this.handleSortByChange}
            >
              <Option value="difficulty_asc">
                <Icon type="caret-up" style={{ fontSize: 10 }} /> Difficulty
              </Option>
              <Option value="assignedAt_desc">
                <Icon type="caret-down" style={{ fontSize: 10 }} /> Difficulty
              </Option>
              <Option value="name_asc">
                <Icon type="caret-up" style={{ fontSize: 10 }} /> Name
              </Option>
              <Option value="name_desc">
                <Icon type="caret-down" style={{ fontSize: 10 }} /> Name
              </Option>
            </Select>{' '}
            &nbsp;&nbsp; */}
            <Input.Search
              placeholder="Search"
              style={{ width: 200 }}
              size="small"
              value={this.state.search}
              onChange={this.handleSearchChange}
            />
          </div>
        </div>
        <Tabs type="card">
          <Tabs.TabPane tab="Public" key="public-practice">
            {this.renderItems(
              this.sortItems(
                this.state.sortBy,
                this.filterItems(
                  this.state.search,
                  this.props.practiceStore!.items.filter(i => i.isPublic)
                )
              )
            )}
          </Tabs.TabPane>
          <Tabs.TabPane tab="Private" key="private-practice">
            {this.renderItems(
              this.sortItems(
                this.state.sortBy,
                this.filterItems(
                  this.state.search,
                  this.props.practiceStore!.items.filter(i => !i.isPublic)
                )
              )
            )}
          </Tabs.TabPane>
        </Tabs>
        <Drawer
          title="Create Practice Position"
          placement="right"
          closable={true}
          width={450}
          onClose={this.handleOnDrawerClose}
          visible={this.state.createDrawerVisible}
        >
          <div style={{ margin: '1rem' }}>
            <WrappedCreatePracticeProblemForm
              onClose={this.handleOnDrawerClose}
            />
          </div>
        </Drawer>
      </div>
    )
  }
}

@inject('practiceStore')
@observer
class CreatePractiseProblemForm extends React.Component<
  FormComponentProps & {
    practiceStore: PracticeStore
    onClose: () => void
  },
  { fen: string; setupModalVisible: boolean; loading: boolean }
> {
  state = {
    fen: Util.DEFAULT_START_FEN,
    confirmedFen: Util.DEFAULT_START_FEN,
    setupModalVisible: false,
    loading: false
  }

  componentDidMount() {
    const { setFieldsValue } = this.props.form
    setFieldsValue({
      fen: this.state.confirmedFen
    })
  }

  handleSubmit = (event: any) => {
    event.preventDefault()
    const { validateFields } = this.props.form

    validateFields(async (err: any, values: any) => {
      if (!err) {
        this.setState({ loading: true })
        await this.props.practiceStore.createDrill(values)
        this.setState({ loading: false })
        this.props.onClose()
      }
    })
  }

  handleOnModalCancel = () => {
    this.setState({
      setupModalVisible: false
    })
  }

  handleOnModalOk = () => {
    const { setFieldsValue } = this.props.form
    this.setState({
      setupModalVisible: false
    })
    setFieldsValue({
      fen: this.state.fen
    })
  }

  handleOnFenChange = (fen: string) => {
    this.setState({
      fen
    })
  }

  render() {
    const { getFieldDecorator } = this.props.form

    return (
      <div>
        <Form onSubmit={this.handleSubmit} className="login-form">
          <Form.Item label="Name">
            {getFieldDecorator('name', {
              rules: [{ required: true, message: 'Please input your name!' }]
            })(<Input placeholder="name" />)}
          </Form.Item>
          <Form.Item label="Fen">
            {getFieldDecorator('fen', {
              rules: [{ required: true, message: 'Please setup fen!' }]
            })(
              <Button
                size="small"
                type="primary"
                onClick={() => this.setState({ setupModalVisible: true })}
              >
                Setup Position
              </Button>
            )}
          </Form.Item>
          <ConfiguredChessboard
            fen={this.state.fen}
            width={150}
            height={150}
            interactionMode="NONE"
          />

          <Form.Item label="Goal">
            {getFieldDecorator('goal', {
              rules: [{ required: true, message: 'Please select Goal!' }]
            })(
              <Select placeholder="Goal">
                <Option value="WIN">Win</Option>
                <Option value="DRAW">Draw</Option>
              </Select>
            )}
          </Form.Item>
          <Form.Item label="Level">
            {getFieldDecorator('level', {
              rules: [{ required: true, message: 'Please select Level!' }]
            })(
              <Select placeholder="Level">
                <Option value="EASY">Easy</Option>
                <Option value="MEDIUM">Medium</Option>
                <Option value="HARD">Hard</Option>
              </Select>
            )}
          </Form.Item>
          <Form.Item label="Tags">
            {getFieldDecorator('tags')(
              <Select mode="tags" placeholder="Tags" />
            )}
          </Form.Item>

          <Form.Item label="Description">
            {getFieldDecorator('description')(
              <TextArea placeholder="Description" rows={4} />
            )}
          </Form.Item>

          <Button type="primary" htmlType="submit" loading={this.state.loading}>
            Create
          </Button>
        </Form>
        <Modal
          title="Setup Position"
          visible={this.state.setupModalVisible}
          style={{ top: 25 }}
          width={800}
          maskClosable={false}
          onCancel={this.handleOnModalCancel}
          onOk={this.handleOnModalOk}
        >
          <div className="position-setup-modal" title="Setup Position">
            <SetupChessboard
              width={550}
              height={550}
              initialFen={this.state.fen as ChessTypes.FEN}
              onChange={this.handleOnFenChange}
            />
          </div>
        </Modal>
      </div>
    )
  }
}

export const ItemList = withRouter(WrappedItemList)
