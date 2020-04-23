import { userStore } from './stores/user'
import * as Ably from 'ably'

let ablyInstance: Ably.Types.RealtimeCallbacks | null = null

export default function getAbly() {
  if (ablyInstance == null) {
    ablyInstance = new Ably.Realtime({
      key: process.env.ABLY_API_KEY,
      clientId: userStore.uuid,
      disconnectedRetryTimeout: 3000
    })
  }

  return ablyInstance
}
