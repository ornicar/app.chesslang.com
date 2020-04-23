import React from 'react'
import { Icon, Button, Table } from 'antd'
import Measure from 'react-measure'
import { inject, observer } from 'mobx-react'

import './game-list.less'
import { GameboxDatabaseGameStore } from '../../../stores/gamebox-database-game'
import { withRouter, RouteComponentProps } from 'react-router'

interface GameShape {
  uuid: string
  index: number
  meta: {
    event: string
    site: string
    date: string
    round: string
    white: string
    black: string
    result: '1-0' | '0-1' | '1/2-1/2' | '*'
    [key: string]: string
  }
}

interface Props {
  loading: boolean
  error: boolean
  games: GameShape[]
  selectedGameUuid?: string
  onErrorRetry: () => any
  onGameSelect: (uuid: string) => any
  onGameEdit: (uuid: string) => any
}

interface State {
  height: number
}

class WrappedGameList extends React.Component<Props, State> {
  state = {
    height: -1
  }

  handleGameSelect = (uuid: string) => () => {
    this.props.onGameSelect(uuid)
  }

  getRowClassName = (record: GameShape, _: any) => {
    return record.uuid === this.props.selectedGameUuid ? 'rowSelected' : ''
  }

  handleRow = (record: GameShape, _: any) => ({
    onClick: () => {
      this.props.onGameSelect(record.uuid)
    }
  })

  renderLoadingOverlay = () => {
    if (this.props.loading) {
      return (
        <div className={'loadingOverlay'}>
          <Icon type="loading" />
        </div>
      )
    }

    return null
  }

  renderErrorOverlay = () => {
    if (this.props.error) {
      return (
        <div className={'errorOverlay'}>
          <Icon type="api" />
          <p>We encountered an error while loading games</p>
          <Button size="small" type="primary" onClick={this.props.onErrorRetry}>
            Retry
          </Button>
        </div>
      )
    }

    return null
  }

  // TODO: Infinite list
  renderGames = () => {
    const columns = [
      {
        width: 100,
        title: 'S No',
        dataIndex: 'index'

      }
      {
        width: 200,
        title: 'White',
        dataIndex: 'meta.white'
      },
      {
        width: 200,
        title: 'Black',
        dataIndex: 'meta.black'
      },
      {
        width: 250,
        title: 'Event',
        dataIndex: 'meta.event'
      },
      {
        width: 200,
        title: 'Date',
        dataIndex: 'meta.date'
      },
      {
        width: 100,
        title: 'Result',
        dataIndex: 'meta.result'
      },
      {
        width: 100,
        title: 'Edit Game',
        key: 'edit-game',
        render: (text: any, record: any) => {
          return (
            <a
              onClick={() => {
                this.props.onGameEdit(record.uuid)
              }}
            >
              Edit
            </a>
          )
        }
      }
    ]

    return (
      <Table
        style={{ width: '100%' }}
        scroll={{ x: true, y: 300 }}
        size="small"
        pagination={false}
        dataSource={this.props.games}
        rowKey="uuid"
        columns={columns}
        rowClassName={this.getRowClassName}
        onRow={this.handleRow}
      />
    )
  }

  render() {
    return (
      <Measure
        bounds
        onResize={contentRect => {
          this.setState({ height: contentRect.bounds!.height })
        }}
      >
        {({ measureRef }) => (
          <div ref={measureRef} className={'gameList inner'}>
            {this.renderGames()}
            {this.renderLoadingOverlay()}
            {this.renderErrorOverlay()}
          </div>
        )}
      </Measure>
    )
  }
}

interface DatabaseGameProps extends RouteComponentProps<any> {
  gameboxDatabaseGameStore?: GameboxDatabaseGameStore
  databaseUuid?: string
  selectedGameUuid?: string
  onGameSelect: (uuid: string) => any
}

@inject('gameboxDatabaseGameStore')
@observer
class GameList extends React.Component<DatabaseGameProps, {}> {
  componentDidMount() {
    if (this.props.databaseUuid) {
      this.props.gameboxDatabaseGameStore!.load({
        databaseUuid: this.props.databaseUuid
      })
    }
  }

  componentWillReceiveProps(nextProps: DatabaseGameProps) {
    if (
      nextProps.databaseUuid &&
      nextProps.databaseUuid !== this.props.databaseUuid
    ) {
      this.props.gameboxDatabaseGameStore!.load({
        databaseUuid: nextProps.databaseUuid
      })
    }
  }

  handleGameEdit = (gameUuid: string) => {
    this.props.history.push('/app/board?gameUuid=' + gameUuid)
  }

  render() {
    const databaseGame = this.props.gameboxDatabaseGameStore!

    if (!this.props.databaseUuid) {
      return (
        <div className={'gameList noDbSelected'}>
          <p>Select a database to list the games</p>
        </div>
      )
    }

    return (
      <WrappedGameList
        loading={databaseGame.loading}
        error={databaseGame.error}
        onErrorRetry={() =>
          databaseGame.load({
            databaseUuid: this.props.databaseUuid!
          })
        }
        games={databaseGame.games}
        onGameSelect={this.props.onGameSelect}
        selectedGameUuid={this.props.selectedGameUuid}
        onGameEdit={this.handleGameEdit}
      />
    )
  }
}

export default withRouter(GameList)
