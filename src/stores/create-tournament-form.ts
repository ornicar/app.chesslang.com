import { observable, action, computed, autorun } from 'mobx'
import { userStore } from './user'
import _ from 'lodash'
import moment from 'moment-timezone'
import { Chess } from 'chess.js'
import { DEFAULT_FEN } from '../utils/utils'

export class CreateTournamentFormStore {
  @observable currentStep: number = 0
  @observable schedule: any
  @observable players: any[] = []
  @observable bufferMinutes: number = 10

  @observable tournamentDetails: any
  @observable checkedKeys: any

  @observable initialFen: any
  @observable bookOpenings: any

  @observable dateRange: any

  @observable loading: boolean = false

  constructor() {
    this.init()
  }

  @action.bound
  init() {
    this.tournamentDetails = {
      time_control: 10,
      time_increment: 3,
      start_date: moment().format(),
      start_time: moment().format('HH:mm')
    }
    this.currentStep = 0
    this.schedule = []
    this.players = []
    this.bufferMinutes = 10
    this.checkedKeys = []
    this.initialFen = DEFAULT_FEN
    this.bookOpenings = []
  }

  @action.bound
  async load(tournamentUuid: string) {
    try {
      this.loading = true
      const response = await userStore
        .getApiCoreAxiosClient()!
        .get(`tournaments/${tournamentUuid}`)

      // const playerList = await userStore
      //   .getApiCoreAxiosClient()!
      //   .get(`tournaments/${tournamentUuid}/players`)

      const {
        name,
        description,
        start_date,
        end_date,
        start_time,
        time_control,
        time_increment,
        rounds,
        schedule,
        timezone,
        players,
        initial_fen
      }: any = response.data

      this.tournamentDetails = {
        name,
        description,
        start_date,
        end_date,
        start_time,
        time_control,
        time_increment,
        rounds,
        timezone,
        time_range: [moment(start_date), moment(end_date)],
        tournamentUuid
      }

      this.initialFen = initial_fen
      this.schedule = schedule
      this.players = players

      this.checkedKeys = this.players.map(p => `student-${p.userUuid}`)
    } catch (err) {
      console.error(err)
    } finally {
      this.loading = false
    }
  }

  @action.bound
  async create() {
    let payload = {
      ...this.tournamentDetails,
      start_date: this.tournamentDetails.time_range[0]
        .tz(this.tournamentDetails.timezone)
        .format(),
      end_date: this.tournamentDetails.time_range[1]
        .tz(this.tournamentDetails.timezone)
        .format(),
      start_time: this.tournamentDetails.start_time.format('HH:mm'),
      invited_participants: this.participants,
      schedule: this.schedule,
      initialFen: this.initialFen
    }

    let response = null
    try {
      this.loading = true
      response = await userStore
        .getApiCoreAxiosClient()!
        .post(`coach-tournaments/`, payload)
    } catch (err) {
    } finally {
      this.loading = false
    }

    this.init()

    return response
  }

  update = async () => {
    let payload = {
      ...this.tournamentDetails,
      start_date: this.tournamentDetails.time_range[0]
        .tz(this.tournamentDetails.timezone)
        .format(),
      end_date: this.tournamentDetails.time_range[1]
        .tz(this.tournamentDetails.timezone)
        .format(),
      start_time: this.tournamentDetails.start_time.format('HH:mm'),
      invited_participants: this.participants,
      schedule: this.schedule
    }

    let response = null
    try {
      this.loading = true
      response = await userStore
        .getApiCoreAxiosClient()!
        .put(
          `coach-tournaments/${this.tournamentDetails.tournamentUuid}`,
          payload
        )
    } catch (err) {
      console.error(err)
    } finally {
      this.loading = false
    }

    this.init()

    return response
  }

  @action.bound
  gotoParticipantsStep() {
    this.currentStep = 2
  }

  @action.bound
  gotoScheduleStep() {
    this.currentStep = 1
  }

  @action.bound
  gotoDetailsStep() {
    this.currentStep = 0
  }

  @action.bound
  setTournamentDetails(values: any) {
    this.tournamentDetails = {
      ...this.tournamentDetails,
      ...values
    }
  }

  setCheckedKeys(checkedKeys: any) {
    this.checkedKeys = checkedKeys
  }

  @action.bound
  generateSchedule() {
    const startDate = this.tournamentDetails.time_range[0]
      .tz(this.tournamentDetails.timezone)
      .format()
    let startTime = moment(
      `${moment(startDate).format('YYYY-MM-DD')}
       ${this.tournamentDetails.start_time.format('HH:mm')}`
    )
    this.schedule = _.range(this.tournamentDetails.rounds).map(i => {
      const round = i + 1

      const ret = {
        key: round,
        round,
        date: startTime.format('DD MMM, YYYY'),
        start_time: startTime.format('HH:mm')
      }

      startTime = startTime.add(
        this.avgRoundDuration + this.bufferMinutes,
        'minutes'
      )
      // round off to the nearest 5 minute
      const remainder = 5 - (startTime.minute() % 5)
      startTime = startTime.add(remainder, 'minutes')

      return ret
    })
  }

  @action.bound
  setBufferMinutes(val: number) {
    this.bufferMinutes = val
  }

  @computed
  get participants() {
    return this.checkedKeys
      .filter((uuid: string) => uuid.startsWith('student-'))
      .map((uuid: string) => uuid.substr('student-'.length))
  }

  @computed
  get avgRoundDuration() {
    return (
      parseInt(this.tournamentDetails.time_control) +
      (40 * parseInt(this.tournamentDetails.time_increment)) / 60 // taking an average of 40 moves
    )
  }

  @action.bound
  setInitialFen(values: any) {
    this.initialFen = values
  }

  @action.bound
  async loadBookOpenings() {
    const response = await userStore
      .getApiCoreAxiosClient()!
      .get(`coach-tournaments/book-openings`)
    this.bookOpenings = response.data
  }

  @computed
  get isEditing() {
    return this.tournamentDetails.tournamentUuid != null
  }

  @action.bound
  isValidFen(fen: string) {
    const g = new Chess()
    const returnValue = g.validate_fen(fen)
    return returnValue
  }
}

export const createTournamentFormStore = new CreateTournamentFormStore()
