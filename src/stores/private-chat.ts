import { observable, action } from 'mobx'
import { Firebase } from '../firebaseInit'

import firebase from 'firebase/app'
import 'firebase/firestore'
import { userStore } from './user'
import _ from 'lodash'
import Message from '../types/Message'

export class PrivateChatStore {
  @observable messages: Message[] = []
  @observable coachId: string = ''
  @observable unseenUpdates = 0

  ref: firebase.firestore.DocumentReference | null = null
  unsub: any

  @action.bound
  async load(coachId: string, chatId: string) {
    if (this.unsub) {
      this.unsub()
    }

    this.coachId = coachId
    this.ref = Firebase.firestore()
      .collection('private-chat')
      .doc(chatId)

    let messagesRef = this.ref.collection('messages')

    if (userStore.role == 'student') {
      messagesRef = messagesRef.where('from', 'in', [
        userStore.uuid,
        this.coachId
      ])
    }

    this.unsub = messagesRef.onSnapshot(snapshot => {
      if (snapshot.docChanges().length != snapshot.docs.length) {
        this.setUnseenUpdates(snapshot.docChanges().length + this.unseenUpdates)
      }

      const messages = snapshot.docs.map(doc => {
        return {
          id: doc.id,
          ...doc.data()
        } as Message
      })

      this.messages = _.orderBy(messages, 'timestamp', 'asc')
    })
  }

  send = async (text: string) => {
    const message: Omit<Message, 'id'> = {
      body: text,
      from: userStore.uuid,
      timestamp: firebase.firestore.Timestamp.now().toMillis()
    }

    await this.ref!.collection('messages').add(message)
  }

  updateResponse = async (messageId: string, response: string) => {
    await this.ref!.collection('messages')
      .doc(messageId)
      .update({
        response
      })
  }

  @action.bound
  setUnseenUpdates(value: number) {
    console.log('unseenUpdates', { value })
    this.unseenUpdates = value
  }
}

export const privateChatStore = new PrivateChatStore()
