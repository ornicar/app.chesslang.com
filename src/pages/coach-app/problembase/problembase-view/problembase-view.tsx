import * as React from 'react'
import { RouteComponentProps, Link } from 'react-router-dom'
import { Icon, Button, Divider, Breadcrumb } from 'antd'
import { observer, inject } from 'mobx-react'
import { ChessTypes } from '@chesslang/chess'
import InfiniteScroller from 'react-infinite-scroller'

import './problembase-view.less'

import { ProblembaseContentStore } from '../../../../stores/problembase-content'
import { ConfiguredChessboard } from '../../../../components/chessboard/configured-chessboard'
import { States } from '../../../../components/states/states'

interface Props extends RouteComponentProps<any> {
  problembaseContentStore?: ProblembaseContentStore
}

// TODO: Move this method to Chess Lib FEN
const getSideToMove = (fen: ChessTypes.FEN): ChessTypes.Side => {
  return fen.split(' ')[1] as ChessTypes.Side
}

// TODO: Handle error in pages
@inject('problembaseContentStore')
@observer
export class ProblembaseView extends React.Component<Props> {
  state = {
    hasMore: true
  }
  componentDidMount() {
    this.props.problembaseContentStore!.load(this.props.match.params.uuid)
  }

  handleLoadMore = async (page: number) => {
    const count = await this.props.problembaseContentStore!.loadMore(
      this.props.match.params.uuid,
      page
    )
    if (!count) {
      this.setState({ hasMore: false })
    }
  }

  handleRetry = () => {
    this.props.problembaseContentStore!.load(this.props.match.params.uuid)
  }

  renderProblems = () => {
    const uuid = this.props.match.params.uuid

    return (
      <InfiniteScroller
        className="problems-list"
        pageStart={0}
        hasMore={this.state.hasMore}
        loadMore={this.handleLoadMore}
        useWindow={false}
      >
        {this.props.problembaseContentStore!.content[uuid].problems.map(
          (g: any) => {
            return (
              <div key={g.uuid} className="problem">
                <div className="board">
                  <ConfiguredChessboard
                    fen={g.meta.startFen}
                    interactionMode="NONE"
                    width={250}
                    height={250}
                    coordinates={false}
                  />
                </div>
                <div className="assessment">
                  <span
                    className={`side-to-move ${
                      getSideToMove(g.meta.startFen) === 'w' ? 'white' : 'black'
                    }`}
                  />
                  <span className="result">{g.meta.result}</span>
                </div>
              </div>
            )
          }
        )}
        {/* Dummy problem elements to fill the flex grid */}
        <div className="problem" />
        <div className="problem" />
        <div className="problem" />
        <div className="problem" />
        <div className="problem" />
        <div className="problem" />
      </InfiniteScroller>
    )
  }

  render() {
    const uuid = this.props.match.params.uuid

    const actionBar = (
      <div className="action-bar">
        <div className="left">
          <Breadcrumb>
            <Breadcrumb.Item>
              <Link
                to={this.props.match.url.replace(
                  '/' + this.props.match.params.uuid,
                  ''
                )}
              >
                <Icon type="database" />
              </Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item>
              <Icon type="bars" />
            </Breadcrumb.Item>
          </Breadcrumb>
        </div>
        <div className="right" />
      </div>
    )

    if (
      !this.props.problembaseContentStore!.content[uuid] ||
      this.props.problembaseContentStore!.content[uuid].loading
    ) {
      return (
        <div className="problembase-view inner">
          {actionBar}
          <Divider className="below-action-bar" />
          <div className="container">
            <States type="loading" />
          </div>
        </div>
      )
    }

    if (this.props.problembaseContentStore!.content[uuid].error) {
      return (
        <div className="problembase-view inner">
          {actionBar}
          <Divider className="below-action-bar" />
          <div className="container">
            <States
              type="error"
              exceptionText={
                this.props.problembaseContentStore!.content[uuid].error
              }
              onClick={this.handleRetry}
            />
          </div>
        </div>
      )
    }

    if (
      this.props.problembaseContentStore!.content[uuid].problems.length === 0
    ) {
      return (
        <div className="problembase-view inner">
          {actionBar}
          <Divider className="below-action-bar" />
          <div className="container">
            <States
              type="blank"
              icon="database"
              exceptionText="This problembase does not contain any problems"
            />
          </div>
        </div>
      )
    }

    return (
      <div className="problembase-view inner">
        {actionBar}
        <Divider className="below-action-bar" />
        <div className="container">{this.renderProblems()}</div>
      </div>
    )
  }
}
