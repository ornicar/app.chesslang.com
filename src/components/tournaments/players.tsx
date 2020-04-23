import React, { Component } from 'react'
import { Table, List, Skeleton, Avatar, Spin } from 'antd'
import { inject, observer } from 'mobx-react'
import { TournamentViewStore, DataStatus } from '../../stores/tournament-view'
import _ from 'lodash'
import Title from 'antd/lib/typography/Title'

interface Props {
  tournamentViewStore?: TournamentViewStore
}

@inject('tournamentViewStore')
@observer
export default class Players extends Component<Props> {
  renderPlayer = (item: any) => {
    return (
      <List.Item>
        <Skeleton avatar title={false} loading={false}>
          <List.Item.Meta
            avatar={
              <Avatar
                style={{
                  backgroundColor: 'gray',
                  verticalAlign: 'middle'
                }}
                size="large"
              >
                {item.sno}
              </Avatar>
            }
            title={`${item.name}`}
            description={
              <div>
                <span
                  style={{
                    color: item.playerStatus == 'JOINED' ? 'green' : 'blue'
                  }}
                >
                  {item.playerStatus}
                </span>
                {this.props.tournamentViewStore!.tournament
                  .rating_system_id && (
                  <span>&nbsp;|&nbsp;RATING: {item.rating || 'Unrated'}</span>
                )}
              </div>
            }
          />
        </Skeleton>
      </List.Item>
    )
  }

  render() {
    const groupPlayersMap = _.groupBy(
      this.props.tournamentViewStore!.players,
      'groupNo'
    )

    return this.props.tournamentViewStore!.detailStatus ==
      DataStatus.LOADING ? (
      <div className="flex-center">
        <Spin />
      </div>
    ) : (
      _.map(groupPlayersMap, (groupPlayers, groupNo) => {
        return (
          <div className="mb-4">
            {groupNo != 'null' && <Title level={3}>Section {groupNo}</Title>}

            <List
              loading={false}
              itemLayout="horizontal"
              dataSource={groupPlayers}
              renderItem={this.renderPlayer}
            />
          </div>
        )
      })
    )
  }
}
