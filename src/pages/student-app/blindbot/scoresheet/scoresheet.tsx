import * as React from 'react'
import { ChessTypes } from '@chesslang/chess'

import './scoresheet.less'

interface Props {
  currentPath: ChessTypes.PlyPath | null
  mainline: ChessTypes.Variation
}

// TODO: Move this to chess lib
const getFullMoveNumber = (fen: ChessTypes.FEN) => {
  return fen ? fen.split(' ')[5] : ' '
}

// TODO: Generalize this component for coach/student
export class Scoresheet extends React.Component<Props> {
  renderVariation = (variation: ChessTypes.Variation, level: number): any => {
    if (!variation || variation.length === 0) return null

    return (
      <div
        key={`variation-${level}-${variation[0].path}`}
        className={`variation level-${level}`}
      >
        {level > 0 && '('}
        {variation.map((m, i) => {
          return (
            <>
              <span
                key={m.path.toString()}
                className={`move ${((
                  this.props.currentPath || ''
                ).toString() === m.path.toString() &&
                  'current') ||
                  ''}`}
              >
                <span className="number">
                  {m.side === 'w' && getFullMoveNumber(m.fen) + '. '}
                  {i === 0 &&
                    m.side === 'b' &&
                    (getFullMoveNumber(m.fen) as any) - 1 + '... '}
                </span>
                {m.san}
              </span>
            </>
          )
        })}
        {level > 0 && ')'}
      </div>
    )
  }

  render() {
    return (
      <div className="scoresheet">
        {this.props.mainline.length === 0 && (
          <span className="no-moves">No moves yet</span>
        )}
        {this.renderVariation(this.props.mainline, 0)}
      </div>
    )
  }
}
