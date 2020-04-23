import * as React from 'react'
import { Button, Drawer, Icon, Checkbox } from 'antd'
import { inject, observer } from 'mobx-react'
import { ChessTypes } from '@chesslang/chess'
import InfiniteScroller from 'react-infinite-scroller'

import './problembase-viewer-drawer.less'

import { ProblembaseContentStore } from '../../../../../stores/problembase-content'
import { ConfiguredChessboard } from '../../../../../components/chessboard/configured-chessboard'

// TODO: Move this method to Chess Lib FEN
const getSideToMove = (fen: ChessTypes.FEN): ChessTypes.Side => {
  return fen.split(' ')[1] as ChessTypes.Side
}

interface Props {
  problembaseUuid: string
  selectedProblemUuids: string[]
  problembaseContentStore?: ProblembaseContentStore
  onClose: () => any
  onProblemSelect: (uuid: string) => any
  onProblemSelect10: () => any
  onProblemSelectAll: () => any
  onProblemDeselectAll: () => any
  onProblemUnselect: (uuid: string) => any
}

@inject('problembaseContentStore')
@observer
export default class ProblembaseViewerDrawer extends React.Component<Props> {
  ref = {}

  state = { hasMore: true }

  componentDidUpdate() {
    if (this.props.problembaseUuid.length > 0) {
      this.props.problembaseContentStore!.load(this.props.problembaseUuid)
    }

    let lastProblem = this.props.selectedProblemUuids[
      this.props.selectedProblemUuids.length - 1
    ]

    if (lastProblem && this.ref[lastProblem]) {
      this.ref[lastProblem].scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
    }
  }

  handleProblemClick = (uuid: string) => () => {
    if (this.props.selectedProblemUuids.indexOf(uuid) >= 0) {
      this.props.onProblemUnselect(uuid)
    } else {
      this.props.onProblemSelect(uuid)
    }
  }

  handleLoadMore = async (page: number) => {
    const count = await this.props.problembaseContentStore!.loadMore(
      this.props.problembaseUuid,
      page
    )

    if (!count) {
      this.setState({ hasMore: false })
    }
  }

  render() {
    const content = (() => {
      if (
        !this.props.problembaseUuid ||
        !this.props.problembaseContentStore!.content[this.props.problembaseUuid]
      ) {
        return <div className="content" />
      }

      if (
        this.props.problembaseContentStore!.content[this.props.problembaseUuid]
          .loading
      ) {
        return (
          <div className="content">
            <div className="loading-state container">
              <Icon type="loading" spin={true} />
              <p className="exception-text">Loading</p>
            </div>
          </div>
        )
      }

      const problems = this.props.problembaseContentStore!.content[
        this.props.problembaseUuid
      ].problems

      return (
        <div className="content">
          <InfiniteScroller
            className="problems-list"
            pageStart={0}
            loadMore={this.handleLoadMore}
            hasMore={this.state.hasMore}
            useWindow={false}
          >
            {problems.map((p, index) => (
              <div
                ref={ref => {
                  this.ref[p.uuid] = ref
                }}
                key={p.uuid}
                className={`problem ${
                  this.props.selectedProblemUuids.indexOf(p.uuid) >= 0
                    ? 'selected'
                    : ''
                }`}
                onClick={this.handleProblemClick(p.uuid)}
              >
                <div style={{ textAlign: 'center' }}>{index + 1}</div>
                <div className="board">
                  <ConfiguredChessboard
                    key={p.uuid}
                    fen={p.meta.startFen}
                    interactionMode="NONE"
                    width={250}
                    height={250}
                    coordinates={false}
                  />
                </div>
                <div className="assessment">
                  <span
                    className={`side-to-move ${
                      getSideToMove(p.meta.startFen) === 'w' ? 'white' : 'black'
                    }`}
                  />
                  <span className="result">{p.meta.result}</span>
                </div>
                <div className="overlay">
                  <Icon type="check-circle" />
                </div>
              </div>
            ))}
          </InfiniteScroller>
        </div>
      )
    })()

    return (
      <Drawer
        className="problembase-viewer-drawer"
        width={345}
        placement="right"
        maskClosable={false}
        closable={false}
        visible={this.props.problembaseUuid.length > 0}
      >
        <div className="drawer-inner">
          <div className="title">
            <h3>Select Problems</h3>
          </div>
          <div className="status-bar">
            Selected {this.props.selectedProblemUuids.length}
            <br />
          </div>
          <div className="select-bar">
            <Button
              size="small"
              className="select-button"
              onClick={this.props.onProblemSelect10}
            >
              Select 10
            </Button>
            <Button
              size="small"
              className="select-button"
              onClick={this.props.onProblemSelectAll}
            >
              Select all
            </Button>
            <Button size="small" onClick={this.props.onProblemDeselectAll}>
              Deselect all
            </Button>
          </div>
          {content}
          <div className="button-bar">
            <Button type="primary" onClick={this.props.onClose}>
              Done
            </Button>
          </div>
        </div>
      </Drawer>
    )
  }
}
