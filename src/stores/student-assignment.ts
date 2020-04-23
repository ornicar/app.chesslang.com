import * as jsEnv from 'browser-or-node'
import { observable, action, computed } from 'mobx'
import { userStore } from './user'

export class StudentAssignmentStore {
  @observable assignments: any[] = []
  @observable loading = true
  @observable error = ''

  @observable completionDetails = {}

  constructor(initValues: any = {}) {
    this.assignments = initValues.assignments || []
    this.loading = initValues.loading || true
    this.error = initValues.error || ''
  }

  @action.bound
  async load() {
    this.loading = true
    this.error = ''

    try {
      const response = await userStore
        .getApiCoreAxiosClient()!
        .get(`/assignment/student/${userStore.uuid}`)
      this.assignments = response.data.records
      this.loading = false
    } catch (e) {
      this.loading = false
      if (e.response && e.response.status === 404) {
        this.error = ''
        this.assignments = []
      } else {
        this.error = 'Error loading assignments'
      }
    }
  }

  @action.bound
  async loadCompletionDetails(assignmentUuid: string) {
    this.completionDetails[assignmentUuid] = {
      ...this.completionDetails[assignmentUuid],
      loading: true,
      error: ''
    }

    try {
      const completionDetails = await userStore
        .getApiCoreAxiosClient()!
        .get(
          `/exercise/assignment/student/completion-details/${assignmentUuid}`
        )
      this.completionDetails[assignmentUuid] = {
        ...this.completionDetails[assignmentUuid],
        details: completionDetails.data
      }
    } catch (e) {
      this.completionDetails[assignmentUuid] = {
        ...this.completionDetails[assignmentUuid],
        error: 'Error loading solved status'
      }
    } finally {
      this.completionDetails[assignmentUuid] = {
        ...this.completionDetails[assignmentUuid],
        loading: false
      }
    }
  }

  @action.bound
  setSolved(assignmentUuid: string, problemId: string) {
    this.completionDetails[assignmentUuid] = {
      ...this.completionDetails[assignmentUuid],
      details: [
        ...this.completionDetails[assignmentUuid].details,
        { problemId, solved: true }
      ]
    }
  }

  @computed
  get unsolvedCount() {
    var unsolved = 0
    this.assignments.forEach(e => {
      var details = this.completionDetails[e.uuid]

      if (details === undefined) {
        this.loadCompletionDetails(e.uuid)
        details = this.completionDetails[e.uuid]
      }

      if (details && !details.loading && details.details) {
        unsolved +=
          e.problemIds.length !== details.details.length ||
          !details.details.reduce((acc, status) => acc && status.solved, true)
      }
    })

    return unsolved
  }
}

export const studentAssignmentStore = new StudentAssignmentStore(
  jsEnv.isBrowser && (window as any).__PRELOADED_STATE__
    ? (window as any).__PRELOADED_STATE__.studentAssignmentStore
    : {}
)
