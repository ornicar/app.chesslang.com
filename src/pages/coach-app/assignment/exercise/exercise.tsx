import * as React from 'react'
import * as R from 'ramda'
import moment from 'moment'
import {
  Icon,
  Button,
  Select,
  Input,
  Collapse,
  Tag,
  Divider,
  Popconfirm
} from 'antd'
import { inject, observer } from 'mobx-react'
import AwesomeDebouncePromise from 'awesome-debounce-promise'
import InfiniteScroller from 'react-infinite-scroller'

const { Option } = Select

import './exercise.less'

import { ExerciseStore } from '../../../../stores/exercise'
import { CreateExerciseDrawer } from './create-exercise-drawer/create-exercise-drawer'
import { AssignExerciseDrawer } from './assign-exercise-drawer/assign-exercise-drawer'
import { ProblemsList } from './problems-list/problems-list'
import { States } from '../../../../components/states/states'

interface Props {
  exerciseStore?: ExerciseStore
}

interface State {
  createExerciseDrawerVisible: boolean
  sortBy: string
  search: string
  exerciseUuidToAssign: string
}

@inject('exerciseStore')
@observer
export class Exercise extends React.Component<Props, State> {
  state = {
    createExerciseDrawerVisible: false,
    sortBy: 'createdAt_desc',
    search: '',
    exerciseUuidToAssign: ''
  } as State

  debouncedLoad = AwesomeDebouncePromise(this.props.exerciseStore!.load, 500)

  componentDidMount() {
    this.props.exerciseStore!.load(this.state.search, this.state.sortBy)
  }

  handleRetry = () => {
    this.props.exerciseStore!.load(this.state.search, this.state.sortBy)
  }

  handleLoadMore = (page: number) => {
    this.props.exerciseStore!.loadMore(page)
  }

  handleCreateButtonClick = () => {
    this.setState({
      createExerciseDrawerVisible: true
    })
  }

  handleCreateExerciseDrawerClose = () => {
    this.setState({
      createExerciseDrawerVisible: false
    })
  }

  handleAssignExerciseDrawerClose = () => {
    this.setState({
      exerciseUuidToAssign: ''
    })
  }

  handleSortByChange = (sortBy: any) => {
    this.setState({ sortBy } as State, () => {
      this.debouncedLoad(this.state.search, this.state.sortBy)
    })
  }

  handleSearchChange = (event: any) => {
    this.setState({ search: event.target.value }, () => {
      this.debouncedLoad(this.state.search, this.state.sortBy)
    })
  }

  handleAssignExercise = (uuid: string) => () => {
    this.setState({ exerciseUuidToAssign: uuid })
  }

  handleDeleteExercise = (uuid: string) => () => {
    this.props.exerciseStore!.delete(uuid)
  }

  renderBlankState = () => {
    return (
      <States
        type="blank"
        button="Create"
        exceptionText="You have not created any exercises so far"
        onClick={this.handleCreateButtonClick}
      />
    )
  }

  renderLevelTag = (difficultyLevel: string) => {
    if (difficultyLevel === 'easy') {
      return <Tag color="green">Beginner</Tag>
    }

    if (difficultyLevel === 'medium') {
      return <Tag color="blue">Intermediate</Tag>
    }

    if (difficultyLevel === 'hard') {
      return <Tag color="red">Advanced</Tag>
    }
  }

  renderCreatedAt = (createdAt: string) => {
    return moment.utc(createdAt).format('DD-MM-YYYY')
  }

  renderExercises = (exercises: any[]) => {
    if (exercises.length === 0) {
      return (
        <div className="blank-state container">
          <Icon type="flag" />
          <p className="exception-text">
            No exercises found for the search criteria
          </p>
        </div>
      )
    }

    return (
      <div className="exercises container">
        <InfiniteScroller
          pageStart={0}
          loadMore={this.handleLoadMore}
          hasMore={this.props.exerciseStore!.hasMore}
          useWindow={false}
        >
          <Collapse className="exercise-collapse" bordered={false}>
            {exercises.map(e => {
              const header = (
                <div className="panel-header">
                  <div className="meta">
                    <span className="name">{e.name}</span>
                    <span className="count">({e.problemIds.length})</span>
                  </div>
                  <div className="submeta">
                    <span className="created">
                      {this.renderCreatedAt(e.createdAt)}.
                    </span>
                    <span className="description">{e.description}</span>
                  </div>
                  <div className="tags-container">
                    {this.renderLevelTag(e.difficultyLevel)}
                    {e.tags.map((t: string) => (
                      <Tag key={t}>{t}</Tag>
                    ))}
                  </div>
                </div>
              )

              return (
                <Collapse.Panel key={e.uuid} header={header}>
                  <div className="action-buttons">
                    <Popconfirm
                      title="Are you sure you want to delete the exercise?"
                      onConfirm={this.handleDeleteExercise(e.uuid)}
                    >
                      <Button type="danger">Delete</Button>
                    </Popconfirm>
                    <Button
                      onClick={this.handleAssignExercise(e.uuid)}
                      type="primary"
                    >
                      Assign
                    </Button>
                  </div>
                  <ProblemsList problemUuids={e.problemIds} />
                </Collapse.Panel>
              )
            })}
          </Collapse>
        </InfiniteScroller>
      </div>
    )
  }

  renderExercisePage = () => {
    if (this.props.exerciseStore!.error) {
      return (
        <States
          type="error"
          exceptionText={this.props.exerciseStore!.error}
          onClick={this.handleRetry}
        />
      )
    }

    if (this.props.exerciseStore!.loading) {
      return <States type="loading" />
    }

    const exercises = this.props.exerciseStore!.exercises as any[]

    return (
      <>
        {(exercises.length > 0 || this.state.search.trim() !== '') && (
          <div className="action-bar">
            <div className="left">
              <Button
                type="primary"
                onClick={this.handleCreateButtonClick}
                size="small"
              >
                Create
              </Button>
            </div>
            <div className="right">
              Sort by:&nbsp;
              <Select
                className="select-sort-by"
                defaultValue={this.state.sortBy}
                value={this.state.sortBy}
                size="small"
                style={{ width: 120 }}
                onChange={this.handleSortByChange}
              >
                <Option value="createdAt_asc">
                  <Icon type="caret-up" style={{ fontSize: 10 }} /> Created
                </Option>
                <Option value="createdAt_desc">
                  <Icon type="caret-down" style={{ fontSize: 10 }} /> Created
                </Option>
                <Option value="name_asc">
                  <Icon type="caret-up" style={{ fontSize: 10 }} /> Name
                </Option>
                <Option value="name_desc">
                  <Icon type="caret-down" style={{ fontSize: 10 }} /> Name
                </Option>
                <Option value="difficultyLevel_asc">
                  <Icon type="caret-up" style={{ fontSize: 10 }} /> Level
                </Option>
                <Option value="difficultyLevel_desc">
                  <Icon type="caret-down" style={{ fontSize: 10 }} /> Level
                </Option>
              </Select>
              &nbsp;&nbsp;
              <Input.Search
                placeholder="Search"
                style={{ width: 200 }}
                size="small"
                value={this.state.search}
                onChange={this.handleSearchChange}
              />
            </div>
          </div>
        )}
        {(exercises.length > 0 || this.state.search.trim() !== '') && (
          <Divider className="below-action-bar" />
        )}
        {exercises.length === 0 && this.state.search.trim() === ''
          ? this.renderBlankState()
          : this.renderExercises(exercises)}
      </>
    )
  }

  render() {
    const problemUuidsToAssign = (() => {
      if (this.state.exerciseUuidToAssign) {
        const exercise = R.find(
          e => e.uuid === this.state.exerciseUuidToAssign,
          this.props.exerciseStore!.exercises || []
        )
        return exercise ? exercise.problemIds : []
      }

      return []
    })()

    return (
      <div className="exercise inner">
        <AssignExerciseDrawer
          exerciseUuid={this.state.exerciseUuidToAssign}
          problemUuids={problemUuidsToAssign}
          visible={this.state.exerciseUuidToAssign !== ''}
          onClose={this.handleAssignExerciseDrawerClose}
        />
        <CreateExerciseDrawer
          visible={this.state.createExerciseDrawerVisible}
          onClose={this.handleCreateExerciseDrawerClose}
        />
        {this.renderExercisePage()}
      </div>
    )
  }
}
