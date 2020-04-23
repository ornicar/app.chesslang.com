import * as React from 'react'
import { inject, observer } from 'mobx-react'
import {
  message,
  Icon,
  Button,
  Divider,
  Select,
  Input,
  Breadcrumb,
  Popconfirm
} from 'antd'

import { GameboxDatabaseStore } from '../../../../stores/gamebox-database'
import DBList from '../../../../components/gamebox/db-list/db-list'
import GameList from '../../../../components/gamebox/game-list/game-list'
import GamePreview from '../../../../components/gamebox/game-preview/game-preview'

interface Props {
  gameboxDatabaseStore?: GameboxDatabaseStore
}

interface State {
  selectedDatabaseUuid?: string
  selectedGameUuid?: string
  sortBy: string
  search: string
}

@inject('gameboxDatabaseStore')
@observer
export class SharedWithMe extends React.Component<Props, State> {
  state = {
    selectedDatabaseUuid: undefined, // TODO: two-way bind to URL
    selectedGameUuid: undefined, // TODO: two-way bind to URL
    sortBy: 'name_asc',
    search: ''
  }

  handleDbListDatabaseSelect = (uuid: string) => {
    this.setState({
      selectedDatabaseUuid: uuid,
      selectedGameUuid: undefined
    })
  }

  handleGameListGameSelect = (uuid: string) => {
    this.setState({ selectedGameUuid: uuid })
  }

  handleSortByChange = (value: any) => {
    this.setState({ sortBy: value })
  }

  handleSearchInputChange = (e: any) => {
    this.setState({ search: e.currentTarget.value })
  }

  handleDownloadDatabase = (e: any) => {
    this.props.gameboxDatabaseStore?.download(this.state.selectedDatabaseUuid!)
  }

  render() {
    return (
      <div className="gamebox inner">
        <div className={'container'}>
          <div className={'innerContainer'}>
            <div className={'left'}>
              <div className={'actionBar'}>
                {this.state.selectedDatabaseUuid && (
                  <Button
                    style={{ marginRight: '8px' }}
                    onClick={this.handleDownloadDatabase}
                  >
                    <Icon type="download" /> Download
                  </Button>
                )}
                <div className={'spacer'} />
                <Input.Search
                  style={{ width: 200 }}
                  className={'searchInput'}
                  placeholder="Search by name"
                  onChange={this.handleSearchInputChange}
                />
                <Select
                  style={{ width: 200 }}
                  placeholder="Sort (↑ Name)"
                  onChange={this.handleSortByChange}
                >
                  <Select.Option value="name_asc">↑ Name</Select.Option>
                  <Select.Option value="name_desc">↓ Name</Select.Option>
                  <Select.Option value="games_asc">↑ Games</Select.Option>
                  <Select.Option value="games_desc">↓ Games</Select.Option>
                </Select>
              </div>
              <Divider />
              <div className={'dbList'}>
                <DBList
                  listSelector="sharedWithMeDatabases"
                  sortBy={this.state.sortBy}
                  search={this.state.search}
                  onDatabaseSelect={this.handleDbListDatabaseSelect}
                  selectedDatabaseUuid={this.state.selectedDatabaseUuid}
                />
              </div>
              <div className={'gameList'}>
                <GameList
                  databaseUuid={this.state.selectedDatabaseUuid}
                  onGameSelect={this.handleGameListGameSelect}
                  selectedGameUuid={this.state.selectedGameUuid}
                />
              </div>
            </div>
            <Divider style={{ height: '100%' }} type="vertical" />
            <div className={'right'}>
              <div className={'gamePreview'}>
                <GamePreview
                  gameUuid={this.state.selectedGameUuid}
                  isAnalyzeFeatureOn={false}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
