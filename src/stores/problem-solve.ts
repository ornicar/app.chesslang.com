import * as jsEnv from 'browser-or-node'
import * as R from 'ramda'
import { observable, action } from 'mobx'
import { ProblemReader } from '@chesslang/chess'
import { userStore } from './user'

export class ProblemSolveStore {
  @observable assignment: any = null
  @observable loading = true
  @observable error = ''

  @observable submitting = false
  @observable submitError = ''

  constructor(initValues: any = {}) {
    this.assignment = initValues.assignments || null
    this.loading = initValues.loading || true
    this.error = initValues.error || ''
  }

  @action.bound
  async load(uuid: string) {
    this.loading = true
    this.error = ''
    try {
      const response = await userStore
        .getApiCoreAxiosClient()!
        .get(`/assignment/${uuid}`)

      this.assignment = response.data
      this.assignment.problemDetails = R.filter(
        (a: any) => a.studentId === userStore.uuid,
        this.assignment.completionDetails
      )[0].problemDetails
      this.loading = false
    } catch (e) {
      this.loading = true
      this.error = 'Error loading assignment'
    }
  }

  @action.bound
  async submit(uuid: string, attempt: any) {
    this.submitting = true
    this.submitError = ''
    try {
      await userStore
        .getApiCoreAxiosClient()!
        .post(`/assignment/${uuid}/solve`, {
          studentId: userStore.uuid,
          ...attempt
        })
      this.submitting = false
      const response = await userStore
        .getApiCoreAxiosClient()!
        .get(`/assignment/${uuid}`)
      this.assignment = response.data
      this.assignment.problemDetails = R.filter(
        (a: any) => a.studentId === userStore.uuid,
        this.assignment.completionDetails
      )[0].problemDetails
    } catch (e) {
      this.submitting = true
      this.submitError = 'Failed to submit assignment'
      return false
    }
    return true
  }

  getProblemReader(uuid: string) {
    return new ProblemReader.ProblemReader({
      baseUrl: process.env.API_CORE_URL as string,
      jwtProvider: () => userStore.getAccessToken(),
      uuid: uuid
    })
  }
}

export const problemSolveStore = new ProblemSolveStore(
  jsEnv.isBrowser && window.__PRELOADED_STATE__
    ? (window as any).__PRELOADED_STATE__.problemSolveStore
    : {}
)
