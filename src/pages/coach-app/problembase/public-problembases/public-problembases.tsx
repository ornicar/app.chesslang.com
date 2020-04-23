import * as R from 'ramda'
import * as React from 'react'
import { inject, observer } from 'mobx-react'
import {
  Icon,
  Button,
  Divider,
  Select,
  Input,
  Breadcrumb,
  Row,
  Col,
  Tag
} from 'antd'
import { Link, RouteComponentProps, Route, Switch } from 'react-router-dom'

import './public-problembases.less'

import { PublicProblembaseStore } from '../../../../stores/public-problembase'
import { States } from '../../../../components/states/states'

const { Option } = Select

interface PublicProblembasesProps extends RouteComponentProps<any> {
  publicProblembaseStore?: PublicProblembaseStore
}

interface PublicProblembasesState {
  sortBy: string
  search: string
}

@inject('publicProblembaseStore')
@observer
export class PublicProblembases extends React.Component<
  PublicProblembasesProps,
  PublicProblembasesState
> {
  state = {
    sortBy: 'name',
    search: ''
  } as PublicProblembasesState

  componentDidMount() {
    this.props.publicProblembaseStore!.load()
  }

  handleProblembaseClick = (uuid: string) => () => {
    this.props.history.push(this.props.match.url + '/' + uuid)
  }

  handleSortByChange = (sortBy: any) => {
    this.setState({ sortBy: sortBy as string })
  }

  handleSearchChange = (event: any) => {
    this.setState({ search: event.target.value })
  }

  sortProblembases = (sortBy: string, problembases: any[]) => {
    return R.sortBy(g => g[sortBy], problembases)
  }

  filterProblembases = (search: string, problembases: any[]) => {
    return R.filter(
      (g: any) => g.name.toLowerCase().indexOf(search.toLowerCase()) >= 0,
      problembases
    )
  }

  getProblembaseNameForUuid = (uuid: string) => {
    const problembase = R.find(
      R.propEq('uuid', uuid),
      this.props.publicProblembaseStore!.problembases! || []
    )
    return problembase ? problembase.name : ''
  }

  renderProblembases = (problembases: any[]) => {
    if (problembases.length === 0) {
      return (
        <div className="blank-state container">
          <Icon type="database" />
          <p className="exception-text">
            No problembases found for the search criteria
          </p>
        </div>
      )
    }

    return (
      <Row className="problembase-cards container" gutter={16} type="flex">
        {problembases.map((g: any) => {
          return (
            <Col
              sm={24}
              md={12}
              lg={8}
              key={g.uuid}
              className="card"
              onClick={this.handleProblembaseClick(g.uuid)}
            >
              <span className="name">{g.name}</span>

              <span className="count">{g.count}</span>
              <Tag style={{ marginLeft: 8 }} className="tags" color="green">
                {g.tags}
              </Tag>
            </Col>
          )
        })}
      </Row>
    )
  }

  render() {
    if (this.props.publicProblembaseStore!.error) {
      return (
        <div className="public-problembases inner">
          <States
            type="error"
            exceptionText={this.props.publicProblembaseStore!.error}
            onClick={this.props.publicProblembaseStore!.load}
          />
        </div>
      )
    }

    if (this.props.publicProblembaseStore!.loading) {
      return (
        <div className="public-problembases inner">
          <States type="loading" />
        </div>
      )
    }

    const problembases = this.sortProblembases(
      this.state.sortBy,
      this.filterProblembases(
        this.state.search,
        this.props.publicProblembaseStore!.problembases! || []
      )
    )

    return (
      <div className="public-problembases inner">
        <div className="action-bar">
          <div className="left" />
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
              <Option value="name">Name</Option>
              <Option value="count">Count</Option>
              <Option value="tags">Tags</Option>
            </Select>
            <Input.Search
              placeholder="Search"
              style={{ width: 200 }}
              size="small"
              value={this.state.search}
              onChange={this.handleSearchChange}
            />
          </div>
        </div>
        <Divider className="below-action-bar" />
        {problembases.length === 0 ? (
          <States
            type="blank"
            icon="database"
            exceptionText="There are no public problembases to show"
          />
        ) : (
          this.renderProblembases(problembases)
        )}
      </div>
    )
  }
}
