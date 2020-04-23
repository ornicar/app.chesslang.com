import * as React from 'react'
import * as R from 'ramda'
import { Button, Drawer, Icon, Checkbox, Input } from 'antd'
import { inject, observer } from 'mobx-react'

import './problembase-drawer.less'

import { PrivateProblembaseStore } from '../../../../../stores/private-problembase'
import { PublicProblembaseStore } from '../../../../../stores/public-problembase'
import ProblembaseViewerDrawer from '../problembase-viewer-drawer/problembase-viewer-drawer'
import { ProblembaseContentStore } from '../../../../../stores/problembase-content'

interface Props {
  privateProblembaseStore?: PrivateProblembaseStore
  publicProblembaseStore?: PublicProblembaseStore
  problembaseContentStore?: ProblembaseContentStore
  visible: boolean
  selectedProblemUuids: string[]
  onClose: () => any
  onSelectedProblemsChange: (uuids: string[]) => any
}

interface State {
  selectedProblembaseUuid: string
  search: string
  listPrivate: boolean
  listPublic: boolean
}

@inject(
  'privateProblembaseStore',
  'publicProblembaseStore',
  'problembaseContentStore'
)
@observer
export default class ProblembaseDrawer extends React.Component<Props, State> {
  state = {
    selectedProblembaseUuid: '',
    search: '',
    listPrivate: true,
    listPublic: true
  }

  componentDidUpdate() {
    if (this.state.selectedProblembaseUuid != '') {
      this.props.problembaseContentStore!.load(
        this.state.selectedProblembaseUuid
      )
    }
  }

  handleProblembaseClick = (uuid: string) => () => {
    this.setState({
      selectedProblembaseUuid: uuid
    })
  }

  handleProblembaseViewerDrawerClose = () => {
    this.setState({
      selectedProblembaseUuid: ''
    })
  }

  handleProblemSelect = (uuid: string) => {
    this.props.onSelectedProblemsChange([
      ...this.props.selectedProblemUuids,
      uuid
    ])
  }

  handleProblemSelect10 = () => {
    var allProblemUuids = this.props.problembaseContentStore!.content[
      this.state.selectedProblembaseUuid
    ].problems.map(p => p.uuid)

    var select = []
    let count = 0

    let lastSelectedIndex: number = 0
    allProblemUuids.forEach((uuid, index) => {
      if (this.props.selectedProblemUuids.includes(uuid)) {
        lastSelectedIndex = index
      }
    })

    allProblemUuids.splice(0, lastSelectedIndex + 1)

    for (let uuid of allProblemUuids) {
      if (count < 10 && this.props.selectedProblemUuids.indexOf(uuid) < 0) {
        count += 1
        select.push(uuid)
      }
    }

    this.props.onSelectedProblemsChange([
      ...this.props.selectedProblemUuids,
      ...select
    ])
  }

  handleProblemSelectAll = async () => {
    var allProblems = await this.props.problembaseContentStore!.loadAllUuids(
      this.state.selectedProblembaseUuid
    )
    var allProblemUuids = allProblems.map((p: { uuid: any }) => p.uuid)
    this.props.onSelectedProblemsChange([
      ...new Set([...allProblemUuids, ...this.props.selectedProblemUuids])
    ])
  }

  handleProblemDeselectAll = async () => {
    var allProblems = await this.props.problembaseContentStore!.loadAllUuids(
      this.state.selectedProblembaseUuid
    )
    var allProblemUuids = new Set(allProblems.map((p: { uuid: any }) => p.uuid))

    this.props.onSelectedProblemsChange(
      this.props.selectedProblemUuids.filter(uuid => !allProblemUuids.has(uuid))
    )
  }

  handleProblemUnselect = (uuid: string) => {
    this.props.onSelectedProblemsChange(
      this.props.selectedProblemUuids.filter(pUuid => pUuid !== uuid)
    )
  }

  handleCheckboxToggle = (stateKey: string) => () => {
    this.setState(
      R.assoc(stateKey, !(this.state as any)[stateKey], {} as State)
    )
  }

  handleSearchChange = (event: any) => {
    this.setState({
      search: event.target.value
    })
  }

  getFilteredProblembases = (search: string, problembases: any[]) => {
    const publicBases = this.state.listPublic
      ? this.props.publicProblembaseStore!.problembases! || []
      : []
    const privateBases = this.state.listPrivate
      ? this.props.privateProblembaseStore!.problembases! || []
      : []
    return [...publicBases, ...privateBases].filter(
      p => p.name.toLowerCase().indexOf(this.state.search.toLowerCase()) >= 0
    )
  }

  sortProblembases = (problembases: any[]) => {
    return R.sortBy(p => p.name.toLowerCase(), problembases)
  }

  componentDidMount() {
    this.props.privateProblembaseStore!.load()
    this.props.publicProblembaseStore!.load()
  }

  render() {
    const drawerProps = {
      className: 'problembase-drawer',
      width: 450,
      placement: 'right',
      onClose: this.props.onClose,
      maskClosable: false,
      closable: false,
      visible: this.props.visible
    } as any

    if (
      this.props.privateProblembaseStore!.loading ||
      this.props.publicProblembaseStore!.loading
    ) {
      return (
        <Drawer {...drawerProps}>
          <div className="drawer-inner">
            <div className="title">
              <h3>Choose problembase to add problems from</h3>
            </div>
            <div className="content">
              <div className="loading-state container">
                <Icon type="loading" spin={true} />
                <p className="exception-text">Loading</p>
              </div>
            </div>
            <div className="button-bar">
              <Button className="cancel-button" onClick={this.props.onClose}>
                Cancel
              </Button>
              <Button type="primary" onClick={this.props.onClose}>
                Done
              </Button>
            </div>
          </div>
        </Drawer>
      )
    }

    const problembases = this.sortProblembases(
      this.getFilteredProblembases(
        this.state.search,
        this.props.privateProblembaseStore!.problembases! || []
      )
    )

    return (
      <Drawer {...drawerProps}>
        <ProblembaseViewerDrawer
          onClose={this.handleProblembaseViewerDrawerClose}
          problembaseUuid={this.state.selectedProblembaseUuid}
          onProblemSelect={this.handleProblemSelect}
          onProblemSelect10={this.handleProblemSelect10}
          onProblemSelectAll={this.handleProblemSelectAll}
          onProblemDeselectAll={this.handleProblemDeselectAll}
          onProblemUnselect={this.handleProblemUnselect}
          selectedProblemUuids={this.props.selectedProblemUuids}
        />
        <div className="drawer-inner">
          <div className="title">
            <h3>Choose problembase to add problems from</h3>
          </div>
          <div className="status-bar">
            Selected {this.props.selectedProblemUuids.length}
            <div>
              <Checkbox
                className="list-private-checkbox"
                onChange={this.handleCheckboxToggle('listPrivate')}
                checked={this.state.listPrivate}
              >
                My
              </Checkbox>
              <Checkbox
                className="list-public-checkbox"
                onChange={this.handleCheckboxToggle('listPublic')}
                checked={this.state.listPublic}
              >
                Public
              </Checkbox>
              <Input
                className="search-input"
                placeholder="Search"
                size="small"
                value={this.state.search}
                onChange={this.handleSearchChange}
              />
            </div>
          </div>
          <div className="content">
            <div className="problembase-cards container">
              {problembases.map((g: any) => {
                return (
                  <div
                    key={g.uuid}
                    className="card"
                    onClick={this.handleProblembaseClick(g.uuid)}
                  >
                    <span className="name">{g.name}</span>
                    <span className="count">{g.count}</span>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="button-bar">
            <Button className="cancel-button" onClick={this.props.onClose}>
              Cancel
            </Button>
            <Button type="primary" onClick={this.props.onClose}>
              Done
            </Button>
          </div>
        </div>
      </Drawer>
    )
  }
}
