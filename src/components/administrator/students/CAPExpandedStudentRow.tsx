// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useReduxDispatch } from 'store/store'

import { selectStudent } from 'store/user/usersSelector'
import { fetchTasks } from 'store/task/tasksThunks'
import { fetchCounselorMeetings, fetchRoadmaps, unapplyRoadmap } from 'store/counseling/counselingThunks'
import { Button, Card, Empty, Popconfirm, Tabs } from 'antd'
import { CounselorMeetingTable } from 'components/counseling/CounselorMeeting'
import CounselingStudentParentTaskList from 'components/counseling/TaskList/CounselingStudentParentTaskList'
import StudentSchoolList from 'components/schools/StudentSchoolList'
import StudentAppPlanPage from 'components/counseling/ApplicationPlan/StudentApplicationPlanPage'
import { AcademicsPage } from 'components/counseling/AcademicsPage'
import CounselorNotesAndFilesPage from 'components/counselor/CounselorNotesAndFilesPage'
import Icon, {
  BankFilled,
  BuildFilled,
  CheckCircleFilled,
  ClockCircleFilled,
  CloseCircleOutlined,
  ExperimentFilled,
  SnippetsFilled,
} from '@ant-design/icons'
import { activitiesSVG } from 'img/ActivitiesSVG'
import { CounselingStudentActivitiesPage } from 'components/counseling/CounselingStudentActivitiesPage'
import { fetchStudent } from 'store/user/usersThunks'
import { Platform } from 'store/common/commonTypes'
import Loading from 'components/common/Loading'
import { selectRoadmaps } from 'store/counseling/counselingSelectors'
import CounselingTimePage from 'components/counseling/TimeTracking/CounselingTimePage'
import { UserType } from 'store/user/usersTypes'
import styles from './styles/CAPExpandedStudentRow.scss'

type Props = {
  studentID: number
}
enum Tab {
  TasksAndMeetings = 'tasks-and-meetings',
  Schools = 'schools',
  ApplicationPlan = 'app-plan',
  Academics = 'academics',
  Activities = 'activities',
  NotesAndFiles = 'notes-and-files',
  Hours = 'hours',
}

const { TabPane } = Tabs
const CAPExpandedStudentRow = ({ studentID }: Props) => {
  const student = useSelector(selectStudent(studentID))
  const dispatch = useReduxDispatch()
  const roadmaps = useSelector(selectRoadmaps)
  const [loadingTabs, setLoadingTabs] = useState<Tab[]>([])
  const [loadedTabs, setLoadedTabs] = useState<Tab[]>([])
  const [failedTabs, setFailedTabs] = useState<Tab[]>([])
  const [activeTab, setActiveTab] = useState<Tab>()
  const [loadingStudent, setLoadingStudent] = useState(true)
  const [loadingUnapplyRoadmap, setLoadingUnapplyRoadmap] = useState(false)

  const unapplyAbleRoadmaps = roadmaps.filter(r => (student?.roadmaps ?? []).includes(r.pk) && !r.repeatable)
  const roadmapToUnapply = unapplyAbleRoadmaps ? unapplyAbleRoadmaps[0] : undefined

  // Unapply a roadmap from a student
  const doUnapplyRoadmap = async () => {
    if (roadmapToUnapply) {
      setLoadingUnapplyRoadmap(true)
      await dispatch(unapplyRoadmap({ studentID, roadmapID: roadmapToUnapply.pk }))
      setLoadingUnapplyRoadmap(false)
    }
  }

  // When tab changes, we may need to load some data if it has not already been loaded
  const changeTab = async (newTab: Tab) => {
    setFailedTabs(failedTabs.filter(t => t !== newTab))
    let promise: Promise<any> | null = null

    if (!loadedTabs.includes(newTab)) {
      if (newTab === Tab.TasksAndMeetings) {
        promise = Promise.all([
          dispatch(fetchTasks({ user: student?.user_id })),
          dispatch(fetchCounselorMeetings({ student: studentID })),
        ])
      }
    }

    setActiveTab(newTab)
    if (promise) {
      setLoadingTabs([...loadingTabs, newTab])
      try {
        await promise
        setLoadedTabs([...loadedTabs, newTab])
      } catch {
        setFailedTabs([...failedTabs, newTab])
      } finally {
        setLoadingTabs(loadingTabs.filter(t => t !== newTab))
      }
    }
  }

  // Set tab on load
  useEffect(() => {
    changeTab(Tab.TasksAndMeetings)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Hacky check to see if we've loaded CAP data for student. If not, then we load it.
  const mustLoadStudent = typeof student?.school_count === 'undefined'
  const mustLoadRoadmaps = roadmaps.length === 0
  useEffect(() => {
    if (mustLoadStudent) {
      setLoadingStudent(true)
      dispatch(fetchStudent(studentID, Platform.CAP)).then(() => setLoadingStudent(false))
    } else {
      setLoadingStudent(false)
    }
    if (mustLoadRoadmaps) dispatch(fetchRoadmaps())
  }, [dispatch, mustLoadRoadmaps, mustLoadStudent, studentID])

  return (
    <Card className={styles.CAPExpandedStudentRow}>
      {loadingStudent && (
        <div className="center">
          <Loading />
        </div>
      )}
      {!loadingStudent && (
        <Tabs activeKey={activeTab} onChange={changeTab}>
          <TabPane
            key={Tab.TasksAndMeetings}
            tab={
              <span>
                <CheckCircleFilled />
                Tasks and Meetings
              </span>
            }
          >
            <>
              <div className="wisernet-toolbar">
                {roadmapToUnapply && (
                  <Popconfirm
                    title={`Remove roadmap ${roadmapToUnapply.title}? All incomplete roadmap tasks and future or unscheduled roadmap meetings will be deleted permanently for this student`}
                    onConfirm={doUnapplyRoadmap}
                  >
                    <Button loading={loadingUnapplyRoadmap} size="small" type="default">
                      <CloseCircleOutlined />
                      &nbsp; Remove Roadmap ({roadmapToUnapply.title})
                    </Button>
                  </Popconfirm>
                )}
              </div>
              <div className="flex tasks-and-meetings">
                <div className="tasks-container">
                  <CounselingStudentParentTaskList condensed={true} studentID={studentID} includeAddTask={true} />
                </div>
                <div className="meetings-container">
                  <CounselorMeetingTable
                    showTasks={false}
                    studentID={studentID}
                    showStudentName={false}
                    showToolbar={false}
                    showActions={false}
                  />
                </div>
              </div>
            </>
          </TabPane>
          <TabPane
            key={Tab.Schools}
            tab={
              <span>
                <BankFilled />
                Colleges
              </span>
            }
          >
            <div className="schools-container">
              <StudentSchoolList studentID={studentID} />
            </div>
          </TabPane>
          <TabPane
            key={Tab.ApplicationPlan}
            tab={
              <span>
                <BuildFilled />
                App Plan
              </span>
            }
          >
            <div className="app-plan-container">
              {student?.school_list_finalized && <StudentAppPlanPage studentID={studentID} />}
              {!student?.school_list_finalized && (
                <Empty description={`${student?.first_name}'s school list is not yet finalized`} />
              )}
            </div>
          </TabPane>
          <TabPane
            key={Tab.Academics}
            tab={
              <span>
                <ExperimentFilled />
                Academics
              </span>
            }
          >
            <div className="academics-container">
              <AcademicsPage studentID={studentID} />
            </div>
          </TabPane>
          <TabPane
            key={Tab.Activities}
            tab={
              <span>
                <Icon className="activities-icon" component={activitiesSVG} />
                Activities
              </span>
            }
          >
            <div className="activities-container">
              <CounselingStudentActivitiesPage studentID={studentID} />
            </div>
          </TabPane>
          <TabPane
            key={Tab.NotesAndFiles}
            tab={
              <span>
                <SnippetsFilled />
                Notes and Files
              </span>
            }
          >
            <div className="notes-files-container">
              <CounselorNotesAndFilesPage studentID={studentID} />
            </div>
          </TabPane>
          <TabPane
            key={Tab.Hours}
            tab={
              <span>
                <ClockCircleFilled />
                Counseling Hours
              </span>
            }
          >
            <CounselingTimePage userType={UserType.Administrator} studentID={studentID} />
          </TabPane>
        </Tabs>
      )}
    </Card>
  )
}
export default CAPExpandedStudentRow
