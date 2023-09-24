// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { SettingOutlined, UserSwitchOutlined } from '@ant-design/icons'
import { Menu, message } from 'antd'
import { ClickParam } from 'antd/lib/menu'
import {
  ChatConversationAdminPage,
  DiagnosticResultsKanban,
  EditCounselorForm,
  EditParentForm,
  EditStudentForm,
  EditTutorForm,
  GroupTutoringSessionPage,
  LocationPage,
  NavBar,
  ResourcePage,
  StudentTutoringSessionPage,
  DiagnosticRegistrationsPage,
  TutoringPackageList,
  UserPage,
  ReportTutoringPackagePurchase,
  ReportTutor,
  ReportLastSession,
} from 'components/administrator'
import { RoadmapTable } from 'components/administrator/roadmaps/RoadmapTable'
import AddCourse from 'components/administrator/course/AddCourse'
import { CoursePage } from 'components/administrator/course/CoursePage'
import OperationsCalendar from 'components/administrator/operations/OperationsCalendarContainer'
import StudentTable from 'components/administrator/students/StudentTable'
import BulletinTable from 'components/bulletin/BulletinTable'
import CreateBulletinModal from 'components/bulletin/CreateBulletinModal'
import { ActivityLogList } from 'components/common/ActivityLog'
import Header from 'components/common/Header'
import Loading from 'components/common/Loading'
import CounselingFileUploadModal from 'components/counseling/CounselingFileUploadModal'
import { CounselorMeetingModal } from 'components/counseling/CounselorMeeting'
import CreateEditCounselingTaskModal from 'components/counseling/CreateCounselingTaskModal'
import RoadmapModal from 'components/counseling/RoadmapModal/RoadmapModal'
import CreateRoadmapModal from 'components/administrator/roadmaps/CreateRoadmapModal'
import CounselorTimeCardPage from 'components/counseling/TimeTracking/CounselorTimeCardPage'
import CounselorTimeEntryModal from 'components/counseling/TimeTracking/CounselorTimeEntryModal'
import CounselingTimePage from 'components/counseling/TimeTracking/CounselingTimePage'
import CreateCounselorTimeCardModal from 'components/counseling/TimeTracking/CreateCounselorTimeCardModal'
import CounselorMeetingNoteMessageModal from 'components/counselor/CounselorMeetingNoteMessageModal/CounselorMeetingNoteMessageModal'
import { CounselorMeetingNoteModal } from 'components/counselor/CounselorMeetingNoteModal'
import CreateStudentUniversityDecisionModal from 'components/schools/CreateStudentUniversityDecisionModal'
import SUDNoteModal from 'components/schools/SUDNoteModal'
import { TimeCardPage } from 'components/tutoring/TimeCard'
import Modals from 'components/tutoring/TutoringModalManager'
import { TutoringSessionsContainer } from 'components/tutoring/TutoringSessions'

import { history } from 'App'
import { startCase } from 'lodash'
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Route, Router, Switch } from 'react-router-dom'
import { fetchResourceGroups, fetchResources } from 'store/resource/resourcesThunks'
import { RootState } from 'store/rootReducer'
import { fetchCourses, fetchLocations } from 'store/tutoring/tutoringThunks'
import { selectCWUserID } from 'store/user/usersSelector'
import { setActiveUser } from 'store/user/usersSlice'
import { fetchAdministrators, fetchCounselors, fetchParents, fetchStudents, fetchTutors } from 'store/user/usersThunks'
import { SetCurrentUserPayload, UserType } from 'store/user/usersTypes'

import CounselorMeetingTemplateTable from 'components/administrator/counselorMeetingTemplates/CounselorMeetingTemplateTable'
import TaskTemplateTable from 'components/administrator/taskTemplates/TaskTemplateTable'
import CounselorMeetingTemplateModal from 'components/administrator/counselorMeetingTemplates/CounselorMeetingTemplateModal'
import AgendaItemTemplateModal from 'components/administrator/agenda-task/AgendaItemTemplateModal'
import TaskTemplateModal from 'components/counseling/TaskTemplateModal'
import VimeoResourceModal from 'components/resources/VimeoResourceModal'
import CounselingHoursGrantModal from 'components/counseling/TimeTracking/CounselingHoursGrantModal'
import Home from './Home'
import Account from './Account'



/**
 * Admin Platform. Component displays main nav header and controls routing of the main component
 */
const App = () => {
  const cwuser_pk = localStorage.getItem('cwuser_pk')
  const cwuser_type = localStorage.getItem('cwuser_type')
  const user_pk = localStorage.getItem('user_pk')
  const activeUser: SetCurrentUserPayload = {
    cwUserID: cwuser_pk,
    userType: cwuser_type,
    userID: user_pk,
  }

  const dispatch = useDispatch()
  const [loading, setLoading] = useState(true)

  const adminID = useSelector(selectCWUserID)
  const administrator = useSelector((state: RootState) => (adminID ? state.user.administrators[adminID] : null))

  useEffect(() => {
    // We don't really care when these finish loading
    function secondPhaseLoading() {
      dispatch(fetchResourceGroups())
      dispatch(fetchResources({}))
      dispatch(fetchAdministrators())
      dispatch(fetchCourses())
    }
    // setLoading(true)
    Promise.all([
      dispatch(setActiveUser(activeUser)),
      dispatch(fetchStudents({ condensed: true })),
      dispatch(fetchTutors()),
      dispatch(fetchCounselors()),
      dispatch(fetchParents()),
      dispatch(fetchLocations()),
    ])
      .then(() => {
        secondPhaseLoading()
        // Route based on payload
        // TODO: Make this more extensible
        if (window.location.search) {
          const params = new URLSearchParams(window.location.search)
          if (params.has('student')) {
            history.push('/user/platform/administrator/students')
          }
        }
      })
      .catch(() => {
        message.error('Failed to load all data')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [dispatch]) // eslint-disable-line react-hooks/exhaustive-deps

  let linked_account_type: UserType | null = null
  if (administrator?.is_counselor) {
    linked_account_type = UserType.Counselor
  } else if (administrator?.is_tutor) {
    linked_account_type = UserType.Tutor
  }
  const clickMenu = (menuItem: ClickParam) => {
    if (menuItem.key === 'logout') {
      window.location.href = '/logout'
    } else if (menuItem.key === 'switch-account' && linked_account_type) {
      window.location.href = `/user/switch-account/${linked_account_type}/`
    }
    history.push(`/${menuItem.key}`)
  }

  const accountMenuItems = [
    <Menu.Item key="account">
      <SettingOutlined />
      Account
    </Menu.Item>,
  ]
  if (linked_account_type) {
    accountMenuItems.push(
      <Menu.Item key="switch-account">
        <UserSwitchOutlined />
        {startCase(linked_account_type)}
      </Menu.Item>,
    )
  }

  return (
    <div className="app-container">
      {!loading && (
        <>
          <Modals />
          <CounselorTimeEntryModal />
          <CreateCounselorTimeCardModal />
          <CounselorMeetingNoteModal />
          <CounselorMeetingNoteMessageModal />
          <CreateEditCounselingTaskModal />
          <CounselorMeetingModal />
          <CounselingFileUploadModal />
          <RoadmapModal />
          <CreateRoadmapModal />
          <AgendaItemTemplateModal />
          <CounselorMeetingTemplateModal />
          <CreateBulletinModal />
          <CreateStudentUniversityDecisionModal />
          <SUDNoteModal />
          <TaskTemplateModal />
          <VimeoResourceModal />
          <CounselingHoursGrantModal />
        </>
      )}
      <Header accountMenuItems={accountMenuItems} menuClick={clickMenu}>
        <NavBar
          showCAPControls={Boolean(administrator?.is_cap_administrator)}
          showCASControls={Boolean(administrator?.is_cas_administrator)}
        />
      </Header>
      <div className="app-inner-container">
        <div className="app-content-outer">
          <main className="app-content-inner app-white-container">
            {loading && (
              <div className="loading-container center">
                <Loading message="Loading data..." />
              </div>
            )}
            {!loading && (
              <Switch>
                <Route path="/user/platform/administrator/" exact component={Home} />
                <Route path="/user/platform/administrator/account/" component={Account} />
                <Route path="/user/platform/administrator/counselors/:id" component={EditCounselorForm} />
                <Route path="/user/platform/administrator/parents/:id" component={EditParentForm} />
                <Route path="/user/platform/administrator/students/:id" component={EditStudentForm} />
                <Route path="/user/platform/administrator/tutors/:id" component={EditTutorForm} />
                <Route path="/user/platform/administrator/counselors/" render={() => <UserPage userType={UserType.Counselor} />} />
                <Route path="/user/platform/administrator/parents/" render={() => <UserPage userType={UserType.Parent} />} />
                <Route path="/user/platform/administrator/students/" component={StudentTable} />
                <Route path="/user/platform/administrator/tutors/" render={() => <UserPage userType={UserType.Tutor} />} />
                <Route path="/user/platform/administrator/locations/" component={LocationPage} />
                <Route
                  path="/user/platform/administrator/student-tutoring-sessions/"
                  render={() => (
                    <TutoringSessionsContainer isAdminSTSPage={true}>
                      <StudentTutoringSessionPage />
                    </TutoringSessionsContainer>
                  )}
                />
                <Route path="/user/platform/administrator/group-tutoring-sessions/" component={GroupTutoringSessionPage} />
                <Route path="/user/platform/administrator/resource-groups/" render={() => <ResourcePage entityType="resourceGroups" />} />
                <Route path="/user/platform/administrator/resources/" render={() => <ResourcePage entityType="resources" />} />
                <Route path="/user/platform/administrator/diagnostics-and-recommendations/" component={DiagnosticResultsKanban} />
                <Route path="/user/platform/administrator/diagnostic-registrations/" component={DiagnosticRegistrationsPage} />
                <Route path="/user/platform/administrator/tutoring-packages/" component={TutoringPackageList} />
                <Route path="/user/platform/administrator/chat-conversations/" component={ChatConversationAdminPage} />
                <Route path="/user/platform/administrator/announcements/" component={BulletinTable} />
                <Route path="/user/platform/administrator/time-cards/" render={() => <TimeCardPage adminID={adminID} />} />
                <Route path="/user/platform/administrator/courses/add/" render={() => <AddCourse />} />
                <Route path="/user/platform/administrator/courses/" render={() => <CoursePage />} />
                <Route path="/user/platform/administrator/calendar/" render={() => <OperationsCalendar />} />
                <Route path="/user/platform/administrator/report/tutoring-package-purchase/" render={() => <ReportTutoringPackagePurchase />} />
                <Route path="/user/platform/administrator/report/tutor/" render={() => <ReportTutor />} />
                <Route path="/user/platform/administrator/report/system-logs/" render={() => <ActivityLogList systemLogs={true} />} />
                <Route path="/user/platform/administrator/report/last-meeting/" render={() => <ReportLastSession />} />
                <Route
                  path="/user/platform/administrator/counseling/time-entries/"
                  render={() => <CounselingTimePage userType={UserType.Administrator} />}
                />
                <Route path="/user/platform/administrator/counseling/counselor-time-cards/" component={CounselorTimeCardPage} />
                <Route path="/user/platform/administrator/counseling/roadmaps/" component={RoadmapTable} />
                <Route path="/user/platform/administrator/counseling/meeting-templates/" component={CounselorMeetingTemplateTable} />
                <Route path="/user/platform/administrator/counseling/task-templates/" component={TaskTemplateTable} />
              </Switch>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
export default App;
