import * as React from 'react'
import * as R from 'ramda'
import { inject, observer } from 'mobx-react'

import { ChessboardProps, Chessboard } from './chessboard'
import { PreferencesStore } from '../../stores/preferences'

interface Props extends ChessboardProps {
  preferencesStore?: PreferencesStore
}

@inject('preferencesStore')
@observer
export class ConfiguredChessboard extends React.Component<Props> {
  getColors = (theme: string) => {
    const themeTuple = R.find(
      ts => ts[2] === theme,
      PreferencesStore.BOARD_THEME_CHOICES
    )
    return themeTuple || PreferencesStore.BOARD_THEME_CHOICES[0]
  }

  render() {
    const theme =
      this.props.preferencesStore!.preferences['com.chesslang.boardTheme'] ||
      'brown'
    const [lightSquareColor, darkSquareColor] = this.getColors(theme)

    const coordinates =
      this.props.width < 250 || this.props.height < 250
        ? 'N'
        : this.props.preferencesStore!.preferences[
            'com.chesslang.boardCoordinates'
          ] || 'N'

    return (
      <Chessboard
        lightSquareColor={lightSquareColor}
        darkSquareColor={darkSquareColor}
        coordinates={coordinates === 'Y'}
        {...this.props}
      />
    )
  }
}
