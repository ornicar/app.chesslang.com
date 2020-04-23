import { observable, action } from 'mobx'
import RatingSystem from '../types/RatingSystem'
import { userStore } from './user'
import { academyStore } from './academy'

export class RatingSystemStore {
  @observable availableRatingSystems: RatingSystem[] = []
  @observable ratingSystems: RatingSystem[] = []
  @observable loading = false

  @action.bound
  async load() {
    this.loading = true
    const allRatingSystemsResponse = await userStore
      .getApiCoreAxiosClient()!
      .get(`/rating-systems`)
    this.availableRatingSystems = allRatingSystemsResponse.data.records || []

    await this.loadAcademyRatingSystems()
    this.loading = false
  }

  async loadAcademyRatingSystems() {
    this.loading = true
    const ratingSystemsResponse = await userStore
      .getApiCoreAxiosClient()!
      .get(`/academy/${academyStore.id}/rating-systems`)
    this.ratingSystems = ratingSystemsResponse.data.records || []
    this.loading = false
  }

  async add(ratingSystemId: string) {
    this.loading = true
    await userStore
      .getApiCoreAxiosClient()!
      .post(`/academy/${academyStore.id}/rating-systems/${ratingSystemId}`)
    await this.loadAcademyRatingSystems()
    this.loading = false
  }

  async remove(ratingSystemId: string) {
    this.loading = true
    await userStore
      .getApiCoreAxiosClient()!
      .delete(`/academy/${academyStore.id}/rating-systems/${ratingSystemId}`)
    await this.loadAcademyRatingSystems()
    this.loading = false
  }
}

export const ratingSystemStore = new RatingSystemStore()
