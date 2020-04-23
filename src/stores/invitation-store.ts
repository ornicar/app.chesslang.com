import * as jsEnv from 'browser-or-node'
import { observable, action } from 'mobx'
import { userStore } from './user'
import { Firebase } from '../firebaseInit'
import shortid from 'shortid'
import { academyStore } from './academy'
import { liveGameStore } from './live-game'
import { syncedGameStore } from './synced-game'
import { GameAreaStatus } from '../types'
import { number } from 'prop-types'

interface InvitationDetails {
  inviteeId: string
  color: 'black' | 'white' | 'both'
  time: number
  inviteeName: string
  increment: number
}

export class InvitationStore {
  @observable uid: any
  @observable connectionRef: any = null
  @observable onlineUsers: any = []
  @observable statistics: any
  // @observable gamesCollection: any
  // @observable invitations = []
  // @observable currentGame = null

  FIREBASE_BASE_PATH = ''
  newInvitaionCallback: () => any = () => {}
  deleteInvitaionCallback: () => any = () => {}

  onNewInvitationCallback = (inviteId: string, invitation: any) => {}
  onRemoveInvitationCallback = (inviteId: string, invitation: any) => {}

  constructor() {
    if (userStore.isLoggedIn) {
      this.init()
      // console.log(userStore.uuid)
    }
  }

  async init() {
    const academyId = (
      await userStore.getApiCoreV3AxiosClient()!.get(`academies/get-by-userId/`)
    ).data

    if (academyId == null) {
      throw new Error('Could not find the academy')
    }

    this.FIREBASE_BASE_PATH = '/game-area/users/academy_' + academyId

    //signin anonymously
    Firebase.auth()
      .signInAnonymously()
      .catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code
        var errorMessage = error.message
        // ...
      })

    Firebase.auth().onAuthStateChanged(async user => {
      if (user) {
        // User is signed in.
        this.setUser()
        await this.subscribeToConnectionStatus()
        await this.subscribeToOnlineUsers()
        await this.subscribeToInvitations()
        // this.subscribeToCurrentGame()
      } else {
        // console.log('User signed out')
      }
    })
  }

  @action.bound
  async getStatisticsInfo() {
    const res = await userStore
      .getApiCoreAxiosClient()!
      .get(`/report/statistics/${userStore.uuid}`)
    if (res?.data) {
      this.statistics = res.data
    }
  }

  async subscribeToConnectionStatus() {
    Firebase.database()
      .ref('.info/connected')
      .on('value', snapshot => {
        // If we're not currently connected, don't do anything.
        if (snapshot.val() == false) {
          return console.log('Disconnected')
        }

        var userRef = Firebase.database().ref(
          this.FIREBASE_BASE_PATH + '/' + this.uid
        )

        userRef.update({
          firstName: userStore.firstname,
          lastName: userStore.lastname,
          uid: this.uid
        })

        var connectionsRef = userRef.child('/connections')
        var ref = connectionsRef.push()
        this.connectionRef = ref.key
        ref
          .onDisconnect()
          .remove()
          .then(async () => {
            // set online
            ref.set({
              status: GameAreaStatus.ONLINE
              // last_changed: Firebase.database.ServerValue.TIMESTAMP
            })
          })
      })
  }

  async subscribeToOnlineUsers() {
    Firebase.database()
      .ref(this.FIREBASE_BASE_PATH)
      .on('value', snap => {
        // console.log(snap.val())
        this.setOnlineUsers(snap.val())
      })
  }

  async subscribeToInvitations() {
    //Firebase.database()
    //  .ref(this.FIREBASE_BASE_PATH + '/' + this.uid + '/invitations')
    //  .on('value', snap => {
    //    this.setInvitations(snap.val())
    //  })

    Firebase.database()
      .ref(`${this.FIREBASE_BASE_PATH}/${this.uid}/invitations`)
      .on('child_added', snap => {
        // Show invites only when user is not playing a game already
        const gameInProgress =
          liveGameStore.currentGameId != null &&
          syncedGameStore.isGameInProgress
        if (!gameInProgress) {
          this.newInvitaionCallback(snap.key, snap.val())
        }
      })

    Firebase.database()
      .ref(`${this.FIREBASE_BASE_PATH}/${this.uid}/invitations`)
      .on('child_removed', snap => {
        this.deleteInvitaionCallback(snap.key, snap.val())
      })
  }

  @action.bound
  onNewInvitation(callback: () => any) {
    this.newInvitaionCallback = callback
  }

  @action.bound
  onDeleteInvitation(callback: () => any) {
    this.deleteInvitaionCallback = callback
  }

  getStatus(connections: any) {
    if (!connections) {
      return GameAreaStatus.OFFLINE
    }
    return Object.keys(connections).filter(c => {
      return connections[c].status === GameAreaStatus.ONLINE
    }).length > 0
      ? GameAreaStatus.ONLINE
      : GameAreaStatus.AWAY
    // let flag = false
    // let state = ''
    // if (connections) {
    //   Object.keys(connections).forEach(x => {
    //     if (connections[x].state == 'online') {
    //       state = connections[x].state
    //       flag = true
    //     }
    //   })

    //   if (flag) {
    //     return state
    //   } else {
    //     return 'idle'
    //   }
    // }
  }

  @action.bound
  async setOnlineUsers(users) {
    if (users == null) {
      return (this.onlineUsers = [])
    }
    this.onlineUsers = Object.keys(users)
      .map(key => {
        var user = users[key]
        return {
          name: user.firstName + ' ' + user.lastName,
          uid: user.uid,
          key: user.uid,
          online: user.connections != null,
          status: this.getStatus(user.connections)
        }
      })
      .filter(u => u.online == true) // filter out offline users
      .filter(u => u.uid != this.uid) // filter out current user
  }
  @action.bound
  async setUser() {
    this.uid = userStore.uuid
  }

  @action.bound
  async setInvitations(_invitations) {
    if (_invitations == null) {
      this.invitations = []
      return
    }

    this.invitations = Object.keys(_invitations).map(key => _invitations[key])
  }

  @action.bound
  async sendInvite(uid: any, color: string, time: number, increment: number) {
    // console.log('Send invitation', uid)
    var ref = Firebase.database().ref(
      this.FIREBASE_BASE_PATH + '/' + uid + '/invitations'
    )

    var invitation = {
      inviteeId: this.uid,
      color: color || 'both',
      time: time || '5',
      increment: increment || 0,
      inviteeName: userStore.fullName
    }

    var newInvitationRef = ref.push(invitation)

    newInvitationRef.onDisconnect().remove()

    // remove on disconnection and timeout
    setTimeout(() => {
      newInvitationRef.remove()
    }, 20000)
  }

  async sendStatus(status: string) {
    console.log('Send Status', this.uid + status + this.connectionRef)
    const userRef = Firebase.database().ref(
      this.FIREBASE_BASE_PATH +
        '/' +
        this.uid +
        '/connections/' +
        this.connectionRef
    )

    userRef.update({
      status: status
    })
  }

  @action.bound
  async acceptInvitation(invitationDetails: InvitationDetails) {
    //TODO: record in DB the game accepted
    // create game

    if (invitationDetails.color == 'white') {
      const whiteName = userStore.firstname
      const blackName = invitationDetails.inviteeName

      await this.createGame(
        this.uid,
        invitationDetails.inviteeId,
        whiteName,
        blackName,
        invitationDetails.time,
        invitationDetails.increment
      )
    } else {
      const whiteName = invitationDetails.inviteeName
      const blackName = userStore.firstname

      await this.createGame(
        invitationDetails.inviteeId,
        this.uid,
        whiteName,
        blackName,
        invitationDetails.time,
        invitationDetails.increment
      )
    }

    // clear all invitations
    Firebase.database()
      .ref(this.FIREBASE_BASE_PATH + '/' + this.uid + '/invitations')
      .remove()
  }

  @action.bound
  async createGame(
    whiteUid: string,
    blackUid: string,
    whiteName: string,
    blackName: string,
    time: number,
    increment: number
  ) {
    const game = {
      white_uuid: whiteUid,
      black_uuid: blackUid,
      time_control: time,
      time_increment: increment,
      white_name: whiteName,
      black_name: blackName
    }

    await userStore.getGameServerAxiosClient()!.post(`/live-games`, game)
  }

  @action.bound
  rejectInvitation(inviteId) {
    // console.log('Rejecting invitation, ', inviteId)
    Firebase.database()
      .ref(`${this.FIREBASE_BASE_PATH}/${this.uid}/invitations/${inviteId}`)
      .remove()
    //this.invitations = this.invitations.filter(
    //  inv => inv.inviteeId != invitation.inviteeId
    //)
  }

  @action.bound
  async rematch(
    opponentUid: string,
    opponentColor: string,
    timeControl: number,
    timeIncrement: number
  ) {
    // console.log('starting a rematch')
    var invitationDetails: InvitationDetails = {
      inviteeId: opponentUid,
      color: opponentColor == 'white' ? 'black' : 'white',
      time: timeControl,
      inviteeName: userStore.fullName,
      increment: timeIncrement
    }

    this.acceptInvitation(invitationDetails)
  }
}

export const invitationStore = new InvitationStore()
