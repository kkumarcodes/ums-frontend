// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { LoadingOutlined, SettingOutlined } from '@ant-design/icons'
import { Menu, Spin, Badge } from 'antd'
import { ClickParam } from 'antd/lib/menu'
import Header from 'components/common/Header'
import ChatApplication from 'components/messages/ChatApplication'
import DisplayResourceCategories from 'components/student/DisplayResourceCategories'
import DisplayResourceList from 'components/student/DisplayResourceList'
// All modals here they be
import Modals from 'components/tutoring/TutoringModalManager'

import { history } from 'App'
import React from 'react'
import { connect, ConnectedProps } from 'react-redux'
import { NavLink, Route, Router, Switch } from 'react-router-dom'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import { fetchResources } from 'store/resource/resourcesThunks'
import { RootState } from 'store/rootReducer'
import store from 'store/store'
import { setActiveUser } from 'store/user/usersSlice'
import { fetchStudent } from 'store/user/usersThunks'
import { fetchNotificationRecipient } from 'store/notification/notificationsThunks'
import { SetCurrentUserPayload, UserType, Student } from 'store/user/usersTypes'
import WelcomeModal from 'components/common/WelcomeModal'
import { Platform } from 'store/common/commonTypes'
import Account from './Account'
import Home from './TutoringHome'

// All modals here they be



class App extends React.Component<AppProps, {}> {
  // Items that appear in primary header menu

  // Items that appear in account drop down menu, above logout
  accountMenuItems = (
    <Menu.Item key="account">
      <SettingOutlined />
      Account
    </Menu.Item>
  )

  /**
   * User clicks an item in Header menu
   * @param menuItem (use key property)
   */

  componentDidMount() {
    const cwuser_pk = localStorage.getItem('cwuser_pk');
    const user_pk = localStorage.getItem('user_pk');
    this.props.fetchStudent(cwuser_pk).then((student: Student) => {

      if (student.notification_recipient) {
        this.props.fetchNotificationRecipient(student.notification_recipient)
      }
    })
    const activeUser: SetCurrentUserPayload = {
      cwUserID: cwuser_pk,
      userType: UserType.Student,
      userID: user_pk,
    }
    this.props.fetchResources({})
    this.props.setActiveUser({ ...activeUser, platform: Platform.CAS })
  }

  getMessageItem() {
    if (this.props.unreadMessages) {
      return (
        <Menu.Item key="message">
          <Badge dot={true}>
            <span>Messages</span>
          </Badge>
        </Menu.Item>
      )
    }
    return <Menu.Item key="message">Messages</Menu.Item>
  }

  clickMenu(menuItem: ClickParam) {
    if (menuItem.key === 'logout') {
      window.location.href = '/user/logout'
    }
    history.push(`/user/platform/student/${menuItem.key}`)
  }

  localShowModal(modalType: MODALS) {
    if (!this.props.activeStudent) {
      return
    }
    const data = { modal: modalType, props: { studentID: this.props.activeStudent.pk } }
    this.props.showModal(data)
  }

  render() {
    return (
      <div className="app-container">
        <Modals />
        <WelcomeModal />
        <Header
          accountMenuItems={this.accountMenuItems}
          menuItems={this.getMessageItem()}
          menuClick={this.clickMenu}
          unreadMessages={this.props.unreadMessages}
          avatar={this.props.activeStudent?.profile_picture}
        />
        {this.props.activeStudent ? (
          <div className="app-inner-container">
            <div className="app-sidebar">
              <div className="app-sidebar-links">
                <NavLink exact to="/">
                  Feed
                </NavLink>
                <DisplayResourceCategories />
              </div>
              <div className="app-sidebar-actions-container">
                <a href="/user/platform/student/message" className="action-button white">
                  Send Message
                </a>
                <button
                  type="button"
                  onClick={() => {
                    this.localShowModal(MODALS.CREATE_TUTORING_SESSION)
                  }}
                  className="action-button primary white"
                >
                  Schedule Session
                </button>
                <button
                  type="button"
                  onClick={() => {
                    this.localShowModal(MODALS.SELF_ASSIGN_DIAGNOSTIC)
                  }}
                  className="action-button white"
                >
                  Take Diagnostic
                </button>
                <img src="/static/cwcommon/sidebar_graphic.png" className="sidebar-graphic" alt="" />
              </div>
            </div>
            <div className="app-content-outer">
              <div className="app-content-inner">
                <Switch>
                  <Route path="/user/platform/student/" exact component={Home} />
                  <Route path="/user/platform/student/account/" exact component={Account} />
                  <Route path="/user/platform/student/resource/:id/" exact component={DisplayResourceList} />
                  <Route
                    path="/user/platform/student/message/"
                    exact
                    render={() => <ChatApplication studentID={this.props.activeStudent?.pk} />}
                  />
                </Switch>
              </div>
            </div>
          </div>
        ) : (
          <div className="app-content-loading-wrapper">
            <Spin
              wrapperClassName="app-content-loading-spinner"
              indicator={<LoadingOutlined spin />}
              delay={500}
              spinning={true}
              size="large"
              tip="Loading..."
            />
          </div>
        )}
      </div>
    )
  }
}
const mapStateToProps = (state: RootState) => {
  const activeStudent = state.user.activeUser ? state.user.students[state.user.activeUser.cwUserID] : null
  const unreadMessages = !!(
    activeStudent?.notification_recipient &&
    state.notification.notificationRecipients[activeStudent.notification_recipient]?.unread_conversations
  )

  return {
    activeStudent,
    unreadMessages,
  }
}

const mapDispatch = {
  setActiveUser,
  fetchStudent,
  showModal,
  fetchResources,
  fetchNotificationRecipient,
}
const connector = connect(mapStateToProps, mapDispatch)
type AppProps = ConnectedProps<typeof connector>
const ReduxApp = connector(App)

export default ReduxApp;
