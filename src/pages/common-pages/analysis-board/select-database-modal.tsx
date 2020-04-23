import React, { Component } from 'react'
import {
  List,
  Modal,
  Input,
  Row,
  Col,
  Button,
  Popover,
  Icon,
  Table
} from 'antd'
import Search from 'antd/lib/input/Search'

interface Props {
  visible: boolean
  onCancel: () => void
  onSelectDatabase: (database: any) => void
  onCreateDatabase: (name: string) => void
  databases: any
}

interface State {
  popoverVisible: boolean
  searchText: string
  databaseName: string
}

interface DatabaseItem {
  uuid: string
  name: string
}

class SelectDatabaseModal extends Component<Props, State> {
  state = {
    searchText: '',
    popoverVisible: false,
    databaseName: ''
  }
  handleItemClick = (database: any) => {
    this.props.onSelectDatabase(database)
  }

  handleSearchText = (e: any) => {
    this.setState({
      searchText: e.target.value
    })
  }

  handleDatabaseNameChange = (e: any) => {
    this.setState({
      databaseName: e.target.value
    })
  }

  handleCreateDatabase = () => {
    this.setState({ popoverVisible: false })
    this.props.onCreateDatabase(this.state.databaseName)
  }

  handleVisibleChange = (popoverVisible: any) => {
    this.setState({ popoverVisible })
  }

  renderCreateNewButton = () => {
    const createConfirmation = (
      <Icon type="check-circle" onClick={this.handleCreateDatabase}></Icon>
    )

    const content = (
      <div>
        <Input
          placeholder="Enter Database name"
          value={this.state.databaseName}
          onChange={this.handleDatabaseNameChange}
          addonAfter={createConfirmation}
        />
      </div>
    )

    return (
      <div>
        <Popover
          content={content}
          trigger="click"
          visible={this.state.popoverVisible}
          onVisibleChange={this.handleVisibleChange}
        >
          <a style={{ paddingLeft: '16px' }}>Create New</a>
        </Popover>
      </div>
    )
  }

  render() {
    const dataSource = this.props.databases.filter((d: any) => {
      return (
        d.name.toLowerCase().indexOf(this.state.searchText.toLowerCase()) != -1
      )
    })
    const dataSource2 = this.props.databases.filter((d: any) => {
      return (
        d.name.toLowerCase().indexOf(this.state.searchText.toLowerCase()) != -1
      )
    })

    return (
      <Modal
        title={
          <Row type="flex" justify="center" align="middle">
            <Col style={{ textAlign: 'center' }} span={24}>
              Select Database
            </Col>
          </Row>
        }
        visible={this.props.visible}
        onCancel={this.props.onCancel}
        footer={[null, null]}
      >
        <Row type="flex" align="middle">
          <Col span={14}>
            <Input
              placeholder="search database"
              value={this.state.searchText}
              onChange={this.handleSearchText}
            />
          </Col>
        </Row>
        <Row>
          <Table
            style={{
              cursor: 'pointer'
            }}
            columns={[
              {
                title: 'Database',
                dataIndex: 'name',
                key: 'uuid'
              }
            ]}
            title={this.renderCreateNewButton}
            showHeader={false}
            pagination={false}
            dataSource={dataSource2}
            scroll={{ y: 400 }}
            onRow={(record: any) => ({
              onClick: () => {
                this.handleItemClick(record)
              }
            })}
          />
        </Row>
      </Modal>
    )
  }
}

export default SelectDatabaseModal
