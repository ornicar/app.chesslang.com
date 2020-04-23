import * as React from 'react'
import { Modal, Carousel, Icon, Row, Col } from 'antd'
import { observer, inject } from 'mobx-react'
import { withRouter, RouteComponentProps } from 'react-router-dom'
import { AnnouncementStore } from '../../stores/announcements'

import './announcements.less'

interface Props extends RouteComponentProps<any> {
  announcementStore?: AnnouncementStore
}

@inject('announcementStore')
@observer
class Announcements extends React.Component<Props> {
  private carousel: Carousel | null = null

  setCarousel = (carousel: any) => {
    this.carousel = carousel
    this.updateLastSeenAnnouncenmentIndex(
      this.props.announcementStore!.nextToBeShownIndex
    )
  }

  next = () => {
    this.carousel!.next()
  }

  prev = () => {
    this.carousel!.prev()
  }

  closeAnnouncements = () => {
    this.props.announcementStore!.setVisible(false)
  }

  updateLastSeenAnnouncenmentIndex = (index: number) => {
    const id = this.props.announcementStore!.announcements[index].fields.id
    this.props.announcementStore!.updateLastSeenAnnouncenmentId(id)
  }

  get isVisible() {
    return (
      this.props.location.pathname != '/app/dashboard' && // don't show announcnments on dashboard
      this.props.announcementStore!.isVisible &&
      this.props.announcementStore!.loaded
    )
  }

  render() {
    return (
      <Modal
        visible={this.isVisible}
        onCancel={this.closeAnnouncements}
        footer={null}
        centered={true}
      >
        {this.props.announcementStore!.loaded && (
          <Row type="flex">
            <Col span={3} className="announcement-prev" onClick={this.prev}>
              <Icon type="left" />
            </Col>
            <Col span={18}>
              <h1 style={{ textAlign: 'center' }}>What's New</h1>
              <Carousel
                ref={this.setCarousel}
                className="announcements"
                afterChange={this.updateLastSeenAnnouncenmentIndex}
                initialSlide={this.props.announcementStore!.nextToBeShownIndex}
                infinite={false}
              >
                {this.props.announcementStore!.announcements.map(
                  (item: any) => (
                    <div className="announcement" key={item.id}>
                      <h2 className="announcement__title">
                        {item.fields.title}
                      </h2>
                      <p className="announcement__text">
                        {item.fields.description}
                      </p>
                      {item.fields.image && (
                        <img
                          className="announcement__image"
                          src={item.fields.image[0].url}
                        />
                      )}
                    </div>
                  )
                )}
              </Carousel>
            </Col>
            <Col span={3} className="announcement-next" onClick={this.next}>
              <Icon type="right" />
            </Col>
          </Row>
        )}
      </Modal>
    )
  }
}

export default withRouter(Announcements)
