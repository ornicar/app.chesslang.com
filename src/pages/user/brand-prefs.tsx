import * as React from 'react'
import { inject, observer } from 'mobx-react'
import { Icon, Checkbox, Input, Form, Button } from 'antd'
import { FormComponentProps } from 'antd/lib/form'
import { PreferencesStore } from '../../stores/preferences'

interface Props extends FormComponentProps {
  preferencesStore?: PreferencesStore
}

interface State {
  formFields: {
    color: string
  }
}

@inject('preferencesStore')
@observer
class BrandPrefsComp extends React.Component<Props, State> {
  state = {
    formFields: {
      color: ''
    }
  } as State

  handleBrandColorPrimary = (color: string) => () => {
    this.props.preferencesStore!.save({
      ...this.props.preferencesStore!.preferences,
      'com.chesslang.brandColorPrimary': color
    })
  }
  getStyle = (color: string) => {
    let base = 'h-8 rounded-full w-8 mx-2 my-2 inline'
    if (this.props.preferencesStore!.primaryColorRaw == color) {
      return base + ' border-solid border-teal-200 border-4 h-10 w-10 mt-1'
    } else {
      return base
    }
  }

  isHexColor = (hex: string) => {
    if (hex[0] == '#') {
      hex = hex.slice(1)
    }
    console.log(hex)
    return hex.length === 6 && !isNaN(Number('0x' + hex))
  }

  processHex = (hex: string) => {
    if (hex[0] != '#') {
      return '#' + hex
    } else {
      return hex
    }
  }

  handleSubmit = (e: any) => {
    e.preventDefault()
    this.props.form.validateFieldsAndScroll(async (err: any, values: any) => {
      if (!err) {
        if (this.isHexColor(values.color)) {
          this.props.preferencesStore!.save({
            ...this.props.preferencesStore!.preferences,
            'com.chesslang.brandColorPrimary': this.processHex(values.color)
          })
        }
      }
    })
  }

  render() {
    const { getFieldDecorator } = this.props.form
    if (
      this.props.preferencesStore!.loading &&
      !this.props.preferencesStore!.hasData
    ) {
      return (
        <div>
          <h2>Brand Preference</h2>
          <Icon type="loading" spin={true} />
        </div>
      )
    }

    return (
      <div className="mt-4">
        <h2 className="my-2 text-base">Brand Preference</h2>
        <div className="w-full flex mt-1">
          <div className="w-1/4">
            <p className="">Current Primary (Preview)</p>
          </div>
          <div className="w-1/3">
            <p className="">Light Primary</p>
          </div>
        </div>
        <div className="w-full flex">
          <div className="w-1/4">
            <div
              className="h-12 w-full"
              style={{
                backgroundColor: this.props.preferencesStore!.primaryColorRaw
              }}
            />
          </div>
          <div className="w-1/3">
            <div
              className="h-12 w-full"
              style={{
                backgroundColor: this.props.preferencesStore!.primaryLightColor
              }}
            />
          </div>
        </div>
        <p className="mt-3 w-full">Choose a different color:</p>
        <div className="w-full flex mt-1">
          {PreferencesStore.BRAND_COLOR_CHOICES.map(color => {
            return (
              <div
                className={this.getStyle(color)}
                key={color}
                style={{ backgroundColor: color }}
                onClick={this.handleBrandColorPrimary(color)}
              />
            )
          })}
        </div>
        <p className="mt-2 w-full">Or input a color in hex code</p>
        <div className="w-full flex mt-1">
          <Form>
            <Form.Item>
              {getFieldDecorator('color', {
                rules: [{ required: false, message: 'optional.' }],
                initialValue: this.props.preferencesStore!.primaryColorRaw
              })(<Input type="text" placeholder="Color" />)}
            </Form.Item>
          </Form>
          <Button className="ml-2" type="primary" onClick={this.handleSubmit}>
            Submit
          </Button>
        </div>
      </div>
    )
  }
}

export const BrandPrefs = Form.create()(BrandPrefsComp)
