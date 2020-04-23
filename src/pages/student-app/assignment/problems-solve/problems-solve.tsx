import * as React from 'react'
import * as R from 'ramda'
import Measure from 'react-measure'
import { inject, observer } from 'mobx-react'
import { Chess, ChessTypes, ProblemReader, Util } from '@chesslang/chess'
import { Button, Icon, Tag, Alert } from 'antd'
import { toJS } from 'mobx'
import { BaseContentStore } from '../../../../stores/base-content'
import { ProblemSolveStore } from '../../../../stores/problem-solve'
import { ConfiguredChessboard } from '../../../../components/chessboard/configured-chessboard'
import './problems-solve.less'
import { StudentAssignmentStore } from '../../../../stores/student-assignment'

const pad = (digit: number): string =>
  digit <= 9 ? '0' + digit : digit.toString()

const secondsToTime = (seconds: number): string =>
  pad(Math.floor(seconds / 60 / 60)) +
  ':' +
  pad(Math.floor(seconds / 60) % 60) +
  ':' +
  pad(seconds % 60)

const extractMoves = (attemptMovesPgn: string) =>
  attemptMovesPgn.split('\n\n')[1] || ''

const getSideToMove = (fen: ChessTypes.FEN) =>
  fen.split(' ')[1] as ChessTypes.Side

interface Props {
  assignment: any
  problemUuids: string[]
  baseContentStore?: BaseContentStore
  problemSolveStore?: ProblemSolveStore
  studentAssignmentStore?: StudentAssignmentStore
}

interface State {
  allSolved: boolean
  showCongrats: boolean
  boardSize: number
  fen: string
  interactionMode: 'NONE' | 'MOVE'
  orientation: 'w' | 'b'
  time: number
  status: string
  moves: string
  currentPbmIndex: number
}

@inject('baseContentStore', 'problemSolveStore', 'studentAssignmentStore')
@observer
export class ProblemsSolve extends React.Component<Props, State> {
  state = {
    allSolved: false,
    showCongrats: true,
    boardSize: 0,
    fen: '',
    orientation: 'w',
    interactionMode: 'NONE',
    time: 0,
    status: '',
    moves: '',
    currentPbmIndex: 0
  } as State

  private interval: any | null = null
  private problemReader: ProblemReader.ProblemReader | null = null
  private chess: Chess = new Chess()
  private attempt: any = {
    problemId: '',
    exerciseId: '',
    status: '',
    moves: '',
    timeTaken: ''
  }

  tick() {
    this.setState(state => ({ time: state.time + 1 }))
  }

  startTimer() {
    if (!this.interval) {
      this.setState({ interactionMode: 'MOVE' })
      this.interval = setInterval(() => this.tick(), 1000)
    }
  }

  stopTimer() {
    if (this.interval) {
      this.setState({ interactionMode: 'NONE' })
      clearInterval(this.interval)
      this.interval = null
    }
  }

  readProblem(uuid: string) {
    this.startTimer()
    this.problemReader = this.props.problemSolveStore!.getProblemReader(uuid)
    this.problemReader.getStatusStream().subscribe(status => {
      if (status.nextMove) {
        setTimeout(() => {
          this.chess.move(status.nextMove as string)
          this.setState({
            fen: this.chess.fen(),
            status: 'correct',
            moves: this.chess.pgn()
          })
        }, 300)
      }
      if (status.solved) {
        setTimeout(() => {
          this.stopTimer()
          this.handleSubmit('solved', this.state.moves)
          this.props.studentAssignmentStore!.setSolved(
            this.props.assignment.uuid,
            uuid
          )

          // check if all solved
          const completionDetails = (this.props.studentAssignmentStore!
            .completionDetails as any)[this.props.assignment.uuid]
          if (
            completionDetails.details.length ===
              this.props.problemUuids.length &&
            R.all(d => d.solved, completionDetails.details)
          ) {
            this.setState({ allSolved: true })
          } else {
            this.setState({ status: 'solved' }, () => {
              setTimeout(() => {
                console.log('Next unsolved')
                this.loadNextUnsolvedProblem(
                  this.state.currentPbmIndex,
                  this.props.assignment
                )
              }, 2000)
            })
          }
        }, 300)
      }
    })
  }

  loadProblem(index: number, assignment: any) {
    this.stopTimer()
    this.setState({ currentPbmIndex: index, fen: '' })
    this.attempt.exerciseId = assignment.exerciseId
    this.attempt.problemId = this.props.problemUuids[index]
    const completionDetails = this.props.studentAssignmentStore!
      .completionDetails[assignment.uuid]
    if (completionDetails.details.length > 0) {
      const solvedCompletionDetail = R.find(
        (ad: any) => ad.problemId === this.attempt.problemId && ad.solved,
        completionDetails.details
      )

      if (solvedCompletionDetail) {
        this.setState({
          status: 'solved',
          time: 0,
          moves: solvedCompletionDetail.moves
        })
      } else {
        this.setState({ status: '', time: 0, moves: '' })
        this.readProblem(this.attempt.problemId)
      }
    } else {
      this.setState({ status: '', time: 0, moves: '' })
      this.readProblem(this.attempt.problemId)
    }
  }

  loadPrevUnsolvedProblem(index: number, assignment: any) {
    if (index < 0) {
      return
    }

    const completionDetails = this.props.studentAssignmentStore!
      .completionDetails[assignment.uuid]
    for (let i = index; i >= 0; i--) {
      const problemId = this.props.problemUuids[i]
      if (completionDetails.details.length > 0) {
        const solved = R.find(
          (ad: any) => ad.problemId === problemId && ad.solved,
          completionDetails.details
        )
        if (!solved) {
          this.loadProblem(i, assignment)
          return
        }
      } else {
        this.loadProblem(i, assignment)
        return
      }
    }

    // check if all solved
    if (
      completionDetails.details.length === this.props.problemUuids.length &&
      R.all(d => d.solved, completionDetails.details)
    ) {
      this.setState({ allSolved: true })
    }
  }

  loadNextUnsolvedProblem(index: number, assignment: any) {
    if (index >= this.props.problemUuids.length) {
      return
    }

    const completionDetails = this.props.studentAssignmentStore!
      .completionDetails[assignment.uuid]
    for (let i = index; i < this.props.problemUuids.length; i++) {
      const problemId = this.props.problemUuids[i]
      if (completionDetails.details.length > 0) {
        const solved = R.find(
          (ad: any) => ad.problemId === problemId && ad.solved,
          completionDetails.details
        )
        if (!solved) {
          this.loadProblem(i, assignment)
          return
        }
      } else {
        this.loadProblem(i, assignment)
        return
      }
    }

    // check if all solved
    if (
      completionDetails.details.length === this.props.problemUuids.length &&
      R.all(d => d.solved, completionDetails.details)
    ) {
      this.setState({ allSolved: true })
    }
  }

  componentDidMount() {
    this.props.problemUuids.forEach((uuid: string) => {
      this.props.baseContentStore!.load(uuid)
    })
    this.props.problemSolveStore!.load(this.props.assignment.uuid)
    this.loadNextUnsolvedProblem(0, this.props.assignment)
    this.props.studentAssignmentStore!.loadCompletionDetails(
      this.props.assignment.uuid
    )
  }

  componentWillUnmount() {
    this.stopTimer()
  }

  async handleSubmit(status: string, moves: string) {
    this.attempt.status = status
    this.attempt.moves = moves
    this.attempt.timeTaken = this.state.time
    await this.props.problemSolveStore!.submit(
      this.props.assignment.uuid,
      this.attempt
    )
  }

  handleViewProblems = (e: any) => {
    this.setState({ showCongrats: false })
    this.loadProblem(0, this.props.problemSolveStore!.assignment)
  }

  handleMove = (move: ChessTypes.ChessJSVerboseMove) => {
    this.chess.move(move)
    if (
      this.problemReader!.move({
        from: move.from,
        to: move.to,
        promotion: move.promotion
          ? (move.promotion.toLowerCase() as ChessTypes.PromotionPiece)
          : undefined
      })
    ) {
      this.setState({
        fen: this.chess.fen(),
        status: 'correct',
        moves: this.chess.pgn()
      })
    } else {
      this.setState({ status: 'incorrect' })
      this.handleSubmit('unsolved', this.chess.pgn())
      this.chess.undo()
      setTimeout(() => {
        this.setState({ status: '' })
      }, 2000)
    }
  }

  renderErrorState = () => {
    return (
      <div className="problems-solve">
        <div className="inner">
          <div className="error-state container">
            <Icon type="exception" />
            <p className="exception-text">
              {this.props.problemSolveStore!.error}.
            </p>
            <span className="action-text">
              <Button
                type="danger"
                onClick={() =>
                  this.props.problemSolveStore!.load(this.props.assignment.uuid)
                }
              >
                Retry
              </Button>
            </span>
          </div>
        </div>
      </div>
    )
  }

  renderLoadingState = () => {
    return (
      <div className="problems-solve">
        <div className="inner">
          <div className="loading-state container">
            <Icon type="loading" spin={true} />
            <p className="exception-text">Loading</p>
          </div>
        </div>
      </div>
    )
  }

  render() {
    if (this.state.allSolved && this.state.showCongrats) {
      return (
        <div className="problems-solve">
          <div className="all-solved">
            <h4>Congrats!</h4>
            <Icon type="check-circle" />
            <h4>You have solved all the problems!</h4>

            <Button
              size="large"
              type="primary"
              onClick={this.handleViewProblems}
            >
              View Problems
            </Button>
          </div>
        </div>
      )
    }

    const problem = this.props.baseContentStore!.content[
      this.props.problemUuids[this.state.currentPbmIndex]
    ]

    if (this.props.problemSolveStore!.error) {
      return this.renderErrorState()
    }

    if (
      !problem ||
      problem.loading ||
      this.props.problemSolveStore!.loading ||
      !this.props.studentAssignmentStore!.completionDetails[
        this.props.assignment.uuid
      ] ||
      this.props.studentAssignmentStore!.completionDetails[
        this.props.assignment.uuid
      ].loading
    ) {
      return this.renderLoadingState()
    }

    if (this.state.fen === '') {
      this.chess.load(problem.content!.startFen || Util.DEFAULT_START_FEN)
      this.setState({
        fen: problem.content!.startFen || Util.DEFAULT_START_FEN,
        orientation: getSideToMove(
          problem.content!.startFen || Util.DEFAULT_START_FEN
        )
      })
    }

    return (
      <div className="problems-solve">
        <Measure
          bounds={true}
          onResize={contentRect =>
            this.setState({ boardSize: contentRect.bounds!.width - 25 })
          }
        >
          {({ measureRef }) => {
            return (
              <div ref={measureRef} className="left">
                <div style={{ border: '2px solid #000' }}>
                  <ConfiguredChessboard
                    fen={
                      this.state.fen ||
                      problem.content!.startFen ||
                      Util.DEFAULT_START_FEN
                    }
                    interactionMode={this.state.interactionMode}
                    width={this.state.boardSize}
                    height={this.state.boardSize}
                    onMove={this.handleMove}
                    orientation={this.state.orientation}
                  />
                </div>
              </div>
            )
          }}
        </Measure>
        <div className="right">
          <div className="problems">
            <Button
              disabled={this.state.currentPbmIndex === 0 && true}
              onClick={() =>
                this.loadProblem(
                  this.state.currentPbmIndex - 1,
                  this.props.problemSolveStore!.assignment
                )
              }
            >
              <Icon type="double-left" />
            </Button>
            <div>
              <h4>{this.state.currentPbmIndex + 1}</h4>(
              {this.state.currentPbmIndex + 1}/{this.props.problemUuids.length}){' '}
              {this.state.orientation === 'w' ? 'White' : 'Black'} to Play
            </div>
            <Button
              disabled={
                this.state.currentPbmIndex ===
                  this.props.problemUuids.length - 1 && true
              }
              onClick={() =>
                this.loadProblem(
                  this.state.currentPbmIndex + 1,
                  this.props.problemSolveStore!.assignment
                )
              }
            >
              <Icon type="double-right" />
            </Button>
          </div>
          <div className="timer">
            <div className="clock">
              <Icon type="clock-circle" /> {secondsToTime(this.state.time)}
            </div>
            {this.state.status !== '' && (
              <Tag
                style={{ cursor: 'not-allowed' }}
                color={
                  this.state.status === 'solved'
                    ? '#52c41a'
                    : this.state.status === 'incorrect'
                    ? '#f5222d'
                    : '#108ee9'
                }
              >
                {this.state.status.toUpperCase()}
              </Tag>
            )}
          </div>
          <div className="moves">{extractMoves(this.state.moves)}</div>
        </div>
      </div>
    )
  }
}
