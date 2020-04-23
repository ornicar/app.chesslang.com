import React, { Component } from 'react'
import {
  FormattedMessage as FM,
  FormattedHTMLMessage as FHM,
  IntlProvider as IP
} from 'react-intl'
import locizeEditor from 'locize-editor'
import '@formatjs/intl-pluralrules/polyfill'
import '@formatjs/intl-relativetimeformat/polyfill'
import '@formatjs/intl-pluralrules'
import '@formatjs/intl-relativetimeformat'
import { LocaleStore } from '../stores/locale'
import { inject, observer } from 'mobx-react'

const IS_DEV = !process.env.NODE_ENV || process.env.NODE_ENV === 'development'
const DEFAULTNAMESPACE = 'common' // the translation file to use
const PROJECTID = process.env.LOCIZE_PROJECT_ID // your project id
const REFERENCELANGUAGE = process.env.LOCIZE_REFERENCE_LANGUAGE
const SAVE_NEW_VALUES = true // should send newly added react-intl Formatted(HRML)Message to locize
const UPDATE_VALUES = true // should update on locize if value changes in code
const PRIVATE = false // private publish

const translations = {}
let currentLocale

const LocizeContext = React.createContext({
  locale: null,
  namespace: null
})

interface Props {
  localeStore?: LocaleStore
}

@inject('localeStore')
@observer
export class IntlProvider extends Component<Props> {
  constructor(props: Props) {
    super(props)
    this.state = {
      locale: null,
      messages: {}
    }
  }

  componentDidMount() {
    const namespace = this.props.namespace || DEFAULTNAMESPACE

    // return if already loaded
    if (currentLocale && translations[currentLocale]) return

    // load the given file form locize and detect language while doing so
    this.props.localeStore!.locizer.load(
      namespace,
      this.props.localeStore!.locale,
      (err, messages, locale) => {
        currentLocale = locale
        translations[locale] = messages

        // update state to render children
        this.setState({
          locale,
          messages
        })

        // init editor if development
        if (IS_DEV) {
          // init incontext editor
          locizeEditor.init({
            lng: locale,
            defaultNS: DEFAULTNAMESPACE,
            referenceLng: REFERENCELANGUAGE,
            projectId: PROJECTID,
            private: PRIVATE
          })
        }
      }
    )
  }

  render() {
    const { children, namespace } = this.props
    const { locale, messages } = this.state

    if (!locale) return null // we wait for render until loaded

    // render the react-intl IntlProvider with loaded messages
    return (
      <LocizeContext.Provider
        value={{ locale, namespace: namespace || DEFAULTNAMESPACE }}
      >
        <IP locale={locale} messages={messages}>
          {children}
        </IP>
      </LocizeContext.Provider>
    )
  }
}

// hoc for context
function withContext() {
  return function Wrapper(WrappedComponent) {
    interface Props {
      id: string
      defaultMessage: string
      description?: string
      namespace?: string
    }

    class WithContext extends Component<Props> {
      constructor(props: Readonly<Props>) {
        super(props)
      }

      render() {
        return (
          <LocizeContext.Consumer>
            {ctx => (
              <WrappedComponent
                {...this.props}
                locale={ctx.locale}
                namespace={ctx.namespace}
              />
            )}
          </LocizeContext.Consumer>
        )
      }
    }

    return WithContext
  }
}

// a hoc to extend components with locize features
function supportLocize() {
  return function Wrapper(WrappedComponent) {
    interface Props {
      localeStore?: LocaleStore
      id: string
      defaultMessage: string
      description?: string
      namespace?: string
    }

    @inject('localeStore')
    class LocizeExtension extends Component<Props> {
      constructor(props: Props) {
        super(props)

        const { id, defaultMessage, description, namespace } = props

        // get current value in message catalog
        const currentValue =
          translations[currentLocale] && translations[currentLocale][id]

        // depeding on not yet exists or changed
        // save or update the value on locize
        if (SAVE_NEW_VALUES && !currentValue) {
          this.props.localeStore!.locizer.add(
            namespace,
            id,
            defaultMessage,
            description
          )
        } else if (UPDATE_VALUES && currentValue !== defaultMessage) {
          this.props.localeStore!.locizer.update(
            namespace,
            id,
            defaultMessage,
            description
          )
        }

        // send last used information
        this.props.localeStore!.locizer.used(namespace, id)
      }

      render() {
        return <WrappedComponent {...this.props} />
      }
    }

    return withContext()(LocizeExtension)
  }
}

// if is development environment we export extended react-intl components
export const FormattedMessage = IS_DEV ? supportLocize()(FM) : FM
export const FormattedHTMLMessage = IS_DEV ? supportLocize()(FHM) : FHM
