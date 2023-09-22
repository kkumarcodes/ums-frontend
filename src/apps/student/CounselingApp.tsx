// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { LoadingOutlined, SettingOutlined } from '@ant-design/icons'
import { Badge, Menu, Spin } from 'antd'
import { ClickParam } from 'antd/lib/menu'
import { getFullName } from 'components/administrator'
import Header from 'components/common/Header'
import { AcademicsPage } from 'components/counseling/AcademicsPage'
import StudentAppPlan from 'components/counseling/ApplicationPlan/StudentApplicationPlanPage'
// All modals here they be
import Modals from 'components/counseling/CounselingModalManager'
import { CounselingStudentActivitiesPage } from 'components/counseling/CounselingStudentActivitiesPage'
import CounselorMeetingPage from 'components/counseling/CounselorMeeting/CounselorMeetingPage'
import StudentRoadmapPage from 'components/counseling/StudentRoadmap/StudentRoadmapPage'
import CounselingStudentTaskPage from 'components/counseling/TaskList/CounselingStudentParentTaskPage'
import ChatApplication from 'components/messages/ChatApplication'
import StudentResources from 'components/resources/StudentResourcesPage'
import SchoolProfilePage from 'components/schools/SchoolProfilePage'
import StudentSchoolList from 'components/schools/StudentSchoolList'
import DisplayResourceList from 'components/student/DisplayResourceList'
import StudentCalendar from 'components/student/StudentCalendar'
import StudentCounselingDashboard from 'components/student/StudentCounselingDashboard'
import CounselingStudentTutoringModals from 'components/tutoring/CounselingStudentTutoringModals'
import { cwuser_pk, user_pk } from 'global'


import {history} from 'App'
import React from 'react'
import ReactDOM from 'react-dom'
import { connect, ConnectedProps, Provider } from 'react-redux'
import { NavLink, Route, Router, Switch } from 'react-router-dom'
import { Platform } from 'store/common/commonTypes'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import { fetchNotificationRecipient } from 'store/notification/notificationsThunks'
import { fetchResources } from 'store/resource/resourcesThunks'
import { RootState } from 'store/rootReducer'
import store from 'store/store'
import { fetchTasks } from 'store/task/tasksThunks'
import { fetchUniversities } from 'store/university/universityThunks'
import { setActiveUser } from 'store/user/usersSlice'
import { fetchStudent } from 'store/user/usersThunks'
import { SetCurrentUserPayload, Student, UserType } from 'store/user/usersTypes'
import 'style/common/global.scss'
import Account from './Account'
import StudentHome from './TutoringHome'



class App extends React.Component<AppProps, {}> {
  state = {
    loading: true,
  }

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
    // note that usePlatformLoad hook is called in CounselorStudentList component since we can't use the hook here
    // until this component is refactored

    const promises: Promise<any>[] = [
      this.props.fetchStudent(cwuser_pk).then((student: Student) => {
        if (student.notification_recipient) {
          this.props.fetchNotificationRecipient(student.notification_recipient)
        }
        return student
      }),
      this.props.fetchResources({}),
      this.props.fetchUniversities(),
      this.props.fetchTasks({ user: user_pk }),
    ]
    Promise.all(promises).then(() => {
      this.setState({ loading: false })
    })

    const activeUser: SetCurrentUserPayload = {
      cwUserID: cwuser_pk,
      userType: UserType.Student,
      userID: user_pk,
    }
    this.props.setActiveUser({ ...activeUser, platform: Platform.CAP })
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
    History.push(`/${menuItem.key}`)
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
        <Router history={History}>
          <Modals />
          <CounselingStudentTutoringModals />
          <Header
            avatarLabel={this.props.activeStudent ? getFullName(this.props.activeStudent) : ''}
            accountMenuItems={this.accountMenuItems}
            menuItems={this.getMessageItem()}
            menuClick={this.clickMenu}
            unreadMessages={this.props.unreadMessages}
            avatar={this.props.activeStudent?.profile_picture}
          />
          {this.props.activeStudent && !this.state.loading ? (
            <div className="app-inner-container">
              <div className="app-sidebar">
                <div className="app-sidebar-links">
                  <NavLink exact to="/">
                    Dashboard
                  </NavLink>
                  {this.props.activeStudent.school_list_finalized && (
                    <NavLink exact to="/app-plan/">
                      App Plan
                    </NavLink>
                  )}
                  {!this.props.activeStudent.school_list_finalized && (
                    <NavLink exact to="/roadmap/">
                      Roadmap
                    </NavLink>
                  )}
                  <NavLink to="/school-list/">Colleges</NavLink>
                  <NavLink exact to="/activities/">
                    Activities
                  </NavLink>
                  <NavLink exact to="/academics/">
                    Academics
                  </NavLink>
                  <NavLink exact to="/content/">
                    Content
                  </NavLink>
                  <NavLink exact to="/calendar/">
                    Calendar
                  </NavLink>
                  {this.props.activeStudent.is_cas_student && (
                    <NavLink exact to="/tutoring/">
                      Tutoring
                    </NavLink>
                  )}
                  {this.props.counselorForActiveStudent?.prompt && this.props.activeStudent.is_prompt_active && (
                    <a href="/counseling/launch-essays/" target="_blank" rel="noopener">
                      Essays
                    </a>
                  )}
                </div>
                <img src="/static/cwcommon/sidebar_graphic.png" className="sidebar-graphic" alt="" />
              </div>
              <div className="app-content-outer">
                <div className="app-content-inner">
                  <Switch>
                    <Route path="/" exact component={StudentCounselingDashboard} />
                    <Route path="/app-plan/" exact component={StudentAppPlan} />
                    <Route path="/roadmap/" exact component={StudentRoadmapPage} />
                    <Route path="/tasks/" exact component={CounselingStudentTaskPage} />
                    <Route path="/meetings/" exact component={CounselorMeetingPage} />
                    <Route path="/content/" exact component={StudentResources} />
                    <Route path="/activities/" exact component={CounselingStudentActivitiesPage} />
                    <Route path="/academics/" exact component={AcademicsPage} />
                    <Route path="/school-list/" component={StudentSchoolList} />
                    <Route path="/school/:iped/" component={SchoolProfilePage} />
                    <Route path="/account/" exact component={Account} />
                    <Route path="/resource/:id/" exact component={DisplayResourceList} />
                    <Route path="/tutoring/" exact component={StudentHome} />
                    <Route
                      path="/message/"
                      exact
                      render={() => <ChatApplication studentID={this.props.activeStudent?.pk} />}
                    />
                    <Route path="/calendar/" exact component={StudentCalendar} />
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
    )
  }
}
const mapStateToProps = (state: RootState) => {
  const activeStudent = state.user.activeUser ? state.user.students[state.user.activeUser.cwUserID] : null
  const counselorForActiveStudent = activeStudent?.counselor
    ? state.user.counselors[activeStudent?.counselor]
    : undefined
  const unreadMessages = !!(
    activeStudent?.notification_recipient &&
    state.notification.notificationRecipients[activeStudent.notification_recipient]?.unread_conversations
  )

  return {
    activeStudent,
    counselorForActiveStudent,
    unreadMessages,
  }
}

const mapDispatch = {
  setActiveUser,
  fetchStudent,
  showModal,
  fetchResources,
  fetchUniversities,
  fetchNotificationRecipient,
  fetchTasks,
}
const connector = connect(mapStateToProps, mapDispatch)
type AppProps = ConnectedProps<typeof connector>
const ReduxApp = connector(App)

ReactDOM.render(
  <Provider store={store}>
    <ReduxApp />
  </Provider>,
  document.querySelector('#root'),
)
