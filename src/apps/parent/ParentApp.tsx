// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { LoadingOutlined } from '@ant-design/icons'
import { message } from 'antd'
import WelcomeModal from 'components/common/WelcomeModal'
import { AcademicsPage } from 'components/counseling/AcademicsPage'
import StudentAppPlanPage from 'components/counseling/ApplicationPlan/StudentApplicationPlanPage'
import { CounselingCalendar } from 'components/counseling/CounselingCalendar'
// All modals here they be
import Modals from 'components/counseling/CounselingModalManager'
import { CounselingStudentActivitiesPage } from 'components/counseling/CounselingStudentActivitiesPage'
import StudentRoadmapPage from 'components/counseling/StudentRoadmap/StudentRoadmapPage'
import CounselingStudentParentTaskList from 'components/counseling/TaskList/CounselingStudentParentTaskList'
import ChatApplication from 'components/messages/ChatApplication'
import StudentResources from 'components/resources/StudentResourcesPage'
import SchoolProfilePage from 'components/schools/SchoolProfilePage'
import StudentSchoolList from 'components/schools/StudentSchoolList'
import DisplayResourceList from 'components/student/DisplayResourceList'
import CounselingStudentTutoringModals from 'components/tutoring/CounselingStudentTutoringModals'
import { cwuser_pk, parent_student_pk, user_pk } from 'global'

import {history} from 'App'
import { pick, some } from 'lodash'
import React from 'react'
import ReactDOM from 'react-dom'
import { connect, ConnectedProps, Provider } from 'react-redux'
import { NavLink, Route, Router, Switch } from 'react-router-dom'
import { Platform } from 'store/common/commonTypes'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import { fetchResources } from 'store/resource/resourcesThunks'
import { RootState } from 'store/rootReducer'
import store from 'store/store'
import { setActiveUser, setSelectedStudent } from 'store/user/usersSlice'
import { fetchParent, fetchStudent, fetchTutors } from 'store/user/usersThunks'
import { SetCurrentUserPayload, Student, UserType } from 'store/user/usersTypes'
import 'style/common/global.scss'
import Account from './Account'
import ParentCounselingHome from './ParentCounselingHome'
import ParentHeader from './ParentHeader'
import ParentTaskListPage from './ParentTaskListPage'
import ParentTutoringHome from './ParentTutoringHome'
import styles from './styles/App.scss'
// All modals here they be



/**
 * Component will automatically p
 */
class App extends React.Component<AppProps, {}> {
  state = {
    loading: true,
  }

  async componentDidMount() {
    // note that usePlatformLoad hook is called in parentCounselingDashboard since we can't use the hook here
    // until this component is refactored

    if (!this.props.parent) {
      try {
        const parent = await this.props.fetchParent(cwuser_pk)
        const students = await Promise.all(parent.students.map(s => this.props.fetchStudent(s, Platform.CAP)))
        // We load tutoring details for tutoring students. Don't wait on this since it's not needed to render our
        // home page
        students.forEach(s => {
          if (s.is_cas_student) this.props.fetchStudent(s.pk, Platform.CAS)
        })
        if (some(students, s => s.is_cas_student)) {
          this.props.fetchTutors()
        }
        const student = parent_student_pk ? students.find(s => s.pk === parent_student_pk) : null
        this.props.setSelectedStudent(student || students[students.length - 1])
        this.setState({ loading: false })
      } catch {
        message.warning('Did not load all students')
      }
    }

    const activeUser: SetCurrentUserPayload = {
      cwUserID: cwuser_pk,
      userType: UserType.Parent,
      userID: user_pk,
    }
    this.props.fetchResources({})
    this.props.setActiveUser({ ...activeUser, platform: Platform.CAP })
  }

  localShowModal(modalType: MODALS) {
    if (!this.props.selectedStudent) {
      return
    }
    const data = { modal: modalType, props: { studentID: this.props.selectedStudent.pk } }
    this.props.showModal(data)
  }

  render() {
    const stud = this.props.selectedStudent
    // Menu items for CAP students
    const CAPMenu = (
      <>
        <NavLink exact to="/tasks/">
          Tasks
        </NavLink>
        {!stud?.school_list_finalized && (
          <NavLink exact to="/roadmap/">
            Roadmap
          </NavLink>
        )}
        {stud?.school_list_finalized && (
          <NavLink exact to="/app-plan/">
            App Plan
          </NavLink>
        )}
        <NavLink exact to="/school-list/">
          Colleges
        </NavLink>
        <NavLink exact to="/academics/">
          Academics
        </NavLink>
        <NavLink exact to="/activities/">
          Activities
        </NavLink>
      </>
    )

    const isCounselingStudent = stud?.counseling_student_types_list.length && stud.has_access_to_cap
    // Home component differs depending on which platforms SelectedStudent has access to
    let homeComponent = ParentCounselingHome
    if (stud?.is_cas_student && !isCounselingStudent) {
      homeComponent = ParentTutoringHome
    }

    return (
      <div className="app-container">
        <Router history={History}>
          <ParentHeader />
          {this.state.loading && <LoadingOutlined className={styles.containerLoading} spin />}
          {stud && (
            <div className="app-inner-container">
              <Modals />
              <CounselingStudentTutoringModals />
              <WelcomeModal />
              <div className="app-sidebar">
                <div className="app-sidebar-links">
                  <NavLink exact to="/">
                    Home
                  </NavLink>
                  {isCounselingStudent ? CAPMenu : ''}
                  {stud.has_access_to_cap ? (
                    <NavLink exact to="/calendar/">
                      Calendar
                    </NavLink>
                  ) : (
                    ''
                  )}
                  <NavLink exact to="/resources/">
                    Content
                  </NavLink>
                  {stud.is_cas_student && isCounselingStudent ? (
                    <NavLink exact to="/tutoring/">
                      Tutoring
                    </NavLink>
                  ) : (
                    ''
                  )}
                  <NavLink exact to="/message/">
                    Messages
                  </NavLink>
                </div>
                <img src="/static/cwcommon/sidebar_graphic.png" className="sidebar-graphic" alt="" />
              </div>
              <div className="app-content-outer">
                <div className="app-content-inner">
                  <Switch>
                    <Route path="/" exact component={homeComponent} />
                    <Route path="/roadmap/" exact component={StudentRoadmapPage} />
                    <Route path="/tasks/" exact component={ParentTaskListPage} />
                    <Route path="/app-plan/" exact component={StudentAppPlanPage} />
                    <Route path="/resources/" exact component={StudentResources} />
                    <Route path="/activities/" exact component={CounselingStudentActivitiesPage} />
                    <Route path="/academics/" exact component={AcademicsPage} />
                    <Route path="/school-list/" component={StudentSchoolList} />
                    <Route path="/school/:iped/" component={SchoolProfilePage} />
                    <Route path="/account/" exact component={Account} />
                    <Route path="/resource/:id/" exact component={DisplayResourceList} />
                    <Route path="/message" render={() => <ChatApplication parentID={this.props.parent.pk} />} />
                    <Route path="/calendar/" exact component={CounselingCalendar} />
                    <Route path="/tutoring/" exact component={ParentTutoringHome} />
                  </Switch>
                </div>
              </div>
            </div>
          )}
        </Router>
      </div>
    )
  }
}
const mapStateToProps = (state: RootState) => {
  let associatedStudents: { [pk: number]: Student } = {}
  if (state.user.activeUser?.cwUserID && state.user.activeUser.userType === UserType.Parent) {
    associatedStudents = pick(state.user.students, state.user.parents[state.user.activeUser?.cwUserID]?.students)
  }
  return {
    associatedStudents,
    selectedStudent: state.user.selectedStudent,
    parent: state.user.parents[cwuser_pk],
  }
}

const mapDispatch = {
  setActiveUser,
  setSelectedStudent,
  fetchParent,
  fetchStudent,
  fetchTutors,
  showModal,
  fetchResources,
}
const connector = connect(mapStateToProps, mapDispatch)
type AppProps = ConnectedProps<typeof connector>
const ReduxApp = connector(App)

export default ReduxApp;
