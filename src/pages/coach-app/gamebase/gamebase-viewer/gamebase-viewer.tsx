import * as React from 'react'
import * as R from 'ramda'
import { RouteComponentProps, Link } from 'react-router-dom'
import { Icon, Divider, Breadcrumb } from 'antd'
import { observer, inject } from 'mobx-react'
import InfiniteScroller from 'react-infinite-scroller'

import './gamebase-viewer.less'
import { GamebaseContentStore } from '../../../../stores/gamebase-content'
import { States } from '../../../../components/states/states'

interface Props extends RouteComponentProps<any> {
  gamebaseContentStore?: GamebaseContentStore
}

// TODO: Handle error in pages
@inject('gamebaseContentStore')
@observer
export class GamebaseViewer extends React.Component<Props> {
  componentDidMount() {
    this.props.gamebaseContentStore!.load(this.props.match.params.uuid)
  }

  handleClick = (uuid: string) => () => {
    this.props.history.push(this.props.match.url + '/' + uuid)
  }

  handleLoadMore = (page: number) => {
    this.props.gamebaseContentStore!.loadMore(
      this.props.match.params.uuid,
      page
    )
  }

  handleRetry = () => {
    this.props.gamebaseContentStore!.load(this.props.match.params.uuid)
  }

  renderGames = () => {
    const uuid = this.props.match.params.uuid

    return (
      <InfiniteScroller
        className="games-list"
        pageStart={0}
        hasMore={true}
        loadMore={this.handleLoadMore}
        useWindow={false}
      >
        {this.props.gamebaseContentStore!.content[uuid].games.map((g: any) => {
          return (
            <div
              key={g.uuid}
              className="game"
              onClick={this.handleClick(g.uuid)}
            >
              <div>
                <span className="white">{g.meta.white}</span>
                <span> - </span>
                <span className="black">{g.meta.black}</span>
                <span className="result"> ({g.meta.result})</span>
              </div>

              <div>
                <span className="date">{g.meta.date}</span>
                {g.meta.round && (
                  <span className="round">({g.meta.round})</span>
                )}
                <span className="site">{g.meta.site}</span>
              </div>
            </div>
          )
        })}
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
      !this.props.gamebaseContentStore!.content[uuid] ||
      this.props.gamebaseContentStore!.content[uuid].loading
    ) {
      return (
        <div className="gamebase-viewer inner">
          {actionBar}
          <Divider className="below-action-bar" />
          <div className="container">
            <States type="loading" />
          </div>
        </div>
      )
    }

    if (this.props.gamebaseContentStore!.content[uuid].error) {
      return (
        <div className="gamebase-viewer inner">
          {actionBar}
          <Divider className="below-action-bar" />
          <div className="container">
            <States
              type="error"
              exceptionText={
                this.props.gamebaseContentStore!.content[uuid].error
              }
              onClick={this.handleRetry}
            />
          </div>
        </div>
      )
    }

    if (this.props.gamebaseContentStore!.content[uuid].games.length === 0) {
      return (
        <div className="gamebase-viewer inner">
          {actionBar}
          <Divider className="below-action-bar" />
          <div className="container">
            <States
              type="blank"
              icon="database"
              exceptionText="This gamebase does not contain any games"
            />
          </div>
        </div>
      )
    }

    return (
      <div className="gamebase-viewer inner">
        {actionBar}
        <Divider className="below-action-bar" />
        <div className="container">{this.renderGames()}</div>
      </div>
    )
  }
}
