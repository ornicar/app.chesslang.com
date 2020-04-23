import React, { Component } from 'react'
import { Col, Row, Checkbox } from 'antd'
import { UserStore } from '../../../../stores/user'
import { observer, inject } from 'mobx-react'
import { AcademyStore } from '../../../../stores/academy'
import _ from 'lodash'
import { RatingSystemStore } from '../../../../stores/rating-system'
import RatingSystem from '../../../../types/RatingSystem'
import { CheckboxChangeEvent } from 'antd/lib/checkbox'

interface Props {
  userStore?: UserStore
  academyStore: AcademyStore
  ratingSystemStore: RatingSystemStore
}

@inject('userStore', 'academyStore', 'ratingSystemStore')
@observer
export class Settings extends Component<Props> {
  componentDidMount() {
    this.props.ratingSystemStore.load()
  }

  handleRatingSystemChange = (ratingSystem: RatingSystem) => async (
    event: CheckboxChangeEvent
  ) => {
    if (event.target.checked) {
      this.props.ratingSystemStore.add(ratingSystem.id)
    } else {
      this.props.ratingSystemStore.remove(ratingSystem.id)
    }
  }

  render() {
    const {
      availableRatingSystems: allRatingSystems,
      ratingSystems,
      loading
    } = this.props.ratingSystemStore
    const ratingSystemIds = ratingSystems.map(r => r.id)

    return (
      <div className="settings inner">
        <div className="container">
          <div style={{ marginBottom: '.5rem' }}>Rating Systems</div>
          <Row>
            {allRatingSystems.map(s => (
              <Col key={s.id} span={24}>
                <Checkbox
                  value={s.id}
                  disabled={loading}
                  checked={ratingSystemIds.includes(s.id)}
                  onChange={this.handleRatingSystemChange(s)}
                >
                  {s.name}
                </Checkbox>
              </Col>
            ))}
          </Row>
        </div>
      </div>
    )
  }
}

export default Settings
