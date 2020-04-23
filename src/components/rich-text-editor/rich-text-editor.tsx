import * as React from 'react'
import { Icon } from 'antd'
import { Editor, EditorState, RichUtils, DraftEditorCommand } from 'draft-js'
import * as draftConvert from 'draft-convert'

import './rich-text-editor.less'

interface Props {
  className?: string
  style?: any
  placeholder?: string
  minHeight?: number
  value?: string
  onChange?: (value: string) => any
}

interface State {
  hasFocus: boolean
  editorState: EditorState
}

export class RichTextEditor extends React.Component<Props, State> {
  state = {
    hasFocus: false,
    editorState: EditorState.createWithContent(
      draftConvert.convertFromHTML(this.props.value)
    )
  }

  handleChange = (newEditorState: EditorState) => {
    this.setState({ editorState: newEditorState }, () => {
      if (this.props.onChange) {
        const htmlContent = draftConvert.convertToHTML(
          this.state.editorState.getCurrentContent()
        )
        this.props.onChange(htmlContent)
      }
    })
  }

  handleKeyCommand = (
    command: DraftEditorCommand,
    editorState: EditorState
  ) => {
    const newState = RichUtils.handleKeyCommand(editorState, command)
    if (newState) {
      this.handleChange(newState)
      return 'handled'
    }

    return 'not-handled'
  }

  handleFocus = () => {
    this.setState({ hasFocus: true })
  }

  handleBlur = () => {
    this.setState({ hasFocus: false })
  }

  logEditorState = () => {
    console.log('--> ', this.state.editorState)
  }

  toggleInlineStyle = (style: string) => (e: any) => {
    e.preventDefault()
    const newState = RichUtils.toggleInlineStyle(this.state.editorState, style)
    this.handleChange(newState)
  }

  toggleBlockType = (type: string) => (e: any) => {
    e.preventDefault()
    const newState = RichUtils.toggleBlockType(this.state.editorState, type)
    this.handleChange(newState)
  }

  render() {
    const iconStyle = { fontSize: 20, width: 20 }

    const selection = this.state.editorState.getSelection()
    const currentBlockType = this.state.editorState
      .getCurrentContent()
      .getBlockForKey(selection.getStartKey())
      .getType()
    const currentInlineStyle = this.state.editorState.getCurrentInlineStyle()

    return (
      <div
        className={`rich-text-editor ${this.props.className || ''} ${this.state
          .hasFocus && 'focused'}`}
        style={this.props.style}
      >
        <style>{`.public-DraftEditor-content { min-height: ${
          this.props.minHeight ? this.props.minHeight + 'px' : 'auto'
        }; }`}</style>
        <div className="control-bar">
          <span
            className={`icon-container ${
              currentInlineStyle.has('BOLD') ? 'active' : ''
            }`}
            onMouseDown={this.toggleInlineStyle('BOLD')}
          >
            <Icon type="bold" theme="outlined" style={iconStyle} />
          </span>
          <span
            className={`icon-container ${
              currentInlineStyle.has('ITALIC') ? 'active' : ''
            }`}
            onMouseDown={this.toggleInlineStyle('ITALIC')}
          >
            <Icon type="italic" theme="outlined" style={iconStyle} />
          </span>
          <span
            className={`icon-container ${
              currentInlineStyle.has('UNDERLINE') ? 'active' : ''
            }`}
            onMouseDown={this.toggleInlineStyle('UNDERLINE')}
          >
            <Icon type="underline" theme="outlined" style={iconStyle} />
          </span>
          <span
            className={`icon-container ${
              currentBlockType === 'unordered-list-item' ? 'active' : ''
            }`}
            onMouseDown={this.toggleBlockType('unordered-list-item')}
          >
            <Icon type="bars" theme="outlined" style={iconStyle} />
          </span>
          <span
            className={`icon-container ${
              currentBlockType === 'ordered-list-item' ? 'active' : ''
            }`}
            onMouseDown={this.toggleBlockType('ordered-list-item')}
          >
            <Icon type="ordered-list" theme="outlined" style={iconStyle} />
          </span>
        </div>
        <div className="editor-container">
          <Editor
            editorState={this.state.editorState}
            onChange={this.handleChange}
            handleKeyCommand={this.handleKeyCommand}
            onFocus={this.handleFocus}
            onBlur={this.handleBlur}
          />
        </div>
      </div>
    )
  }
}
