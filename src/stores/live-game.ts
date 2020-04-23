import { observable, action } from 'mobx'
import { Firebase } from '../firebaseInit'
import { userStore } from './user'
import { invitationStore } from './invitation-store'

const FIREBASE_BASE_PATH = 'live-games/'

export class LiveGameStore {
  @observable currentGameId = null
  @observable isTournamentModeOn = false

  constructor() {
    if (userStore.isLoggedIn) {
      this.init()
      console.log(userStore.uuid)
    }
  }

  init() {
    console.log('Initializing live game store...')

    //signin anonymously
    Firebase.auth()
      .signInAnonymously()
      .catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code
        var errorMessage = error.message
        // ...
      })

    Firebase.auth().onAuthStateChanged(user => {
      if (user) {
        // User is signed in.
        // this.setUser()
        this.subscribeToCurrentGame()
      } else {
        console.log('User signed out')
      }
    })
  }

  subscribeToCurrentGame() {
    Firebase.database()
      .ref(FIREBASE_BASE_PATH + userStore.uuid)
      .on('value', snap => {
        const data = snap.val()
        console.log('Got value of current game from Firebase : ', data)
        this.setCurrentGame(data)
      })
  }

  @action.bound
  setCurrentGame(data: any) {
    if (data == null) {
      this.currentGameId = null
      this.isTournamentModeOn = false
      return
    }

    console.log('Setting current tournament game', data.current_game)
    this.currentGameId = data.current_game
    this.isTournamentModeOn = data.is_tournament_mode
  }

  @action.bound
  async clearCurrentGame() {
    try {
      const response = await userStore
        .getGameServerAxiosClient()!
        .post(`live-games/clear`)

      this.currentGameId = null
      this.isTournamentModeOn = false
      console.log('Current game cleared')
    } catch (err) {
      console.error('Clear failed')
    }

    // // set the current game to null
    // // This will take the user back to invitation page
    // Firebase.database()
    //   .ref(FIREBASE_BASE_PATH + userStore.uuid)
    //   .remove()
  }
}

export const liveGameStore = new LiveGameStore()
