// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import {
  CarryOutOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  SettingOutlined,
  UserSwitchOutlined,
} from '@ant-design/icons'
import { ConfigProvider, Menu } from 'antd'
import enGB from 'antd/lib/locale/en_GB'
import enUS from 'antd/lib/locale/en_US'
import { ClickParam } from 'antd/lib/menu'
import Account from 'apps/counseling/Account'
import ApplicationTrackerPage from 'components/applicationPlan/ApplicationTrackerPage'
import BulletinTable from 'components/bulletin/BulletinTable'
import { AvailabilitySummary } from 'components/common/Availability/AvailabilitySummary'
import Header from 'components/common/Header'
import { AcademicsPage } from 'components/counseling/AcademicsPage'
import Modals from 'components/counseling/CounselingModalManager'
import { CounselingStudentActivitiesPage } from 'components/counseling/CounselingStudentActivitiesPage'
import { StudentApplicationPlanGateway } from 'components/counseling/StudentApplicationPlanGateway'
import CounselingStudentTaskPage from 'components/counseling/TaskList/CounselingStudentParentTaskPage'
import CounselorTimeTrackingPage from 'components/counseling/TimeTracking/CounselorTimeTrackingPage'
import CounselorAllTasksPage from 'components/counselor/CounselorAllTasksPage'
// Each of our page components
import CASStudents from 'components/counselor/CounselorCASStudents'
import CounselorDashboard from 'components/counselor/CounselorDashboard'
import CounselorNotesAndFilesPage from 'components/counselor/CounselorNotesAndFilesPage'
import CounselorSidebar from 'components/counselor/CounselorSidebar'
import CounselorStudentProfile from 'components/counselor/CounselorStudentProfile'
import CounselorStudentSettings from 'components/counselor/CounselorStudentSettings'
import { CounselorStudentSubNav } from 'components/counselor/CounselorStudentSubNav'
import CounselorTaskTemplatesPage from 'components/counselor/CounselorTaskTemplatesPage'
import ChatApplication from 'components/messages/ChatApplication'
import CounselorSchoolList from 'components/schools/CounselorSchoolList'
import SchoolProfilePage from 'components/schools/SchoolProfilePage'
import { cwuser_pk, cwuser_type, user_pk } from 'global'
import usePlatformLoad from 'hooks/usePlatformLoad'

import {history} from 'App'
import moment from 'moment'
import 'moment/locale/en-gb'
import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import { Provider, useSelector } from 'react-redux'
import { NavLink, Route, Router, Switch } from 'react-router-dom'
import { Platform } from 'store/common/commonTypes'
import { fetchCounselorNotes } from 'store/counseling/counselingThunks'
import { fetchResourceGroups, fetchResources } from 'store/resource/resourcesThunks'
import { RootState } from 'store/rootReducer'
import store, { useReduxDispatch } from 'store/store'
import { fetchUniversities } from 'store/university/universityThunks'
import { setActiveUser } from 'store/user/usersSlice'
import { fetchCounselor, fetchParents, fetchStudents, StudentSerializerPlatform } from 'store/user/usersThunks'
import { SetCurrentUserPayload } from 'store/user/usersTypes'
import 'style/common/global.scss'
import 'style/counselor/global.scss'
import { useLocaleCtx } from '../LocaleContext'
import styles from './styles/CounselorApp.scss'

moment.locale('en')



export enum CounselorPlatformPages {
  prompt = 'launch-essays',
  schools = 'school-list',
  appPlan = 'application-plan',
  schoolProfile = 'school',
  studentList = 'student-list',
  message = 'message',
  casStudents = 'cas-students',
  profile = 'profile',
  academics = 'academics',
}

const SIDEBAR_ACTIVE_PATHS = [
  `/school-list/student/:studentID/`,
  '/application-plan/student/:studentID/',
  '/school-list/',
  '/tasks/student/:studentID/',
  '/profile/student/:studentID/',
  '/settings/student/:studentID/',
  '/application-plan/',
  '/school/:iped/student/:studentID',
  '/school/',
  '/notes-and-files/student/:studentID/',
  '/activities/student/:studentID/',
  '/academics/student/:studentID/',
  '/',
]

const localeMap = {
  enGB,
  enUS,
}

const App = () => {
  const dispatch = useReduxDispatch()
  const platformLoad = usePlatformLoad()
  const { locale } = useLocaleCtx()
  const activeCounselor = useSelector((state: RootState) =>
    state.user.activeUser ? state.user.counselors[state.user.activeUser.cwUserID] : null,
  )
  const [loading, setLoading] = useState(true)

  // Load our active tutor. We can assume they're authenticated if they are here
  const activeUser: SetCurrentUserPayload = {
    cwUserID: cwuser_pk,
    userType: cwuser_type,
    userID: user_pk,
  }
  const { cwUserID, userType, userID } = activeUser

  useEffect(() => {
    platformLoad()
    Promise.all([
      dispatch(fetchCounselor(cwUserID)),
      dispatch(fetchStudents({ counselor: cwUserID, platform: StudentSerializerPlatform.Counseling })),
      dispatch(fetchParents()),
      dispatch(setActiveUser({ cwUserID, userType, userID, platform: Platform.CAP })),
      dispatch(fetchCounselorNotes()),
      dispatch(fetchUniversities()),
    ]).then(() => {
      setLoading(false)
      dispatch(fetchResourceGroups())
      dispatch(fetchResources({}))
    })
  }, [dispatch]) // eslint-disable-line react-hooks/exhaustive-deps

  const clickMenu = (menuItem: ClickParam) => {
    if (menuItem.key === 'logout') {
      window.location.href = '/logout'
    } else if (menuItem.key === 'switch-account') {
      window.location.href = `/user/switch-account/administrator/`
    } else {
      History.push(`/${menuItem.key}`)
    }
  }

  if (!activeCounselor) {
    return (
      <div className={`${styles.counselorApp} app-container`}>
        <div className="loading-container">
          <LoadingOutlined spin />
        </div>
      </div>
    )
  }

  // Items that appear in account drop down menu, above logout
  const accountMenuItems = [
    <Menu.Item key="account">
      <SettingOutlined />
      Account
    </Menu.Item>,
    <Menu.Item key="availability">
      <CarryOutOutlined />
      Availability
    </Menu.Item>,
    <Menu.Item key="task-templates">
      <CheckCircleOutlined />
      Task Templates
    </Menu.Item>,
    <Menu.Item key="all-tasks">
      <CheckCircleOutlined />
      All Tasks
    </Menu.Item>,
  ]
  if (activeCounselor.is_admin) {
    accountMenuItems.push(
      <Menu.Item key="switch-account">
        <UserSwitchOutlined />
        Admin
      </Menu.Item>,
    )
  }
  return (
    <ConfigProvider locale={localeMap[locale]}>
      <div className={`${styles.counselorApp} app-container`}>
        <Router history={History}>
          <Header
            avatar={activeCounselor?.profile_picture}
            menuClick={clickMenu}
            accountMenuItems={accountMenuItems}
            alwaysShowMessages={true}
          >
            <div className="counselor-header-nav">
              <NavLink
                to="/"
                isActive={(match, location) => location.pathname === '/' || location.pathname.includes('/student/')}
              >
                Students
              </NavLink>
              <>
                <NavLink to="/application-plan/" exact>
                  Tracker
                </NavLink>
                <NavLink to="/school-list/" exact>
                  Colleges
                </NavLink>
                {activeCounselor?.prompt && (
                  <a target="_blank" rel="noopener" href="/counseling/launch-essays/" className="prompt-link">
                    Prompt
                  </a>
                )}
                <NavLink to="/bulletins/" exact>
                  Announcements
                </NavLink>
                <NavLink to="/time-tracking/" exact>
                  Time Tracking
                </NavLink>
              </>
            </div>
          </Header>
          {activeCounselor && !loading ? (
            <div className="app-inner-container">
              <Modals />
              <div className="app-content-outer">
                <div className="app-content-inner counselor-flexbox">
                  <Route path={SIDEBAR_ACTIVE_PATHS} component={CounselorSidebar} />
                  <div className="counselor-right-content app-white-container">
                    <Route key="student-sub-nav" path={SIDEBAR_ACTIVE_PATHS} component={CounselorStudentSubNav} />

                    <Switch>
                      <Route key="cas-students" path="/cas-students/" exact component={CASStudents} />
                      <Route
                        key="availability"
                        path="/availability"
                        exact
                        render={() => <AvailabilitySummary counselor={cwUserID} />}
                      />
                      <Route
                        key="school-list-student"
                        path="/school-list/student/:studentID/"
                        exact
                        component={CounselorSchoolList}
                      />
                      <Route key="school-list" path="/school-list/" exact component={CounselorSchoolList} />

                      <Route
                        key="school-profile-student"
                        path="/school/:iped/student/:studentID"
                        component={SchoolProfilePage}
                      />
                      <Route
                        key="counselor-student-profile"
                        path="/profile/student/:studentID/"
                        exact
                        component={CounselorStudentProfile}
                      />
                      <Route
                        key="academics-student-student"
                        path="/academics/student/:studentID/"
                        exact
                        component={AcademicsPage}
                      />
                      <Route key="school-profile" exact path="/school/:iped/" component={SchoolProfilePage} />
                      <Route
                        key="application-plan"
                        path="/application-plan/"
                        exact
                        component={ApplicationTrackerPage}
                      />
                      <Route
                        key="application-plan-student"
                        path="/application-plan/student/:studentID/"
                        exact
                        component={StudentApplicationPlanGateway}
                      />
                      <Route
                        key="task-list-student"
                        path="/tasks/student/:studentID/"
                        exact
                        component={CounselingStudentTaskPage}
                      />
                      <Route
                        key="activities-student"
                        path="/activities/student/:studentID/"
                        exact
                        component={CounselingStudentActivitiesPage}
                      />
                      <Route
                        key="settings-student"
                        path="/settings/student/:studentID/"
                        exact
                        component={CounselorStudentSettings}
                      />
                      <Route
                        key="notes-and-files"
                        path="/notes-and-files/student/:studentID/"
                        exact
                        component={CounselorNotesAndFilesPage}
                      />
                      <Route key="bulletins" path="/bulletins" exact component={BulletinTable} />
                      <Route
                        key="message"
                        path="/message"
                        render={() => <ChatApplication counselorID={activeCounselor.pk} />}
                      />
                      <Route key="student-list" path="/" exact component={CounselorDashboard} />
                      <Route path="/account/" component={Account} />
                      <Route
                        path="/time-tracking/"
                        key="time-tracking"
                        exact
                        render={() => <CounselorTimeTrackingPage counselorID={activeCounselor.pk} />}
                      />
                      <Route
                        path="/task-templates"
                        key="task-templates"
                        exact
                        render={() => <CounselorTaskTemplatesPage counselorCWUserID={activeCounselor.user_id} />}
                      />
                      <Route
                        path="/all-tasks"
                        key="all-tasks"
                        exact
                        render={() => <CounselorAllTasksPage counselorID={activeCounselor.pk} />}
                      />
                    </Switch>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="loading-container">
              <LoadingOutlined spin />
            </div>
          )}
        </Router>
      </div>
    </ConfigProvider>
  )
}

export default App;
