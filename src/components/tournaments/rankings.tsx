import React, { Component } from 'react'
import { Table, Tabs, List, Skeleton, Avatar, Spin } from 'antd'
import { inject, observer } from 'mobx-react'
import { TournamentViewStore, DataStatus } from '../../stores/tournament-view'
import _ from 'lodash'
import { getFormattedName } from '../../utils/utils'
import Title from 'antd/lib/typography/Title'

const { TabPane } = Tabs

interface Props {
  tournamentViewStore?: TournamentViewStore
}

@inject('tournamentViewStore')
@observer
export default class Rankings extends Component<Props> {
  render() {
    return this.props.tournamentViewStore!.rankingStatus ==
      DataStatus.LOADING ? (
      <div className="flex-center">
        <Spin />
      </div>
    ) : (
      this.renderContent()
    )
  }

  renderContent() {
    return (
      <div>
        <Tabs
          defaultActiveKey={`${this.props.tournamentViewStore!.latestRound}`}
          type="card"
        >
          {this.renderRankings()}
        </Tabs>
      </div>
    )
  }

  renderRanking = (item: any) => {
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
                {item.rank}
              </Avatar>
            }
            title={item.name}
            description={`Points ${item.points}  |  Sno ${item.sno}`}
          />
        </Skeleton>
      </List.Item>
    )
  }

  renderRankings = () => {
    const roundRankingsMap = _.groupBy(
      this.props.tournamentViewStore!.tournament.rankings,
      'round'
    )

    return _.toPairs(roundRankingsMap).map(([round, roundRankings]: any) => {
      const groupRankingsMap = _.groupBy(roundRankings, 'groupNo')

      return (
        <TabPane tab={`Round ${round}`} key={round}>
          {_.map(groupRankingsMap, (groupRankings, groupNo) => {
            return (
              <div className="mb-4">
                {groupNo != 'null' && (
                  <Title level={3}>Section {groupNo}</Title>
                )}
                <List
                  key={groupNo}
                  loading={false}
                  itemLayout="horizontal"
                  dataSource={this.sortRankings(groupRankings)}
                  renderItem={this.renderRanking}
                />
              </div>
            )
          })}
        </TabPane>
      )
    })
  }

  sortRankings(rankings: any) {
    return rankings.map((ranking: any, index: number) => {
      return {
        key: ranking.player_uuid,
        rank: index + 1,
        groupNo: ranking.groupNo,
        sno: ranking.sno,
        name: getFormattedName(ranking),
        points: ranking.cumulativeScore,
        tb_1: '0',
        tb_2: '0',
        tb_3: '0'
      }
    })
  }
}
