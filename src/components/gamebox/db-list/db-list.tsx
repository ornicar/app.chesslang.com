import * as R from 'ramda'
import React from 'react'
import { Icon, Button } from 'antd'
import { observer, inject } from 'mobx-react'
import QueueAnim from 'rc-queue-anim'

import './db-list.less'
import { GameboxDatabaseStore } from '../../../stores/gamebox-database'
import { getFormattedName } from '../../../utils/utils'

interface Db {
  uuid: string
  name: string
  gameCount: number
  lastModified: string | number
  sharedWith: string[]
  owner: any
}

interface Props {
  loading: boolean
  error: boolean
  databases: Db[]
  selectedDatabaseUuid?: string
  onErrorRetry: () => any
  onDatabaseSelect: (uuid: string) => any
  displayOwnerName: boolean
}

interface State {}

class WrappedDbList extends React.Component<Props, State> {
  handleDatabaseSelect = (uuid: string) => () => {
    this.props.onDatabaseSelect(uuid)
  }

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
          <p>We encountered an error while loading databases</p>
          <Button size="small" type="primary" onClick={this.props.onErrorRetry}>
            Retry
          </Button>
        </div>
      )
    }

    return null
  }

  renderEmptyOverlay = () => {
    if (this.props.error || this.props.loading) {
      return null
    }

    return (
      <div className={'emptyOverlay'}>
        <Icon type="file" theme="filled" />
        <p>You do not have any databases or search criteria doesn't match</p>
      </div>
    )
  }

  // TODO: Infinite list
  renderDatabases = () => {
    return (
      <QueueAnim type="scale" style={{ display: 'flex', flexWrap: 'wrap' }}>
        {this.props.databases.map(d => (
          <div
            key={d.uuid}
            className={[
              'database',
              this.props.selectedDatabaseUuid === d.uuid ? 'selected' : ''
            ].join(' ')}
            onClick={this.handleDatabaseSelect(d.uuid)}
          >
            <Icon className={'fileIcon'} type="file" theme="filled" />
            <span className={'name'}>
              {d.name}{' '}
              {this.props.displayOwnerName &&
                `(${d.owner.firstname} ${d.owner.lastname})`}
            </span>
            <span className={'gameCount'}>
              {d.gameCount} {d.gameCount === 1 ? 'game' : 'games'}
            </span>
          </div>
        ))}
      </QueueAnim>
    )
  }

  render() {
    return (
      <div className={'dbList inner'}>
        {this.props.databases.length > 0 && this.renderDatabases()}
        {this.props.databases.length === 0 && this.renderEmptyOverlay()}
        {this.renderLoadingOverlay()}
        {this.renderErrorOverlay()}
      </div>
    )
  }
}

interface WrapperProps {
  sortBy: string
  search: string
  gameboxDatabaseStore?: GameboxDatabaseStore
  selectedDatabaseUuid?: string
  listSelector: 'databases' | 'myDatabases' | 'sharedWithMeDatabases'
  onDatabaseSelect: (uuid: string) => any
}

@inject('gameboxDatabaseStore')
@observer
export default class DBList extends React.Component<WrapperProps> {
  async componentWillMount() {
    await this.props.gameboxDatabaseStore!.load()
  }

  sortDatabases = (sortBy: string, databases: any[]) => {
    const [key, dir] = sortBy.split('_')

    if (key === 'games') {
      const _databases = R.sortBy(d => d.gameCount, databases)
      return dir === 'desc' ? _databases.reverse() : _databases
    }

    if (key === 'name') {
      const _databases = R.sortBy(d => d.name, databases)
      return dir === 'desc' ? _databases.reverse() : _databases
    }

    return databases
  }

  getDatabaseList = () => {
    if (this.props.listSelector === 'databases') {
      return this.props.gameboxDatabaseStore!.databases || []
    }

    if (this.props.listSelector === 'myDatabases') {
      return this.props.gameboxDatabaseStore!.myDatabases || []
    }

    if (this.props.listSelector === 'sharedWithMeDatabases') {
      return this.props.gameboxDatabaseStore!.sharedWithMeDatabases || []
    }

    return []
  }

  render() {
    const database = this.props.gameboxDatabaseStore!
    const databases = this.sortDatabases(
      this.props.sortBy,
      R.filter(
        d =>
          (d.name || '')
            .toLowerCase()
            .includes((this.props.search || '').toLowerCase()),
        this.getDatabaseList()
      )
    )

    return (
      <WrappedDbList
        loading={database.loading}
        error={database.error}
        onErrorRetry={() => database.load()}
        databases={databases}
        selectedDatabaseUuid={this.props.selectedDatabaseUuid}
        displayOwnerName={this.props.listSelector == 'sharedWithMeDatabases'}
        onDatabaseSelect={this.props.onDatabaseSelect}
      />
    )
  }
}
