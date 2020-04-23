import React from 'react'
import { ChessTypes } from '@chesslang/chess'

import './scoresheet.less'

// TODO: Move this to chess lib
const getFullMoveNumber = (fen: string) => {
  return parseInt(fen ? fen.split(' ')[5] : '1', 10)
}

interface Props {
  mainline: ChessTypes.Variation
  currentPath: any
  onMoveClick: (path: any) => any
}

export default class Scoresheet extends React.Component<Props> {
  static defaultProps = {
    currentPath: []
  }

  handleMoveClick = (path: any) => () => {
    this.props.onMoveClick(path)
  }

  renderVariation = (variation: ChessTypes.Variation, prefixPath: any[]) => {
    if (!variation || variation.length === 0) {
      return null
    }
    const level = parseInt(Math.floor(prefixPath.length / 2).toFixed(0), 10)

    return (
      <div
        key={`variation-${prefixPath.toString()}`}
        className={'variation'}
        style={level > 0 ? { marginLeft: `${level}em` } : {}}
      >
        {level > 0 && '('}
        {variation.map((m, i) => {
          const textAnnotations = (m.annotations || []).filter(
            a => a.type === 'TEXT'
          )
          const movePath = [...prefixPath, i]
          return (
            <React.Fragment key={movePath.toString()}>
              <span
                className={
                  'move ' +
                  (movePath.toString() === this.props.currentPath.toString()
                    ? 'current'
                    : '')
                }
                style={level === 0 ? { fontWeight: 600 } : {}}
                onClick={this.handleMoveClick(movePath)}
              >
                <span className={'number'}>
                  {m.side === 'w' && getFullMoveNumber(m.fen) + '. '}
                  {i === 0 &&
                    m.side === 'b' &&
                    getFullMoveNumber(m.fen) - 1 + '... '}
                </span>
                {m.san}
              </span>
              {textAnnotations.length > 0 && (
                <span className={`text annotation`}>
                  ({(textAnnotations[0] as ChessTypes.TextAnnotation).body})
                </span>
              )}
              {m.variations && m.variations.length > 0 && (
                <div
                  key={`${m.path}-variation`}
                  className={'variationsContainer'}
                >
                  {m.variations.map((v, i) =>
                    this.renderVariation(v, [...movePath, 'variations', i])
                  )}
                </div>
              )}
            </React.Fragment>
          )
        })}
        {level > 0 && ')'}
      </div>
    )
  }

  render() {
    return (
      <div className={'new-scoresheet'}>
        {this.props.mainline.length === 0 && (
          <span className={'noMoves'}>No moves to display</span>
        )}
        {this.renderVariation(this.props.mainline, [])}
      </div>
    )
  }
}
