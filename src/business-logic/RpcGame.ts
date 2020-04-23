import getAbly from '../ablyInit'
import * as Ably from 'ably'
import { GameResult } from '../types'
import {
  RpcGameState,
  RpcGameMove,
  OnMoveCallback,
  OnOfferDrawCallback,
  OnGameOverCallback,
  IRpcGame,
  OnOfferRematchCallback,
  OnConnectCallback
} from './IRpcGame'

export default class RpcGame implements IRpcGame {
  gameId: string
  channel: Ably.Types.RealtimeChannelCallbacks
  onConnectCallback: OnConnectCallback = (gameState: RpcGameState) => {}
  onMoveCallback: OnMoveCallback = (move: RpcGameMove) => {}
  onGameOverCallback: OnGameOverCallback = (result: GameResult) => {}
  onOfferDrawCallback: OnOfferDrawCallback = (playerColor: string) => {}
  onOfferRematchCallback: OnOfferRematchCallback = (playerColor: string) => {}

  constructor(gameId: string) {
    this.gameId = gameId

    this.channel = getAbly().channels.get(gameId)

    console.log(gameId, 'Setting up subscriptions')
    this.setupSubscriptions()

    console.log(gameId, 'Publishing CLIENT_CONNECT event to channel')
    this.channel.publish(RpcClientEvent.CLIENT_CONNECT, {})
  }

  teardown() {
    this.channel.unsubscribe()
    this.channel.detach(() => {
      console.log('ably channel detached')
    })
    getAbly().channels.release(this.gameId)
  }

  setupSubscriptions() {
    this.channel.subscribe(RpcServerEvent.SERVER_GAME_STATE, ({ data }) => {
      console.log(
        this.gameId,
        'SERVER_GAME_STATE event received from server',
        data
      )

      this.onConnectCallback(data)
      this.channel.unsubscribe(RpcServerEvent.SERVER_GAME_STATE)
    })

    this.channel.subscribe(RpcServerEvent.SERVER_GAME_OVER, message => {
      // set game state
      this.onGameOverCallback(message.data)
      this.channel.unsubscribe(RpcServerEvent.SERVER_GAME_OVER)
    })

    this.channel.subscribe(RpcServerEvent.SERVER_MOVE, ({ data }) => {
      this.onMoveCallback(data)
    })

    this.channel.subscribe(RpcServerEvent.SERVER_OFFER_DRAW, ({ data }) => {
      this.onOfferDrawCallback(data.playerColor)
    })

    this.channel.subscribe(RpcServerEvent.SERVER_OFFER_REMATCH, ({ data }) => {
      this.onOfferRematchCallback(data.playerColor)
    })
  }

  onConnect(callback: OnConnectCallback) {
    this.onConnectCallback = callback
  }

  onMove(callback: OnMoveCallback) {
    this.onMoveCallback = callback
  }

  onGameOver(callback: OnGameOverCallback) {
    this.onGameOverCallback = callback
  }

  onOfferDraw(callback: OnOfferDrawCallback) {
    this.onOfferDrawCallback = callback
  }

  onOfferRematch(callback: OnOfferRematchCallback) {
    this.onOfferRematchCallback = callback
  }

  makeMove(orig: string, dest: string, promotion?: string): void {
    // TODO: include ply in message
    this.channel.publish(RpcClientEvent.CLIENT_MOVE, {
      orig,
      dest,
      promotion
    })
  }

  resignGame(playerColor: string): void {
    this.channel.publish(RpcClientEvent.CLIENT_RESIGN, { playerColor })
  }

  offerDraw(playerColor: string): void {
    this.channel.publish(RpcClientEvent.CLIENT_OFFER_DRAW, {
      playerColor
    })
  }

  acceptDraw(): void {
    this.channel.publish(RpcClientEvent.CLIENT_ACCEPT_DRAW, {})
  }

  offerRematch(playerColor: string): void {
    this.channel.publish(RpcClientEvent.CLIENT_OFFER_REMATCH, { playerColor })
  }

  acceptRematch(): void {
    this.channel.publish(RpcClientEvent.CLIENT_ACCEPT_REMATCH, {})
  }
}

export enum RpcServerEvent {
  SERVER_GAME_STATE = 'SERVER_GAME_STATE',
  SERVER_MOVE = 'SERVER_MOVE',
  SERVER_GAME_OVER = 'SERVER_GAME_OVER',
  SERVER_OFFER_DRAW = 'SERVER_OFFER_DRAW',
  SERVER_OFFER_REMATCH = 'SERVER_OFFER_REMATCH'
}

export enum RpcClientEvent {
  CLIENT_CONNECT = 'CLIENT_CONNECT',
  CLIENT_MOVE = 'CLIENT_MOVE',
  CLIENT_OFFER_DRAW = 'CLIENT_OFFER_DRAW',
  CLIENT_ACCEPT_DRAW = 'CLIENT_ACCEPT_DRAW',
  CLIENT_RESIGN = 'CLIENT_RESIGN',
  CLIENT_OFFER_REMATCH = 'CLIENT_OFFER_REMATCH',
  CLIENT_ACCEPT_REMATCH = 'CLIENT_ACCEPT_REMATCH'
}
