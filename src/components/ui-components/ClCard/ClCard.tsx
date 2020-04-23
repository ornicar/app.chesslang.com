import * as React from 'react'
import { Button } from 'antd'
import { ConfiguredChessboard } from '../../chessboard/configured-chessboard'

/*
// Card -> Component defined for shortcastle custom card implementation
// Types: live, request, invite, statcard, scorecard
*/

interface CardProps {
  type: string
  student?: {
    name: string
    status: string
    gameStatus?: {
      color: string
      time: string
    }
    stats?: Array<{ title: string; value: number }>
  }
  players?: any
  fen?: string
  onClick?: () => {}
  displayBoard?: boolean
  style?: {
    primary?: string
    primaryLight?: string
  }
}

export const ClCard: React.SFC<CardProps> = props => {
  /*
  // Style defined to fetch academy branding colors
  // from Colors lib
  */
  const style = {
    backgroundColor: props.style?.primaryLight
      ? props.style?.primaryLight
      : '#8D86C9'
  }
  const stylePrimary = {
    backgroundColor: props.style?.primary ? props.style?.primary : '#725AC1',
    borderColor: props.style?.primary ? props.style?.primary : '#725AC1'
  }
  const getLayerWithScore = (name: string, score: string, color: string) => {
    return (
      <>
        <div className="w-2/3 overflow-hidden sm:w-2/3 md:w-2/3 lg:w-2/3 xl:w-2/3 -mb-6">
          <p className="pt-2 inline-block truncate ...">
            <span className="inline-block mr-2">
              {color == 'white' ? (
                <div className="rounded-full h-3 w-3 flex items-center justify-center bg-white" />
              ) : (
                <div className="rounded-full h-3 w-3 flex items-center justify-center bg-black" />
              )}
            </span>
            {name}
          </p>
        </div>
        <div className="w-1/3 overflow-hidden sm:w-1/3 md:w-1/3 lg:w-1/3 xl:w-1/3 -mb-6">
          <p className="text-2xl float-right">{score !== null ? score : '*'}</p>
        </div>
      </>
    )
  }
  const getLayerWithNameAndName = (name1: string, name2: string) => {
    return (
      <>
        <div className="w-1/2 overflow-hidden sm:w-1/2 md:w-1/2 lg:w-1/2 xl:w-1/2 -mb-2">
          <p className="inline-block truncate ...">
            <span className="inline-block">
              <div className="rounded-full h-3 w-3 flex items-center justify-center bg-white mr-2" />
            </span>
            {name1}
          </p>
        </div>
        <div className="w-1/2 overflow-hidden sm:w-1/2 md:w-1/2 lg:w-1/2 xl:w-1/2 -mb-2">
          <p className="float-right inline-block truncate ...">
            {name2}
            <span className="inline-block">
              <div className="rounded-full h-3 w-3 flex items-center justify-center bg-black ml-2" />
            </span>
          </p>
        </div>
      </>
    )
  }
  const getLayerWithScoreAndScore = (score1: number, score2: number) => {
    return (
      <>
        <div className="w-1/2 overflow-hidden sm:w-1/2 md:w-1/2 lg:w-1/2 xl:w-1/2 -mb-4">
          <p className="text-2xl truncate ...">
            {score1 == 0 || score1 ? score1 : '*'}
          </p>
        </div>
        <div className="w-1/2 overflow-hidden sm:w-1/2 md:w-1/2 lg:w-1/2 xl:w-1/2 -mb-4">
          <p className="text-2xl truncate ... float-right">
            {score2 == 0 || score2 ? score2 : '*'}
          </p>
        </div>
      </>
    )
  }
  const getLayerWithTime = (name: string, time: string) => {
    return (
      <>
        <div className="w-2/3 overflow-hidden sm:w-2/3 md:w-2/3 lg:w-2/3 xl:w-2/3">
          <p className="truncate ...">{name}</p>
        </div>
        <div className="w-1/3 overflow-hidden sm:w-1/3 md:w-1/3 lg:w-1/3 xl:w-1/3">
          <p className="text-base float-right">{time}</p>
        </div>
      </>
    )
  }
  const getLayerWithStatus = (name: string, status: string) => {
    return (
      <>
        <div className="w-2/3 overflow-hidden sm:w-2/3 md:w-2/3 lg:w-2/3 xl:w-2/3 -mb-2">
          <p className="pt-1 truncate ...">{name}</p>
        </div>
        <div className="w-1/3 overflow-hidden sm:w-1/3 md:w-1/3 lg:w-1/3 xl:w-1/3 -mb-2">
          <span className="text-xs float-right">
            <span className="pr-2 -mt-8 leading-8">
              {status == 'online' ? 'Online' : 'Away'}
            </span>
            <span className="inline-block">
              {status == 'online' ? (
                <div className="rounded-full h-3 w-3 flex items-center justify-center bg-green-600" />
              ) : (
                <div className="rounded-full h-3 w-3 flex items-center justify-center bg-yellow-500" />
              )}
            </span>
          </span>
        </div>
      </>
    )
  }
  const getLine = () => {
    return (
      <div className="w-full overflow-hidden">
        <div className="border-solid border border-scPurple opacity-25" />
      </div>
    )
  }
  const scoreCardInnerBox = (text: string, number: number) => {
    return (
      <div className="m-auto bg-scWhite mt-2 py-2 text-scPurple text-center rounded-lg w-4/5 max-w-100px">
        <p>{text}</p>
        <p className="text-3xl">{number}</p>
      </div>
    )
  }
  const bottomLayerInviteType = () => {
    return (
      <div className="w-full overflow-hidden">
        <div className="w-full overflow-hidden">
          <div className="text-xs float-right pt-2 pr-2">
            {/* <Button
              type="primary"
              size="small"
              block={false}
              style={stylePrimary}
              className="p-2 rounded text-white"
              onClick={props.onClick}
            >
              Invite
            </Button> */}

            <Button
              style={stylePrimary}
              type="primary"
              block
              onClick={props.onClick}
            >
              Invite
            </Button>
          </div>
        </div>
      </div>
    )
  }
  const bottomLayerRequestType = () => {
    return (
      <>
        <div className="w-1/3 overflow-hidden sm:w-1/3 md:w-1/3 lg:w-1/3 xl:w-1/3 mt-2">
          <span className="text-xs">
            <span className="mt-4">
              <div
                className={
                  'inline-block indicator ' + props.student?.gameStatus?.color
                }
              />
            </span>
            <span className="pl-2 -mt-4 leading-8">
              {props.student?.gameStatus?.time}
            </span>
          </span>
        </div>
        <div className="w-2/3 overflow-hidden sm:w-2/3 md:w-2/3 lg:w-2/3 xl:w-2/3 flex flex-row">
          <div className="w-1/3 overflow-hidden sm:w-1/3 md:w-1/3 lg:w-1/3 xl:w-1/3">
            <div className="float-right pt-2 pr-2">
              <Button type="link" value="small" className="text-xs p-2">
                Negotiate
              </Button>
            </div>
          </div>
          <div className="w-1/3 overflow-hidden sm:w-1/3 md:w-1/3 lg:w-1/3 xl:w-1/3">
            <div className="float-right pt-2 pr-2">
              <Button type="link" value="small" className="text-xs p-2">
                Ignore
              </Button>
            </div>
          </div>
          <div className="w-1/3 overflow-hidden sm:w-1/3 md:w-1/3 lg:w-1/3 xl:w-1/3">
            <div className="text-xs float-right pt-2 pr-2">
              <Button
                type="primary"
                size="small"
                block
                style={stylePrimary}
                className="p-2 rounded text-white"
              >
                Accept
              </Button>
            </div>
          </div>
        </div>
      </>
    )
  }
  const getBoard = () => {
    if (props.displayBoard) {
      return (
        <div className="w-full pt-2 pb-1 my-3">
          <div className="flex justify-center">
            <ConfiguredChessboard
              width={300}
              height={300}
              fen={props.fen!}
              interactionMode="NONE"
            />
          </div>
        </div>
      )
    } else {
      return <p>Chess board disabled for storybook</p>
    }
  }
  if (props.type == 'request') {
    return (
      <div
        style={style}
        className="flex flex-wrap overflow-hidden rounded-lg card py-3 px-3 text-gray-700 w-full"
      >
        {getLayerWithStatus(props.student!.name, props.student!.status)}
        {getLine()}
        {bottomLayerRequestType()}
      </div>
    )
  } else if (props.type == 'invite') {
    return (
      <div
        style={style}
        className="flex flex-wrap overflow-hidden rounded-lg card py-3 px-3 text-gray-700 w-full"
      >
        {getLayerWithStatus(props.student!.name, props.student!.status)}
        {getLine()}
        {bottomLayerInviteType()}
      </div>
    )
  } else if (props.type == 'statcard') {
    return (
      <div
        style={style}
        className="flex flex-wrap overflow-hidden rounded-lg card py-3 px-3 text-gray-700 w-full"
      >
        {getLayerWithStatus(props.student!.name, props.student!.status)}
        {getLine()}
        {props.student?.stats?.map(x => scoreCardInnerBox(x.title, x.value))}
      </div>
    )
  } else if (props.type == 'scorecard') {
    if (props.displayBoard) {
      return (
        <div
          className="xl:mx-6 lg:mx-6 md:mx-4 sm:mx-2 cursor-pointer"
          onClick={props.onClick}
        >
          <div
            style={style}
            className="flex flex-wrap overflow-hidden rounded-lg card py-3 px-3 text-gray-700 w-full"
          >
            {getLayerWithScore(
              props.players!.blackName!,
              props.players!.blackScore!,
              'black'
            )}
            {getLine()}
            <div className="w-full pt-2 pb-1 my-3">
              <div className="flex justify-center">
                <ConfiguredChessboard
                  width={230}
                  height={230}
                  fen={props.fen!}
                  interactionMode="NONE"
                />
              </div>
            </div>
            {getLine()}
            {getLayerWithScore(
              props.players!.whiteName!,
              props.players!.whiteScore!,
              'white'
            )}
          </div>
        </div>
      )
    } else {
      return (
        <div className="xl:mx-4 lg:mx-4 md:mx-3 sm:mx-1">
          <div
            style={style}
            className="flex flex-wrap overflow-hidden rounded-lg card pt-3 px-3 text-gray-700 w-full"
          >
            {getLayerWithNameAndName(
              props.players!.whiteName!,
              props.players!.blackName!
            )}
            {getLine()}
            {getLayerWithScoreAndScore(
              props.players!.whiteScore,
              props.players!.blackScore
            )}
          </div>
        </div>
      )
    }
  } else if (props.type == 'livegame') {
    return (
      <div className="xl:mx-8 lg:mx-8 md:mx-6 sm:mx-2">
        <div
          style={style}
          className="flex flex-wrap overflow-hidden rounded-lg card py-3 px-3 text-gray-700 w-full"
        >
          {getLayerWithTime(props.players![0].name!, props.players![0].time!)}
          {getLine()}
          {getBoard()}
          {getLine()}
          {getLayerWithTime(props.players![1].name!, props.players![1].time!)}
        </div>
      </div>
    )
  } else {
    return <p>Something went wrong</p>
  }
}
