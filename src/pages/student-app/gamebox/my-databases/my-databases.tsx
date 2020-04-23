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
import PgnUploadModal from '../../../../components/gamebox/pgn-upload-modal/pgn-upload-modal'
import GameList from '../../../../components/gamebox/game-list/game-list'
import GamePreview from '../../../../components/gamebox/game-preview/game-preview'
import ShareDatabaseModal from '../../../../components/gamebox/share-database-modal/share-database-modal'

interface Props {
  gameboxDatabaseStore?: GameboxDatabaseStore
}

interface State {
  uploadPgnVisible: boolean
  selectedDatabaseUuid?: string
  selectedGameUuid?: string
  newDatabaseVisible: boolean
  shareDatabaseVisible: boolean
  editDatabaseVisible: boolean
  sortBy: string
  search: string
}

@inject('gameboxDatabaseStore')
@observer
export class MyDatabases extends React.Component<Props, State> {
  state = {
    uploadPgnVisible: false,
    selectedDatabaseUuid: undefined, // TODO: two-way bind to URL
    selectedGameUuid: undefined, // TODO: two-way bind to URL
    newDatabaseVisible: false,
    shareDatabaseVisible: false,
    editDatabaseVisible: false,
    sortBy: 'name_asc',
    search: ''
  }

  toggleUploadPgnVisible = () => {
    this.setState({
      uploadPgnVisible: !this.state.uploadPgnVisible
    })
  }

  toggleNewDatabaseVisible = () => {
    this.setState({
      newDatabaseVisible: !this.state.newDatabaseVisible
    })
  }

  toggleEditDatabaseVisible = () => {
    this.setState({
      editDatabaseVisible: !this.state.editDatabaseVisible
    })
  }

  toggleShareDatabaseVisible = () => {
    this.setState({
      shareDatabaseVisible: !this.state.shareDatabaseVisible
    })
  }

  handleDeleteDatabase = async () => {
    const uuid = this.state.selectedDatabaseUuid!
    try {
      this.setState({ selectedDatabaseUuid: undefined })
      const result = await this.props.gameboxDatabaseStore!.deleteDb({ uuid })
      if (result) {
        message.success('Database deleted successfuly')
      } else {
        this.setState({ selectedDatabaseUuid: uuid })
        message.error('Failed to delete database')
      }
    } catch (e) {
      this.setState({ selectedDatabaseUuid: uuid })
      message.error('Failed to delete database')
    }
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
                <Button
                  className={'uploadPgnButton'}
                  onClick={this.toggleUploadPgnVisible}
                  loading={this.props.gameboxDatabaseStore!.uploading}
                >
                  <Icon
                    style={{
                      opacity: this.props.gameboxDatabaseStore!.uploading
                        ? 0
                        : 1
                    }}
                    type="upload"
                  />{' '}
                  Upload PGN
                </Button>
                {/* <Button
                  className={styles.newDbButton}
                  onClick={this.toggleNewDatabaseVisible}
                  loading={this.props.gameboxDatabaseStore.creating}
                >
                  <Icon
                    style={{
                      opacity: this.props.gameboxDatabaseStore.creating ? 0 : 1
                    }}
                    type="file-add"
                  />{' '}
                  New
                </Button> */}
                {this.state.selectedDatabaseUuid && (
                  <Button
                    className={'shareDbButton'}
                    onClick={this.toggleShareDatabaseVisible}
                  >
                    <Icon type="share-alt" /> Share
                  </Button>
                )}
                {this.state.selectedDatabaseUuid && (
                  <Button
                    style={{ marginRight: '8px' }}
                    onClick={this.handleDownloadDatabase}
                  >
                    <Icon type="download" /> Download
                  </Button>
                )}

                {/* {this.state.selectedDatabaseUuid && (
                  <Button
                    className={styles.editDbButton}
                    onClick={this.toggleEditDatabaseVisible}
                    loading={this.props.gameboxDatabaseStore.updating}
                  >
                    <Icon
                      style={{
                        opacity: this.props.gameboxDatabaseStore.updating ? 0 : 1
                      }}
                      type="edit"
                    />{' '}
                    Edit
                  </Button>
                )} */}
                {this.state.selectedDatabaseUuid && (
                  <Popconfirm
                    title="Warning, this action cannot be undone"
                    onConfirm={this.handleDeleteDatabase}
                  >
                    <Button
                      className={'deleteDb'}
                      loading={this.props.gameboxDatabaseStore!.deleting}
                      type="danger"
                    >
                      <Icon
                        style={{
                          opacity: this.props.gameboxDatabaseStore!.deleting
                            ? 0
                            : 1
                        }}
                        type="delete"
                      />
                    </Button>
                  </Popconfirm>
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
                  listSelector="myDatabases"
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
        <PgnUploadModal
          visible={this.state.uploadPgnVisible}
          onClose={this.toggleUploadPgnVisible}
        />
        <ShareDatabaseModal
          type="student"
          databaseUuid={this.state.selectedDatabaseUuid!}
          visible={this.state.shareDatabaseVisible}
          onClose={this.toggleShareDatabaseVisible}
        />
        {/* <NewDatabaseModal
          visible={this.state.newDatabaseVisible}
          onClose={this.toggleNewDatabaseVisible}
          databaseStore={{ creating: false }}
        /> */}
      </div>
    )
  }
}
