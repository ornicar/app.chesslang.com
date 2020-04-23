import React, { ChangeEvent } from 'react'
import { inject, observer } from 'mobx-react'
import PropTypes from 'prop-types'
import {
  Modal,
  Upload,
  Icon,
  Divider,
  Input,
  Radio,
  Select,
  Button,
  message,
  Progress
} from 'antd'
import { RadioChangeEvent } from 'antd/lib/radio'

import './pgn-upload-modal.less'

import { GameboxDatabaseStore } from '../../../stores/gamebox-database'

const ONE_KILO_BYTE = 1024
// const TWO_FIFTY_KBYTES = 250 * ONE_KILO_BYTE
const TWO_THOUSAND_KBYTES = 2000 * ONE_KILO_BYTE

interface Props {
  gameboxDatabaseStore?: GameboxDatabaseStore
  visible: boolean
  onClose: () => any
}

interface State {
  afterUploadAction: 'create' | 'merge'
  file: null | File
  newDatabaseName: string
  mergeDatabaseUuid?: string
}

function isPGN(file: File) {
  return file.name.endsWith('.pgn')
}

function isLessThan2MB(file: File) {
  return file.size < TWO_THOUSAND_KBYTES
}

const INIT_STATE: State = {
  afterUploadAction: 'create', // or 'merge'
  file: null,
  newDatabaseName: '',
  mergeDatabaseUuid: undefined
}

@inject('gameboxDatabaseStore')
@observer
export default class PgnUploadModal extends React.Component<Props, State> {
  static propTypes = {
    visible: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired
  }

  state = INIT_STATE

  cleanUpAndClose = () => {
    this.props.onClose()
    this.setState(INIT_STATE)
  }

  allFieldsValid = () => {
    return (
      (!!this.state.file &&
        this.state.afterUploadAction === 'create' &&
        this.state.newDatabaseName.trim()) ||
      (this.state.afterUploadAction === 'merge' && this.state.mergeDatabaseUuid)
    )
  }

  databaseSelectFilterOption = (inputValue: string, option: any) => {
    return (
      option.props.children
        .toString()
        .toLowerCase()
        .indexOf(inputValue.toLowerCase()) >= 0
    )
  }

  handleNewDatabaseNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    this.setState({ newDatabaseName: e.currentTarget.value })
  }

  handleMergeDatabaseChange = (uuid: any) => {
    this.setState({ mergeDatabaseUuid: uuid })
  }

  handleAfterUploadActionChange = (action: RadioChangeEvent) => {
    this.setState({
      afterUploadAction: action.target.value as 'create' | 'merge'
    })
  }

  handleFileRemove = () => {
    this.setState({ file: null })
  }

  beforeUpload = (file: File) => {
    if (!isPGN(file)) {
      message.error('Only PGN files are allowed')
    }
    if (!isLessThan2MB(file)) {
      message.error('PGN file size must be lesser than 2 MB')
    }

    if (isPGN(file) && isLessThan2MB(file)) {
      this.setState({ file })
    }

    return false
  }

  handleUpload = async () => {
    try {
      await this.props.gameboxDatabaseStore!.upload({
        file: this.state.file!,
        ...(this.state.afterUploadAction === 'create'
          ? { create: this.state.newDatabaseName }
          : {}),
        ...(this.state.afterUploadAction === 'merge'
          ? { merge: this.state.mergeDatabaseUuid }
          : {})
      })
      this.cleanUpAndClose()
      message.success('Uploaded, parsing PGN')
    } catch (e) {
      console.log('--> error: ', e)
      message.error('There was an error uploading the PGN')
    }
  }

  renderUploader = () => {
    if (this.state.file) {
      return (
        <div className="ant-upload ant-upload-drag">
          {this.props.gameboxDatabaseStore!.uploading && (
            <Progress
              style={{ position: 'relative', top: -8 }}
              percent={this.props.gameboxDatabaseStore!.uploadProgressPercent}
              status="active"
              showInfo={false}
            />
          )}
          <span className="ant-upload ant-upload-btn">
            <p className="ant-upload-drag-icon">
              <Icon type="upload" />
            </p>
            <p className="ant-upload-text">
              {this.state.file.name}{' '}
              <Button
                disabled={this.props.gameboxDatabaseStore!.uploading}
                size="small"
                type="danger"
                shape="circle"
                icon="close"
                onClick={this.handleFileRemove}
              />
            </p>
            <p className="ant-upload-hint">
              {(this.state.file.size / ONE_KILO_BYTE).toFixed(2)}kB
            </p>
          </span>
        </div>
      )
    }

    return (
      <Upload.Dragger
        disabled={this.props.gameboxDatabaseStore!.uploading}
        accept=".pgn,application/x-chess-pgn"
        supportServerRender={true}
        showUploadList={false}
        fileList={this.state.file ? [this.state.file] : []}
        beforeUpload={this.beforeUpload}
      >
        <p className="ant-upload-drag-icon">
          <Icon type="upload" />
        </p>
        <p className="ant-upload-text">Click or drag PGN File to this area</p>
        <p className="ant-upload-hint">File size limit: 2 MB</p>
      </Upload.Dragger>
    )
  }

  render() {
    const mockOptions = this.props.gameboxDatabaseStore!.databases.map(
      (d: any) => (
        <Select.Option key={d.uuid} value={d.uuid}>
          {d.name}
        </Select.Option>
      )
    )
    return (
      <Modal
        title={
          this.props.gameboxDatabaseStore!.uploading
            ? 'Uploading PGN...'
            : 'Upload PGN'
        }
        style={{ width: 600 }}
        visible={this.props.visible}
        onCancel={this.cleanUpAndClose}
        maskClosable={false}
        okButtonProps={{
          loading: this.props.gameboxDatabaseStore!.uploading,
          disabled: !this.allFieldsValid()
        }}
        okText="Upload"
        cancelButtonProps={{
          disabled: this.props.gameboxDatabaseStore!.uploading
        }}
        closable={!this.props.gameboxDatabaseStore!.uploading}
        destroyOnClose={true}
        onOk={this.handleUpload}
      >
        {this.renderUploader()}
        <Divider>
          After upload: &nbsp;
          <Radio.Group
            disabled={this.props.gameboxDatabaseStore!.uploading}
            defaultValue="create"
            buttonStyle="solid"
            onChange={this.handleAfterUploadActionChange}
            value={this.state.afterUploadAction}
          >
            <Radio.Button value="create">Create Database</Radio.Button>
            <Radio.Button value="merge">Merge with Existing</Radio.Button>
          </Radio.Group>
        </Divider>
        {this.state.afterUploadAction === 'create' && (
          <Input
            disabled={this.props.gameboxDatabaseStore!.uploading}
            placeholder="Enter New Database Name"
            onChange={this.handleNewDatabaseNameChange}
            value={this.state.newDatabaseName}
            maxLength={50}
          />
        )}
        {this.state.afterUploadAction === 'merge' && (
          <Select
            disabled={this.props.gameboxDatabaseStore!.uploading}
            style={{ width: '100%' }}
            showSearch={true}
            placeholder="Search for an existing database"
            defaultActiveFirstOption={false}
            showArrow={false}
            filterOption={this.databaseSelectFilterOption}
            // onSearch={this.handleSearch}
            onChange={this.handleMergeDatabaseChange}
            value={this.state.mergeDatabaseUuid}
            // notFoundContent={null}
          >
            {mockOptions}
          </Select>
        )}
      </Modal>
    )
  }
}
