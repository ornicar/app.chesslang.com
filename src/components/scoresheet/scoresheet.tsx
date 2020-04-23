import * as React from 'react'
import * as R from 'ramda'
import { ChessTypes, Chess } from '@chesslang/chess'

import './scoresheet.less'
import { Menu, Dropdown, Switch, Row, Col, Modal, Input } from 'antd'
import { toJS } from 'mobx'
import TextArea from 'antd/lib/input/TextArea'

interface Props {
  visible: boolean
  currentPath: ChessTypes.PlyPath | null
  mainline: ChessTypes.Variation
  onGoToPath: (path: ChessTypes.PlyPath) => any
  onPromoteVariation: (path: ChessTypes.PlyPath) => any
  onAddComment: (path: ChessTypes.PlyPath, text: string) => any
  onDeleteComment: (path: ChessTypes.PlyPath) => any
  onDeleteVariation: (path: ChessTypes.PlyPath) => any
  onNagAnnotation?: (path: ChessTypes.PlyPath, code: number) => any
  areMovesHiddenForStudents: boolean
  onHideMovesChange: (checked: boolean) => any
  showHideMovesToggle: boolean
}

const MOVE_NAGS = [
  { key: 'good', symbol: '!', code: 1, text: 'good' },
  { key: 'bad', symbol: '?', code: 2, text: 'bad' },
  { key: 'excellent', symbol: '!!', code: 3, text: 'excellent' },
  { key: 'blunder', symbol: '??', code: 4, text: 'blunder' },
  { key: 'interesting', symbol: '!?', code: 5, text: 'interesting' },
  { key: 'dubious', symbol: '?!', code: 6, text: 'dubious' }
]

const EVAL_NAGS = [
  {
    key: 'w-slight-better',
    symbol: '⩲',
    text: 'white is slighly better',
    code: 14
  },
  { key: 'w-advantage', symbol: '±', text: 'advantage for white', code: 16 },
  {
    key: 'w-winning',
    symbol: '+-',
    text: 'decisive advantage for white',
    code: 18
  },
  { key: 'equal', symbol: '=', text: 'decisive advantage for white', code: 10 },
  {
    key: 'b-slight-better',
    symbol: '⩱',
    text: 'black is slighly better',
    code: 15
  },
  { key: 'b-advantage', symbol: '∓', text: 'advantage for black', code: 17 },
  {
    key: 'b-winning',
    symbol: '-+',
    text: 'decisive advantage for black',
    code: 19
  },
  { key: 'unclear', symbol: '∞', text: 'unclear', code: 13 }
]

// TODO: Move this to chess lib
const getFullMoveNumber = (fen: ChessTypes.FEN) => {
  return fen ? fen.split(' ')[5] : ' '
}

interface State {
  isAddCommentModalVisible: boolean
  comment: string
  commentPath: ChessTypes.PlyPath | null
}

export class Scoresheet extends React.Component<Props, State> {
  state = {
    isAddCommentModalVisible: false,
    comment: '',
    commentPath: null
  }

  handleHideMovesChange = (checked: boolean) => {
    this.props.onHideMovesChange(checked)
  }

  handlePromoteVariation = (path: ChessTypes.PlyPath) => () => {
    this.props.onPromoteVariation(path)
  }

  handleDeleteVariation = (path: ChessTypes.PlyPath) => () => {
    this.props.onDeleteVariation(path)
  }

  handleNagAnnotation = (path: ChessTypes.PlyPath, code: number) => () => {
    // TODO: Missing implementation
    // this.props.onNagAnnotation(path, code);
  }

  renderAnnotationMenu = (path: ChessTypes.PlyPath, text: string) => {
    return (
      <Menu>
        <Menu.Item key="edit" onClick={this.handleEditComment(path, text)}>
          Edit
        </Menu.Item>
        <Menu.Item key="delete" onClick={this.handleDeleteComment(path)}>
          Delete
        </Menu.Item>
      </Menu>
    )
  }
  renderMoveContextMenu = (path: ChessTypes.PlyPath) => {
    return (
      <Menu>
        <Menu.Item key="promote" onClick={this.handlePromoteVariation(path)}>
          Promote Variation
        </Menu.Item>
        <Menu.Item key="delete" onClick={this.handleDeleteVariation(path)}>
          Delete Variation
        </Menu.Item>
        <Menu.Item key="add-comment" onClick={this.handleAddComment(path)}>
          Add Comment
        </Menu.Item>
        {/*{MOVE_NAGS.map((mn) => <Menu.Item key={mn.key} onClick={this.handleNagAnnotation(path, mn.code)}><strong>{mn.symbol}</strong> ({mn.text})</Menu.Item> )}*/}
        {/*</Menu.SubMenu>*/}
        {/*<Menu.SubMenu key="evaluation" title="Evaluation">*/}
        {/*{EVAL_NAGS.map((mn) => <Menu.Item key={mn.key} onClick={this.handleNagAnnotation(path, mn.code)}><strong>{mn.symbol}</strong> ({mn.text})</Menu.Item> )}*/}
        {/*</Menu.SubMenu>*/}
      </Menu>
    )
  }

  renderVariation = (variation: ChessTypes.Variation, level: number): any => {
    if (!variation || variation.length === 0) return null

    return (
      <div
        key={`variation-${level}-${variation[0].path}`}
        className={`variation level-${level}`}
      >
        {level > 0 && '('}
        {variation.map((m, i) => {
          const nagAnnotations = R.filter(
            a => a.type === 'NAG',
            m.annotations || []
          ) as ChessTypes.NAGAnnotation[]
          const textAnnotations = R.filter(
            a => a.type === 'TEXT',
            m.annotations || []
          )

          return (
            <React.Fragment key={m.path.toString()}>
              <span
                key={m.path.toString()}
                className={`move ${((
                  this.props.currentPath || ''
                ).toString() === m.path.toString() &&
                  'current') ||
                  ''}`}
                onClick={() => this.props.onGoToPath(m.path)}
              >
                <Dropdown
                  overlay={this.renderMoveContextMenu(m.path)}
                  trigger={['contextMenu']}
                >
                  <span>
                    <span className="number">
                      {m.side === 'w' && getFullMoveNumber(m.fen) + '. '}
                      {i === 0 &&
                        m.side === 'b' &&
                        (getFullMoveNumber(m.fen) as any) - 1 + '... '}
                    </span>
                    {m.san}
                  </span>
                </Dropdown>
              </span>
              {nagAnnotations.length > 0 &&
                nagAnnotations.map(a => `$${a.code}`).join(' ')}
              {textAnnotations.length > 0 && (
                <Dropdown
                  overlay={this.renderAnnotationMenu(
                    m.path,
                    (textAnnotations[0] as ChessTypes.TextAnnotation).body
                  )}
                  trigger={['hover', 'contextMenu']}
                >
                  <span className="text annotation">
                    ({(textAnnotations[0] as ChessTypes.TextAnnotation).body})
                  </span>
                </Dropdown>
              )}
              {m.variations && m.variations.length > 0 && (
                <div
                  key={`${m.path}-variation`}
                  className={`variations-container level-${level}`}
                >
                  {m.variations.map(v => this.renderVariation(v, level + 1))}
                </div>
              )}
            </React.Fragment>
          )
        })}
        {level > 0 && ')'}
      </div>
    )
  }

  handleCommentChange = ({ target: { value } }: any) => {
    this.setState({
      comment: value
    })
  }

  handleAddComment = (path: ChessTypes.PlyPath) => () => {
    this.setState({
      isAddCommentModalVisible: true,
      commentPath: path
    })
  }

  handleEditComment = (path: ChessTypes.PlyPath, text: string) => () => {
    this.setState({
      isAddCommentModalVisible: true,
      commentPath: path,
      comment: text
    })
  }

  handleDeleteComment = (path: ChessTypes.PlyPath) => () => {
    this.props.onDeleteComment(path)
    this.setState({
      isAddCommentModalVisible: false,
      comment: '',
      commentPath: null
    })
  }

  handleCommentModalOk = () => {
    if (this.state.commentPath != null) {
      this.props.onAddComment(this.state.commentPath!, this.state.comment)
    }

    this.setState({
      isAddCommentModalVisible: false,
      comment: '',
      commentPath: null
    })
  }
  handleCommentModalCancel = () => {
    this.setState({
      isAddCommentModalVisible: false,
      comment: '',
      commentPath: null
    })
  }

  render() {
    return (
      <div className={`scoresheet ${this.props.visible ? 'visible' : ''}`}>
        <Row
          type="flex"
          justify="start"
          gutter={8}
          className="hide-moves-panel"
        >
          {this.props.showHideMovesToggle && (
            <>
              <Col>
                <Switch
                  checked={!this.props.areMovesHiddenForStudents}
                  onChange={this.handleHideMovesChange}
                />
              </Col>
              <Col>
                {this.props.areMovesHiddenForStudents ? (
                  <p>Moves are hidden for students (press h key to show)</p>
                ) : (
                  <p>Moves are visible to students (press h key to hide)</p>
                )}
              </Col>
            </>
          )}
        </Row>
        <div
          className={`moves ${
            this.props.areMovesHiddenForStudents ? 'moves-hidden' : ''
          }`}
        >
          {this.renderVariation(this.props.mainline, 0)}
        </div>
        <Modal
          title="Add comment"
          onOk={this.handleCommentModalOk}
          onCancel={this.handleCommentModalCancel}
          visible={this.state.isAddCommentModalVisible}
        >
          <TextArea
            value={this.state.comment}
            onChange={this.handleCommentChange}
            onPressEnter={this.handleCommentModalOk}
            autosize={{ minRows: 3 }}
          ></TextArea>
        </Modal>
      </div>
    )
  }
}
