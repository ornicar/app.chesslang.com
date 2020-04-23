import * as jsEnv from 'browser-or-node'
import { observable, action } from 'mobx'
import { Firebase } from '../firebaseInit'

import firebase from 'firebase/app'
import 'firebase/firestore'

export class ChatStore {
  @observable messages: any = []
  @observable lastRead: any = {}
  @observable uuid: string = ''

  ref: any
  unsub: any

  constructor() {}

  @action.bound
  async load(uuid: string) {
    if (this.uuid !== uuid) {
      if (this.uuid) {
        this.unsub()
        this.messages = []
        this.lastRead = {}
      }

      this.uuid = uuid
      this.ref = Firebase.firestore().collection('chat').doc(uuid)

      this.unsub = this.ref.onSnapshot((docSnapshot: any) => {
        let data = docSnapshot.data()

        this.lastRead = data.lastRead || {}
        this.messages = data.messages.sort((a: any, b: any) =>
          a.timestamp - b.timestamp
        )
      })
    }
  }

  @action.bound
  async setLastRead(userUuid: string) {
    if ((this.lastRead[userUuid] || 0) !== this.messages.length) {
      this.ref.set({
        lastRead: { [userUuid]: this.messages.length }
      }, { merge: true })
    }
  }

  async send(userUuid: string, message: string) {
    this.ref.set({
      messages: firebase.firestore.FieldValue.arrayUnion({
        body: message,
        from: userUuid,
        timestamp: firebase.firestore.Timestamp.now().toMillis()
      })
    }, { merge: true })
  }
}

export const chatStore = new ChatStore()
