import { observable, action } from 'mobx'
import { Firebase } from '../firebaseInit'

import firebase from 'firebase/app'
import { userStore } from './user'
import Message from '../types/Message'

export class TournamentChatStore {
  @observable messages: Message[] = []
  @observable uuid: string = ''

  ref: firebase.database.Reference | null = null
  firstMessagesLoad: boolean = true
  onNewMessageCallbacks: Function[] = []

  @action.bound
  async load(uuid: string) {
    if (this.uuid !== uuid) {
      if (this.uuid) {
        this.ref!.off()
        this.messages = []
      }

      this.uuid = uuid
      this.ref = Firebase.database()
        .ref('tournament-chat')
        .child(uuid)

      this.ref.orderByKey().on('child_added', snap => {
        const data = snap.val()
        this.messages.push(data)
        if (!this.firstMessagesLoad) {
          this.notifyNewMessage(data)
        }
        this.firstMessagesLoad = false
      })
    }
  }

  notifyNewMessage = (message: Message) => {
    if (this.messages.length != 0) {
      const isMessageFromSelf = this.isMessageFromSelf(message.from)
      this.onNewMessageCallbacks.forEach(callback =>
        callback(message, isMessageFromSelf)
      )
    }
  }

  onNewMessage(callback: Function) {
    this.onNewMessageCallbacks.push(callback)
  }

  async send(text: string) {
    const userUuid = userStore.uuid
    this.ref!.push({
      body: text,
      from: userUuid,
      timestamp: firebase.database.ServerValue.TIMESTAMP,
      fromName: userStore.fullName
    })
  }

  isMessageFromSelf = (uuid: string) => {
    return uuid === userStore.uuid
  }
}

export const tournamentChatStore = new TournamentChatStore()
