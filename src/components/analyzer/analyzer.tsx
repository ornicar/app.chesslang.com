import React, { Component } from 'react'
import { Button, Spin, Icon, Table } from 'antd'
import { AnalyzerStore } from '../../stores/analyzer'
import './analyzer.less'
import { inject, observer } from 'mobx-react'
import { variationToPGN } from '@chesslang/chess/build/Util/Util'
import { integer } from 'aws-sdk/clients/storagegateway'

interface Props {
  moves: any
  fen: any
  onClick: Function
  onAnalyzeMoveClick: Function
  analyzerStore: AnalyzerStore
}
@inject('analyzerStore')
@observer
class Analyzer extends Component<Props /*, State*/> {
  constructor(props: Readonly<Props>) {
    super(props)
    this.onTableRowExpand = this.onTableRowExpand.bind(this)
  }
  componentDidMount() {
    this.props.analyzerStore.resetValues()
    this.props.analyzerStore.setParams(this.props.fen, this.props.moves)
    this.props.analyzerStore.setPrevFen('')
    this.props.analyzerStore.setNextFen('')
  }

  componentDidUpdate(prevProps: any) {
    if (
      this.props.analyzerStore.compareArrays(prevProps.moves, this.props.moves)
    ) {
      this.props.analyzerStore.resetValues()
      this.props.analyzerStore.setParams(this.props.fen, this.props.moves)
      this.props.analyzerStore.setPrevFen('')
      this.props.analyzerStore.setNextFen('')
    }
  }
  componentWillUnmount() {
    this.props.analyzerStore.resetValues()
  }

  analyze = () => {
    this.props.analyzerStore.fetchData()
  }

  setFen(fen: string) {
    this.props.onAnalyzeMoveClick(fen)
    this.props.analyzerStore.setBoardFen(fen)
  }

  clickNext = () => {
    if (this.props.analyzerStore.nextFen != '') {
      this.props.onAnalyzeMoveClick(this.props.analyzerStore.nextFen)
      this.props.analyzerStore.setBoardFen(this.props.analyzerStore.nextFen)
    }
  }
  clickPrev = () => {
    if (this.props.analyzerStore.prevFen != '') {
      this.props.onAnalyzeMoveClick(this.props.analyzerStore.prevFen)
      this.props.analyzerStore.setBoardFen(this.props.analyzerStore.prevFen)
    }
  }

  errorDisplay() {
    return (
      <div className={'errorOverlay'}>
        <Icon type="api" />
        <p>We encountered an error while loading the analysis.</p>
        <Button size="small" type="primary" onClick={this.analyze}>
          Retry
        </Button>
      </div>
    )
  }
  onTableRowExpand(expanded: any, record: any) {
    var keys = []
    if (expanded) {
      keys.push(record.key)
    }

    this.props.analyzerStore.setExpandedRowKeys(keys)
    this.props.analyzerStore.setBoardFen('')
    this.props.analyzerStore.setNextFen(record.bestVarMoves[0].fen)
  }

  loadingDisplay() {
    return (
      <div className={'loadingOverlay'}>
        <Icon type="loading" />
      </div>
    )
  }
  rowClick = (record: any) => {
    this.props.analyzerStore.setPrevFen('')
    this.props.analyzerStore.setNextFen(record.bestVarMoves[0].fen)
    this.props.analyzerStore.setBoardFen('')
    this.props.onClick([record.key])
  }
  render() {
    return (
      <div className={'analyzer'}>
        <h1 style={{ display: 'none' }}>{this.props.analyzerStore.boardFen}</h1>
        <Button type="primary" onClick={this.analyze} block>
          ANALYZE
        </Button>
        {this.props.analyzerStore.isLoading && this.loadingDisplay()}
        {this.props.analyzerStore.analysisLoaded && (
          <Table
            columns={this.props.analyzerStore.columns}
            onRow={(record: any) => ({
              onClick: () => {
                this.rowClick(record)
              }
            })}
            expandedRowKeys={this.props.analyzerStore.expandedRowKeys}
            onExpand={this.onTableRowExpand}
            expandedRowRender={(record: any) => {
              let a = (
                <div className={'best-move'} style={{ margin: 0 }}>
                  <span>{record.bestMove}</span>
                  <br />
                  <br />
                  <div className={'variation'}>
                    {record.bestVarMoves.map((rec: any, i: integer) => {
                      let str_classname = 'move'
                      if (this.props.analyzerStore.boardFen == rec.fen) {
                        str_classname += ' current'
                        if (i > 0) {
                          this.props.analyzerStore.setPrevFen(
                            record.bestVarMoves[i - 1].fen
                          )
                        } else {
                          this.props.analyzerStore.setPrevFen('')
                        }
                        if (i < record.bestVarMoves.length - 1) {
                          this.props.analyzerStore.setNextFen(
                            record.bestVarMoves[i + 1].fen
                          )
                        } else {
                          this.props.analyzerStore.setNextFen('')
                        }
                      }
                      if (rec.side == 'w') {
                        let b = (
                          <span
                            className={str_classname}
                            onClick={() => {
                              this.setFen(rec.fen)
                            }}
                            style={{ margin: 5 }}
                          >
                            {rec.moveNumber.toString() + '.' + rec.san}
                          </span>
                        )

                        return b
                      } else {
                        let j = ''
                        if (
                          rec.moveNumber == record.moveNumber &&
                          record.move1 == '...'
                        ) {
                          j = rec.moveNumber.toString() + '. ... '
                        }
                        let b = (
                          <span
                            className={'move ' + str_classname}
                            onClick={() => {
                              this.setFen(rec.fen)
                            }}
                            style={{ margin: 5 }}
                          >
                            {j + rec.san}
                          </span>
                        )

                        return b
                      }
                    })}
                    <div className={'controlButtons'}>
                      <Button
                        icon="step-backward"
                        size="small"
                        onClick={this.clickPrev}
                      />
                      <Button
                        icon="step-forward"
                        size="small"
                        onClick={this.clickNext}
                      />
                    </div>
                  </div>
                </div>
              )
              return a
            }}
            dataSource={this.props.analyzerStore.analysisData}
            pagination={false}
          />
        )}
        {this.props.analyzerStore.noData && <h2>All good moves!</h2>}
        {this.props.analyzerStore.errorPresent && this.errorDisplay()}
      </div>
    )
  }
}

export default Analyzer
