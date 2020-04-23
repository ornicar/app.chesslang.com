export default interface Drill {
  uuid: string
  name: string
  fen: string
  goal: string
  level: string
  tags: string[]
  description: string
  isPublic: boolean
  createdBy: string
}
