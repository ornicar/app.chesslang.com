import * as React from 'react'
import * as R from 'ramda'
import { Icon, Button, Breadcrumb, Divider, Row, Col } from 'antd'
import { Link, RouteComponentProps } from 'react-router-dom'
import { observer } from 'mobx-react'
import Measure from 'react-measure'
import { ChessTypes } from '@chesslang/chess'
import { HotKeys } from 'react-hotkeys'

import './game-viewer.less'

import { GameViewerStore } from './game-viewer-store'
import { ConfiguredChessboard } from '../../../../components/chessboard/configured-chessboard'
import { States } from '../../../../components/states/states'

const ACTION_BUTTONS_HEIGHT = 48

interface Props extends RouteComponentProps<any> {
  gameViewerStore: GameViewerStore
}

interface State {
  boardSize: number
  orientation: ChessTypes.Side
}

@observer
class WrappedGameViewer extends React.Component<Props, State> {
  state = {
    boardSize: 0,
    orientation: 'w' as ChessTypes.Side
  }

  handleRetry = () => {
    window.location.reload()
  }

  handleFlip = () => {
    this.setState({
      orientation: this.state.orientation === 'w' ? 'b' : 'w'
    })
  }

  renderVariation = (variation: ChessTypes.Variation, level: number): any => {
    const { getFullMoveNumber, currentPath } = this.props.gameViewerStore

    return (
      <div
        key={`variation-${level}-${variation[0].path}`}
        className={`variation level-${level}`}
      >
        {level > 0 && '('}
        {variation.map((m, i) => {
          const textAnnotations = R.filter(
            a => a.type === 'TEXT',
            m.annotations || []
          )

          return (
            <>
              <span
                key={m.path.toString()}
                className={`move ${((currentPath || '').toString() ===
                  m.path.toString() &&
                  'current') ||
                  ''}`}
                onClick={() => this.props.gameViewerStore.goToPath(m.path)}
              >
                <span className="number">
                  {m.side === 'w' && getFullMoveNumber(m.fen) + '. '}
                  {i === 0 &&
                    m.side === 'b' &&
                    (getFullMoveNumber(m.fen) as any) - 1 + '... '}
                </span>
                {m.san}
              </span>
              {textAnnotations.length > 0 && (
                <span className="text annotation">
                  ({(textAnnotations[0] as ChessTypes.TextAnnotation).body})
                </span>
              )}
              {m.variations && (
                <div
                  key={`${m.path}-variation`}
                  className={`variations-container level-${level}`}
                >
                  {m.variations.map(v => this.renderVariation(v, level + 1))}
                </div>
              )}
            </>
          )
        })}
        {level > 0 && ')'}
      </div>
    )
  }

  renderGame = () => {
    if (this.props.gameViewerStore.fen) {
      const game = this.props.gameViewerStore.game!

      return (
        <Row>
          <Col sm={24} md={12}>
            <Measure
              bounds={true}
              onResize={contentRect =>
                this.setState({
                  boardSize: Math.min(
                    contentRect.bounds!.width,
                    contentRect.bounds!.height
                  )
                })
              }
            >
              {({ measureRef }) => {
                return (
                  <div ref={measureRef} className="game-container">
                    <div className="board-container">
                      <ConfiguredChessboard
                        fen={this.props.gameViewerStore.fen!}
                        width={this.state.boardSize}
                        height={this.state.boardSize}
                        interactionMode="NONE"
                        orientation={this.state.orientation}
                      />
                      <div className="action-buttons">
                        <Button
                          icon="fast-backward"
                          onClick={this.props.gameViewerStore.fastPrev}
                          type="ghost"
                          shape="circle"
                        />
                        <Button
                          icon="backward"
                          onClick={this.props.gameViewerStore.prev}
                          type="ghost"
                          shape="circle"
                        />
                        <Button
                          icon="forward"
                          onClick={this.props.gameViewerStore.next}
                          type="ghost"
                          shape="circle"
                        />
                        <Button
                          icon="fast-forward"
                          onClick={this.props.gameViewerStore.fastNext}
                          type="ghost"
                          shape="circle"
                        />
                        <Button
                          className="flip-button"
                          icon="swap"
                          onClick={this.handleFlip}
                          type="ghost"
                          shape="circle"
                        />
                      </div>
                    </div>
                  </div>
                )
              }}
            </Measure>
          </Col>
          <Col sm={24} md={12}>
            <div className="scoresheet">
              {this.renderVariation(game.mainline, 0)}
              <span className="result">{game.result}</span>
            </div>
          </Col>
        </Row>
      )
    }

    return null
  }

  render() {
    const breadcrumbText = this.props.gameViewerStore.game
      ? `${this.props.gameViewerStore.game.meta['White']} - ${this.props.gameViewerStore.game.meta['Black']} (${this.props.gameViewerStore.game.meta['Result']})`
      : 'Game'

    const actionBar = (
      <div className="action-bar">
        <div className="left">
          <Breadcrumb>
            <Breadcrumb.Item>
              <Link
                to={this.props.match.url
                  .replace('/' + this.props.match.params.gamebaseUuid, '')
                  .replace('/' + this.props.match.params.uuid, '')}
              >
                <Icon type="database" />
              </Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item>
              <Link
                to={this.props.match.url.replace(
                  '/' + this.props.match.params.uuid,
                  ''
                )}
              >
                <Icon type="bars" />
              </Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item>{breadcrumbText}</Breadcrumb.Item>
          </Breadcrumb>
        </div>
        <div className="right" />
      </div>
    )

    if (this.props.gameViewerStore.loading) {
      return (
        <div className="game-viewer inner">
          {actionBar}
          <Divider className="below-action-bar" />
          <div className="container">
            <States type="loading" />
          </div>
        </div>
      )
    }

    // TODO: Update GameReader to expose errors
    // if (this.props.gameViewerStore.error) {
    //   return (
    //     <div className="game-viewer inner">
    //       {actionBar}
    //       <Divider className="below-action-bar" />
    //       <div className="container"><States type="error" exceptionText="Error loading the game" onClick={this.handleRetry} /></div>
    //     </div>
    //   )
    // }

    const keyMap = {
      prevMove: 'left',
      nextMove: 'right'
    }

    const handlers = {
      prevMove: this.props.gameViewerStore.prev,
      nextMove: this.props.gameViewerStore.next
    }

    return (
      <HotKeys className="game-viewer" handlers={handlers} keyMap={keyMap}>
        {actionBar}
        {this.renderGame()}
      </HotKeys>
    )
  }
}

export const GameViewer = (props: RouteComponentProps<any>) => {
  const gvs = new GameViewerStore(props.match.params.uuid)
  return <WrappedGameViewer {...props} gameViewerStore={gvs} />
}
