import React from 'react'
import {
  Layout,
  Row,
  Col,
  Tabs,
  Button,
  Modal,
  Table,
  List,
  message,
  Switch,
  Input,
  Icon,
  Tooltip
} from 'antd'
import ChessgroundBoard from '../../../components/chessgroundboard/chessgroundboard'

import './analysis-board.less'
import { observer, inject } from 'mobx-react'
import { AnalysisBoardStore } from '../../../stores/analysis-board-store'
import SaveGameModa from './save-game-modal'
import SaveGameModal from './save-game-modal'
import SaveGameForm from './save-game-modal'
import { ChessTypes } from '@chesslang/chess'
import SelectDatabaseModal from './select-database-modal'
import { GameboxDatabaseStore } from '../../../stores/gamebox-database'
import { UserStore } from '../../../stores/user'
import { SetupChessboard } from '../../../components/chessboard/setup-chessboard'
import * as queryString from 'query-string'
import { RouteComponentProps } from 'react-router'
import KeyHandler, { KEYDOWN, KEYPRESS } from 'react-key-handler'
import copy from 'copy-to-clipboard'
import { Scoresheet } from '../../../components/scoresheet/scoresheet'

const { TabPane } = Tabs

interface Props extends RouteComponentProps<any> {
  analysisBoardStore: AnalysisBoardStore
  gameboxDatabaseStore: GameboxDatabaseStore
  userStore: UserStore
}

interface State {
  // moves: String
  modalState: string
  selectedDatabase: { uuid: string; name: string }
  setupPositionModalVisible: boolean
  setupPositionFen: ChessTypes.FEN
  orientation: string
}

@inject('analysisBoardStore', 'gameboxDatabaseStore', 'userStore')
@observer
export class AnalysisBoard extends React.Component<Props, State> {
  gameFormRef: any
  state = {
    modalState: 'HIDDEN',
    selectedDatabase: { uuid: '', name: '' },
    setupPositionModalVisible: false,
    setupPositionFen: '',
    orientation: 'white'
    // moves: []
  }

  componentDidMount() {
    const params: any = queryString.parse(this.props.location.search)
    if (params.gameUuid != null) {
      this.props.analysisBoardStore.loadGame(params.gameUuid)
    }

    this.props.gameboxDatabaseStore.load()

    document
      .querySelector('meta[name="viewport"]')!
      .setAttribute('content', 'width=device-width, initial-scale=1.0')
  }

  componentWillUnmount() {
    document.querySelector('meta[name="viewport"]')!.setAttribute('content', '')
  }

  onMove = (orig, dest, metadata) => {
    console.log('Move made', orig, dest, metadata)
    this.props.analysisBoardStore!.move({
      from: orig,
      to: dest,
      promotion: metadata && metadata.promotion
    })
  }

  onGoToPath = () => {}

  handleSaveToSharebox = () => {
    this.setState({
      modalState: 'SELECT_DATABASE'
    })
  }

  handleUndo = () => {
    this.props.analysisBoardStore!.undo()
  }

  handleSetupPosition = () => {
    this.setState({
      setupPositionModalVisible: true,
      setupPositionFen: this.props.analysisBoardStore!.fen
    })
  }

  handleSetupPositionCancel = () => {
    this.setState({
      setupPositionModalVisible: false,
      setupPositionFen: ''
    })
  }

  handleSetupPositionOk = () => {
    this.props.analysisBoardStore!.loadFen(this.state.setupPositionFen)
    this.setState({
      setupPositionModalVisible: false,
      setupPositionFen: ''
    })
  }

  handleSetupPositionFenChange = (fen: ChessTypes.FEN) => {
    this.setState({
      setupPositionFen: fen
    })
  }

  handlePromoteVariation = (path: ChessTypes.PlyPath) => {
    this.props.analysisBoardStore!.promoteVariation(path)
  }

  handleDeleteVariation = (path: ChessTypes.PlyPath) => {
    this.props.analysisBoardStore!.deleteVariation(path)
  }

  handleAddComment = (path: ChessTypes.PlyPath, text: string) => {
    this.props.analysisBoardStore!.handleAddComment(path, text)
  }

  handleDeleteComment = (path: ChessTypes.PlyPath) => {
    this.props.analysisBoardStore!.handleDeleteComment(path)
  }

  handleNewGame = async () => {
    this.props.history.push(window.location.pathname) // remove gameUuid params
    await this.props.analysisBoardStore!.newGame()
  }

  handleUpdateGame = async () => {
    const success = await this.props.analysisBoardStore!.updateGame()
    if (success) {
      message.success('Updated Game')
    } else {
      message.error('Failed to update game')
    }
  }
  handleResetGame = async () => {
    await this.props.analysisBoardStore!.resetGame()
  }

  handleDuplicate = async () => {
    const success = await this.props.analysisBoardStore!.duplicateGame()
    if (success) {
      message.success('Duplicated Game')
    } else {
      message.error('Failed to duplicate game')
    }
  }

  handleIsPublicToggle = (checked: boolean) => {
    this.props.analysisBoardStore.setIsPublic(checked)
  }

  handleFlip = () => {
    this.setState({
      orientation: this.state.orientation === 'white' ? 'black' : 'white'
    })
  }

  getShareUrl = () => {
    return window.location.href.replace('app/board', 'public-board')
  }

  copyPublicUrlToClipboard = () => {
    copy(this.getShareUrl())
    message.success('URL Copied')
  }

  renderPublicUrlToggle = () => {
    return (
      <Row type="flex" justify="start" align="middle" style={{ margin: '8px' }}>
        <Col>
          <Switch
            checkedChildren={<span>public</span>}
            unCheckedChildren={<span>private</span>}
            checked={this.props.analysisBoardStore.isPublic}
            onChange={this.handleIsPublicToggle}
            disabled={this.props.userStore.role == 'student'}
          />
        </Col>
        {this.props.analysisBoardStore.isPublic && (
          <Col span={16} style={{ marginLeft: '4px' }}>
            <Input
              size="small"
              value={this.getShareUrl()}
              suffix={
                <Icon
                  type="copy"
                  theme="filled"
                  style={{ color: '#645eeb' }}
                  onClick={this.copyPublicUrlToClipboard}
                />
              }
            />
          </Col>
        )}
      </Row>
    )
  }

  renderContent() {
    console.log('board state', this.props.analysisBoardStore!.state)

    return (
      <Row className="analysis-board scoresheet-container">
        <Col md={{ span: 12, offset: 2 }} sm={24}>
          <ChessgroundBoard
            height={600}
            width={600}
            orientation={this.state.orientation}
            fen={this.props.analysisBoardStore!.fen}
            turnColor={this.props.analysisBoardStore!.sideToPlay}
            onMove={this.onMove}
            movable={this.props.analysisBoardStore!.calcMovable()}
          />
          <Row
            type="flex"
            justify="center"
            style={{ marginTop: '1rem', marginBottom: '1rem' }}
          >
            <Col span={2} offset={1}>
              <Tooltip title="fast-backward (< key)">
                <Button
                  icon="fast-backward"
                  type="ghost"
                  shape="circle"
                  onClick={this.props.analysisBoardStore!.backward}
                />
              </Tooltip>
            </Col>
            <Col span={2}>
              <Tooltip title="backward (left arrow)">
                <Button
                  icon="backward"
                  type="ghost"
                  shape="circle"
                  onClick={this.props.analysisBoardStore!.prev}
                />
              </Tooltip>
            </Col>
            <Col span={2}>
              <Tooltip title="flip board (f key)">
                <Button
                  icon="swap"
                  style={{ transform: 'rotate(90deg)' }}
                  type="ghost"
                  shape="circle"
                  onClick={this.handleFlip} //{this.props.analysisBoardStore!.prev} //change this
                />
              </Tooltip>
            </Col>
            <Col span={2}>
              <Tooltip title="forward (right arrow)">
                <Button
                  icon="forward"
                  type="ghost"
                  shape="circle"
                  onClick={this.props.analysisBoardStore!.next}
                />
              </Tooltip>
            </Col>
            <Col span={2}>
              <Tooltip title="fast-forward (> key)">
                <Button
                  icon="fast-forward"
                  type="ghost"
                  shape="circle"
                  onClick={this.props.analysisBoardStore!.forward}
                />
              </Tooltip>
            </Col>
          </Row>
        </Col>
        <Col
          className="analysis-board--tabs"
          md={{ span: 8, offset: 2 }}
          sm={24}
        >
          <h1 style={{ margin: '8px' }}>
            {this.props.analysisBoardStore.gameName}
          </h1>

          {this.props.analysisBoardStore!.isGameSaved &&
            this.renderPublicUrlToggle()}

          <Row className="buttons-container" type="flex" justify="start">
            {this.props.analysisBoardStore!.isGameSaved && (
              <>
                <Col className="operation-button">
                  <Button
                    onClick={this.handleUpdateGame}
                    size="small"
                    type="primary"
                  >
                    Update
                  </Button>
                </Col>
                <Col className="operation-button">
                  <Button onClick={this.handleResetGame} size="small">
                    Reset
                  </Button>
                </Col>
                <Col className="operation-button">
                  <Button onClick={this.handleDuplicate} size="small">
                    Duplicate
                  </Button>
                </Col>
              </>
            )}
            {this.props.analysisBoardStore!.savedGameDetails == null && (
              <Col className="operation-button">
                <Button
                  onClick={this.handleSaveToSharebox}
                  size="small"
                  type="primary"
                >
                  Save
                </Button>
              </Col>
            )}
            <Col className="operation-button">
              <Button onClick={this.handleNewGame} size="small">
                New
              </Button>
            </Col>
            <Col className="operation-button">
              <Button onClick={this.handleSetupPosition} size="small">
                Setup Position
              </Button>
            </Col>
            <Col className="operation-button">
              <Button onClick={this.handleUndo} size="small">
                Undo
              </Button>
            </Col>
          </Row>

          <Tabs type="card" defaultActiveKey="moves">
            <TabPane tab="Moves" key="moves">
              {/* <div className="analysis-board--moves">
              <p>{this.state.moves}</p>
            </div> */}
              <Scoresheet
                visible={true}
                currentPath={this.props.analysisBoardStore!.state.currentPath}
                mainline={this.props.analysisBoardStore!.state.mainline}
                showHideMovesToggle={false}
                areMovesHiddenForStudents={false}
                onGoToPath={this.handleGoToPath}
                onPromoteVariation={this.handlePromoteVariation}
                onDeleteVariation={this.handleDeleteVariation}
                onAddComment={this.handleAddComment}
                onDeleteComment={this.handleDeleteComment}
                onHideMovesChange={() => {}}
              />
            </TabPane>
            {/* <TabPane tab="Analysis" key="analysis">
              <div className="analysis-board--analyse">
                <p>Game analysis will show up here</p>
              </div>
            </TabPane> */}
          </Tabs>
        </Col>
      </Row>
    )
  }

  handleGoToPath = (path: ChessTypes.PlyPath) => {
    this.props.analysisBoardStore!.gotoPath(path)
  }

  saveFormRef = (formRef: any) => {
    this.gameFormRef = formRef
  }

  handleCreate = () => {
    const { form } = this.gameFormRef.props
    form.validateFields(async (err: any, values: any) => {
      if (err) {
        return
      }

      // console.log('Received values of form: ', values)

      var gameUuid = await this.props.analysisBoardStore.saveGame(
        values,
        this.state.selectedDatabase.uuid
      )

      this.props.history.push(
        window.location.pathname + '?gameUuid=' + gameUuid
      )

      form.resetFields()
      this.setState({ modalState: 'HIDDEN' })
    })
  }

  handleCancel = () => {
    const { form } = this.gameFormRef.props
    form.resetFields()
    this.setState({
      selectedDatabase: { uuid: '', name: '' },
      modalState: 'HIDDEN'
    })
  }

  handleBack = () => {
    const { form } = this.gameFormRef.props
    form.resetFields()
    this.setState({
      selectedDatabase: { uuid: '', name: '' },
      modalState: 'SELECT_DATABASE'
    })
  }

  handleSelectDatabase = (database: any) => {
    this.setState({
      selectedDatabase: database,
      modalState: 'INPUT_METADATA'
    })
  }

  handleCreateDatabase = async (name: string) => {
    const database = await this.props.gameboxDatabaseStore!.createDatabase(name)
    this.setState({
      selectedDatabase: database,
      modalState: 'INPUT_METADATA'
    })
  }

  renderKeyBindings = () => {
    return (
      <>
        <KeyHandler
          keyEventName={KEYDOWN}
          keyValue="ArrowLeft"
          onKeyHandle={this.props.analysisBoardStore!.prev}
        />
        <KeyHandler
          keyEventName={KEYDOWN}
          keyValue="ArrowRight"
          onKeyHandle={this.props.analysisBoardStore!.next}
        />
        <KeyHandler
          keyEventName={KEYDOWN}
          keyValue="f"
          onKeyHandle={this.handleFlip}
        />
        <KeyHandler
          keyEventName={KEYDOWN}
          keyValue=","
          onKeyHandle={this.props.analysisBoardStore!.backward}
        />
        <KeyHandler
          keyEventName={KEYDOWN}
          keyValue="."
          onKeyHandle={this.props.analysisBoardStore!.forward}
        />
      </>
    )
  }

  render() {
    return (
      <Layout className="student app page">
        {this.renderKeyBindings()}
        <Layout.Content className="content">
          {this.renderContent()}
          <SelectDatabaseModal
            visible={this.state.modalState === 'SELECT_DATABASE'}
            onCancel={this.handleCancel}
            onSelectDatabase={this.handleSelectDatabase}
            onCreateDatabase={this.handleCreateDatabase}
            databases={this.props.gameboxDatabaseStore!.databases}
          ></SelectDatabaseModal>
          <SaveGameForm
            visible={this.state.modalState === 'INPUT_METADATA'}
            recentEvents={this.props.gameboxDatabaseStore!.recentEvents}
            wrappedComponentRef={this.saveFormRef}
            onCancel={this.handleCancel}
            onBack={this.handleBack}
            onCreate={this.handleCreate}
          ></SaveGameForm>
          {this.state.setupPositionModalVisible && (
            <Modal
              title="Setup Position"
              visible={this.state.setupPositionModalVisible}
              style={{ top: 25 }}
              width={800}
              maskClosable={false}
              onCancel={this.handleSetupPositionCancel}
              onOk={this.handleSetupPositionOk}
            >
              <div className="position-setup-modal" title="Setup Position">
                <SetupChessboard
                  width={550}
                  height={550}
                  initialFen={this.state.setupPositionFen as ChessTypes.FEN}
                  onChange={this.handleSetupPositionFenChange}
                />
              </div>
            </Modal>
          )}
        </Layout.Content>
      </Layout>
    )
  }
}
