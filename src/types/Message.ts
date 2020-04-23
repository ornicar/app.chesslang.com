export default interface Message {
  id: string
  body: string
  from: string
  timestamp: number
  response?: string
  fromName?: string
}
