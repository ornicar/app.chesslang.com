import * as React from 'react'
import { inject, observer } from 'mobx-react'
import { Icon, Checkbox } from 'antd'

import './board-prefs.less'

import { PreferencesStore } from '../../../stores/preferences'

interface Props {
  preferencesStore?: PreferencesStore
}

@inject('preferencesStore')
@observer
export class BoardPrefs extends React.Component<Props> {
  componentDidMount() {
    this.props.preferencesStore!.load()
  }

  handleTheme = (theme: string) => () => {
    this.props.preferencesStore!.save({
      ...this.props.preferencesStore!.preferences,
      'com.chesslang.boardTheme': theme
    })
  }

  handleCoordinatesToggle = () => {
    const coordinates =
      this.props.preferencesStore!.preferences[
        'com.chesslang.boardCoordinates'
      ] || 'Y'
    this.props.preferencesStore!.save({
      ...this.props.preferencesStore!.preferences,
      'com.chesslang.boardCoordinates': coordinates === 'Y' ? 'N' : 'Y'
    })
  }

  render() {
    if (
      this.props.preferencesStore!.loading &&
      !this.props.preferencesStore!.hasData
    ) {
      return (
        <div className="board-prefs section">
          <h2 className="my-2 text-base">Board Preference</h2>
          <Icon type="loading" spin={true} />
        </div>
      )
    }

    const selected =
      this.props.preferencesStore!.preferences['com.chesslang.boardTheme'] ||
      'brown'
    const coordinates =
      this.props.preferencesStore!.preferences[
        'com.chesslang.boardCoordinates'
      ] || 'Y'

    return (
      <div
        className={`board-prefs section ${
          this.props.preferencesStore!.loading ? 'loading' : ''
        }`}
      >
        <h2 className="my-2 text-base">Board Preference</h2>
        {PreferencesStore.BOARD_THEME_CHOICES.map(([light, dark, name]) => (
          <div
            className={`choice ${name === selected ? 'selected' : ''}`}
            key={name}
            onClick={this.handleTheme(name)}
          >
            <span className="light" style={{ backgroundColor: light }} />
            <span className="dark" style={{ backgroundColor: dark }} />
          </div>
        ))}
        <div style={{ marginTop: 12 }}>
          <Checkbox
            checked={coordinates === 'Y'}
            onChange={this.handleCoordinatesToggle}
          >
            Coordinates
          </Checkbox>
        </div>
        <div className="loading-overlay" />
      </div>
    )
  }
}
