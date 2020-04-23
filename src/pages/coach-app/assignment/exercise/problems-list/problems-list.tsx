import * as React from 'react'
import * as R from 'ramda'
import { Icon } from 'antd'
import { inject, observer } from 'mobx-react'
import { ChessTypes } from '@chesslang/chess'

import './problems-list.less'

import { BaseContentStore } from '../../../../../stores/base-content'
import { ConfiguredChessboard } from '../../../../../components/chessboard/configured-chessboard'

const getSideToMove = (fen: ChessTypes.FEN) => {
  return fen.split(' ')[1] as ChessTypes.Side
}

const getFullMoveNumber = (fen: ChessTypes.FEN) => {
  return fen ? fen.split(' ')[5] : ' '
}

interface Props {
  problemUuids: string[]
  problemDetails?: any[]
  baseContentStore?: BaseContentStore
}

@inject('baseContentStore')
@observer
export class ProblemsList extends React.Component<Props> {
  componentDidMount() {
    this.props.problemUuids.forEach(uuid => {
      this.props.baseContentStore!.load(uuid)
    })
  }

  extractMoves = (attemptMovesPgn: string) => {
    return attemptMovesPgn.split('\n\n')[1] || ''
  }

  renderMainline = (mainline: ChessTypes.Variation): any => {
    return (
      <div className="variation mainline">
        {mainline.map((m, i) => {
          return (
            <div key={m.path.toString()} className="move-container">
              <span className="move">
                <span className="number">
                  {m.side === 'w' && getFullMoveNumber(m.fen) + '. '}
                  {i === 0 &&
                    m.side === 'b' &&
                    (getFullMoveNumber(m.fen) as any) - 1 + '... '}
                </span>
                {m.san}
              </span>
            </div>
          )
        })}
      </div>
    )
  }

  renderAttemptDetails = (uuid: string) => {
    const problem = R.find(
      ad => ad.problemId === uuid,
      this.props.problemDetails!
    )

    if (
      !problem ||
      !problem.attemptDetails ||
      problem.attemptDetails.length === 0
    ) {
      return (
        <div className="attempt-details">
          <h4>No attempt</h4>
        </div>
      )
    }

    return (
      <div className="attempt-details">
        <table className="attempt-table">
          <tbody>
            {problem.attemptDetails.map((ad: any) => {
              return (
                <tr className={`attempt ${ad.status}`}>
                  <td className="time">{ad.timeTaken}s</td>
                  <td className="moves">{this.extractMoves(ad.moves)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  renderProblem = (uuid: string) => {
    const problem = this.props.baseContentStore!.content[uuid]

    if (!problem || problem.loading) {
      return <Icon type="loading" spin={true} />
    }

    return (
      <>
        <div className="board">
          <ConfiguredChessboard
            fen={problem.content!.startFen!}
            interactionMode="NONE"
            width={200}
            height={200}
            coordinates={false}
          />
        </div>
        <div className="assessment">
          <span
            className={`side-to-move ${
              getSideToMove(problem.content!.startFen || '') === 'w'
                ? 'white'
                : 'black'
            }`}
          />
          <span className="result">{problem.content!.meta.result}</span>
        </div>
        <div
          className={`moves-preview ${
            this.props.problemDetails ? 'solution' : ''
          }`}
        >
          {this.renderMainline(R.take(10, problem.content!.mainline))}
          {problem.content!.mainline.length > 6 && ' ...'}
        </div>
        {this.props.problemDetails ? this.renderAttemptDetails(uuid) : null}
      </>
    )
  }

  render() {
    return (
      <div className="problems-list-hort">
        {this.props.problemUuids.map((uuid, i) => (
          <div key={uuid} className="problem">
            <span>{i + 1}</span>

            {this.renderProblem(uuid)}
          </div>
        ))}
      </div>
    )
  }
}
