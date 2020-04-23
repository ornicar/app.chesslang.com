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
  message
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
import { SetupChessboard } from '../../../components/chessboard/setup-chessboard'
import * as queryString from 'query-string'
import { RouteComponentProps } from 'react-router'
import KeyHandler, { KEYDOWN, KEYPRESS } from 'react-key-handler'
import { Scoresheet } from '../../../components/scoresheet/scoresheet'

const { TabPane } = Tabs

interface Props extends RouteComponentProps<any> {
  analysisBoardStore: AnalysisBoardStore
  gameboxDatabaseStore: GameboxDatabaseStore
}

interface State {
  gameNotFound: boolean
}

@inject('analysisBoardStore', 'gameboxDatabaseStore')
@observer
export class PublicAnalysisBoard extends React.Component<Props, State> {
  gameFormRef: any
  state = {
    gameNotFound: false
  }

  async componentDidMount() {
    let isGameFound = false
    const params: any = queryString.parse(this.props.location.search)
    if (params.gameUuid != null) {
      isGameFound = await this.props.analysisBoardStore.loadPublicGame(
        params.gameUuid
      )
    }

    if (isGameFound == false) {
      this.setState({
        gameNotFound: true
      })
    }

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
      to: dest
    })
    // this.setState({
    //   moves: this.state.moves + ' ' + to
    // })
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

  handleDuplicate = async () => {
    const success = await this.props.analysisBoardStore!.duplicateGame()
    if (success) {
      message.success('Duplicated Game')
    } else {
      message.error('Failed to duplicate game')
    }
  }

  handleResetGame = async () => {
    await this.props.analysisBoardStore!.resetGame()
  }

  renderContent() {
    return (
      <Row className="analysis-board scoresheet-container">
        <Col md={{ span: 12, offset: 2 }} sm={24}>
          <ChessgroundBoard
            height={600}
            width={600}
            orientation="white"
            fen={this.props.analysisBoardStore!.fen}
            turnColor={this.props.analysisBoardStore!.sideToPlay}
            onMove={this.onMove}
            movable={this.props.analysisBoardStore!.calcMovable()}
          />
        </Col>
        <Col
          className="analysis-board--tabs"
          md={{ span: 8, offset: 2 }}
          sm={24}
        >
          <Row type="flex" justify="start" style={{ margin: '8px' }}>
            <h1>{this.props.analysisBoardStore.gameName}</h1>
          </Row>
          <Row className="buttons-container" type="flex" justify="start">
            {this.props.analysisBoardStore!.savedGameDetails && (
              <Col className="operation-button">
                <Button onClick={this.handleResetGame} size="small">
                  Reset
                </Button>
              </Col>
            )}
          </Row>
          <Row>
            <Tabs type="card" defaultActiveKey="moves">
              <TabPane tab="Moves" key="moves">
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
            </Tabs>
          </Row>
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
      </>
    )
  }

  renderErrorContent = () => {
    return (
      <div className={'errorOverlay'}>
        <h1>The game you are looking for does not exist</h1>
        <Button size="large" type="primary" href="https://chesslang.com">
          Chesslang.com
        </Button>
      </div>
    )
  }

  render() {
    return (
      <Layout className="student app page">
        {this.renderKeyBindings()}
        <Layout.Content className="content">
          {this.state.gameNotFound
            ? this.renderErrorContent()
            : this.renderContent()}
        </Layout.Content>
      </Layout>
    )
  }
}
