// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { LoadingOutlined, SettingOutlined, UserSwitchOutlined } from '@ant-design/icons'
import { Badge, ConfigProvider, Menu, Spin } from 'antd'
import enGB from 'antd/lib/locale/en_GB'
import enUS from 'antd/lib/locale/en_US'
import { ClickParam } from 'antd/lib/menu'
import moment from 'moment'
import AppLocaleWrapper from 'apps/AppLocaleWrapper'
import { useLocaleCtx } from 'apps/LocaleContext'
import { DiagnosticResultsKanban } from 'components/administrator'
import { AvailabilitySummary } from 'components/common/Availability/AvailabilitySummary'
import Header from 'components/common/Header'
import ChatApplication from 'components/messages/ChatApplication'
import { AllTestResultsPage } from 'components/tutoring/AllTestResultsPage'
import { TimeCardPage } from 'components/tutoring/TimeCard'
import { TutorAppTutoringSessions } from 'components/tutoring/TutorAppTutoringSessions'
import Modals from 'components/tutoring/TutoringModalManager'
import { TutoringSessionsContainer } from 'components/tutoring/TutoringSessions'
import { cwuser_pk, cwuser_type, user_pk } from 'global'

import {history} from 'App'
import React, { useEffect } from 'react'
import ReactDOM from 'react-dom'
import { Provider, useSelector } from 'react-redux'
import { NavLink, Route, Router, Switch } from 'react-router-dom'
import { Platform } from 'store/common/commonTypes'
import { selectActiveNotificationRecipient } from 'store/notification/notificationsSelector'
import { fetchNotificationRecipient } from 'store/notification/notificationsThunks'
import { RootState } from 'store/rootReducer'
import store, { useReduxDispatch } from 'store/store'
import { setActiveUser } from 'store/user/usersSlice'
import { fetchTutor } from 'store/user/usersThunks'
import { SetCurrentUserPayload } from 'store/user/usersTypes'
import 'style/common/global.scss'
import Account from './Account'
import Home from './Home'

moment.locale('en')
const localMap = {
  enGB,
  enUS,
}



const App = () => {
  const dispatch = useReduxDispatch()
  const { locale } = useLocaleCtx()
  const activeTutor = useSelector((state: RootState) =>
    state.user.activeUser ? state.user.tutors[state.user.activeUser.cwUserID] : null,
  )
  const unreadMessages = !!useSelector(selectActiveNotificationRecipient)?.unread_conversations
  /**
   * User clicks an item in Header menu
   * @param menuItem (use key property)
   */
  const clickMenu = (menuItem: ClickParam) => {
    if (menuItem.key === 'logout') {
      window.location.href = '/logout'
    } else if (menuItem.key === 'switch-account') {
      window.location.href = `/user/switch-account/administrator/`
    }
    History.push(`/${menuItem.key}`)
  }

  // Load our active tutor. We can assume they're authenticated if they are here
  const activeUser: SetCurrentUserPayload = {
    cwUserID: cwuser_pk,
    userType: cwuser_type,
    userID: user_pk,
  }
  const { cwUserID, userType, userID } = activeUser

  useEffect(() => {
    dispatch(fetchTutor(cwUserID)).then(t => {
      if (t.notification_recipient) {
        dispatch(fetchNotificationRecipient(t.notification_recipient))
      }
    })
    dispatch(setActiveUser({ cwUserID, userType, userID, platform: Platform.CAS }))
  }, [dispatch, cwUserID, userType, userID])

  // Items that appear in primary header menu
  const primaryMenuItems = unreadMessages ? (
    <Menu.Item key="message">
      <Badge dot={true}>
        <span>Messages</span>
      </Badge>
    </Menu.Item>
  ) : (
    <Menu.Item key="message">Messages</Menu.Item>
  )
  // Items that appear in account drop down menu, above logout
  const accountMenuItems = [
    <Menu.Item key="account">
      <SettingOutlined />
      Account
    </Menu.Item>,
  ]
  if (activeTutor?.is_admin) {
    accountMenuItems.push(
      <Menu.Item key="switch-account">
        <UserSwitchOutlined />
        Admin
      </Menu.Item>,
    )
  }

  return (
    <ConfigProvider locale={localMap[locale]}>
      <div className="app-container">
        <Router history={History}>
          <Header
            accountMenuItems={accountMenuItems}
            menuItems={primaryMenuItems}
            menuClick={clickMenu}
            avatar={activeTutor?.profile_picture}
          />
          {activeTutor ? (
            <div className="app-inner-container">
              <Modals />
              <div className="app-sidebar">
                <div className="app-sidebar-links">
                  <NavLink exact to="/">
                    Students
                  </NavLink>
                  <NavLink to="/sessions/">Sessions</NavLink>
                  <NavLink to="/availability/">Availability</NavLink>
                  <NavLink to="/time-cards/">Time Card</NavLink>
                  <NavLink to="/test-results/">Test Results</NavLink>
                  {activeTutor.is_diagnostic_evaluator && <NavLink to="/diagnostics/">Diagnostics</NavLink>}
                  <img src="/static/cwcommon/sidebar_graphic.png" className="sidebar-graphic" alt="" />
                </div>
              </div>
              <div className="app-content-outer">
                <div className="app-content-inner">
                  <Switch>
                    <Route path="/" exact component={Home} />
                    <Route path="/account/" render={() => <Account tutorID={activeTutor.pk} />} />
                    <Route path="/message/" render={() => <ChatApplication tutorID={activeTutor.pk} />} />
                    <Route path="/availability/" render={() => <AvailabilitySummary tutor={activeTutor.pk} />} />
                    {activeTutor.is_diagnostic_evaluator && (
                      <Route path="/diagnostics/" render={() => <DiagnosticResultsKanban />} />
                    )}
                    <Route
                      path="/sessions/"
                      render={() => (
                        <TutoringSessionsContainer tutorID={activeTutor.pk}>
                          <TutorAppTutoringSessions />
                        </TutoringSessionsContainer>
                      )}
                    />
                    <Route path="/time-cards/" render={() => <TimeCardPage tutorID={activeTutor.pk} />} />
                    <Route path="/test-results/" render={() => <AllTestResultsPage tutorID={activeTutor.pk} />} />
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
        </Router>
      </div>
    </ConfigProvider>
  )
}

export default App;
