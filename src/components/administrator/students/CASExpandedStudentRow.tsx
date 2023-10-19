// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import {
  BulbOutlined,
  CreditCardOutlined,
  FileTextOutlined,
  FolderOutlined,
  LaptopOutlined,
  NotificationOutlined,
  PlusCircleOutlined,
  ReadOutlined,
  SnippetsOutlined,
  TableOutlined,
} from '@ant-design/icons'
import { Button, Form, message, Modal, Select, Skeleton, Tabs } from 'antd'
import { Store } from 'antd/lib/form/interface'
import { CreateTaskButton, getFullName, handleError, handleSuccess, TaskList } from 'components/administrator'
import styles from 'components/administrator/styles/ExpandedRow.scss'
import InvitationStatus from 'components/administrator/users/InvitationStatus'
import { ActivityLogList } from 'components/common/ActivityLog'
import Loading from 'components/common/Loading'
import { StudentHighSchoolCourseTabbedTable } from 'components/common/StudentHighSchoolCourse/StudentHighSchoolCourseTabbedTable'
import StudentResourcesTable from 'components/resources/StudentResourcesTable'
import { CreateTestResultButton } from 'components/student/CreateTestResultButton'
import StudentCourseListPage from 'components/student/StudentCourseListPage'
import { TestResultTable } from 'components/student/TestResultTable'
import ViewDiagnostics from 'components/student/ViewDiagnostics'
import StudentBasecampDetails from 'components/tutoring/StudentBasecampExportDetails'
import {
  TutoringSessionsContainer,
  TutoringSessionsFilter,
  TutoringSessionsTable,
} from 'components/tutoring/TutoringSessions'
import React, { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Platform } from 'store/common/commonTypes'
import { showModal } from 'store/display/displaySlice'
import { CreateTutoringSessionModalProps, MODALS } from 'store/display/displayTypes'
import { CreateableNotification, createNotification } from 'store/notification/notificationsThunks'
import {
  selectResourceGroups,
  selectResourceGroupsForStudent,
  selectResources,
  selectResourcesForStudent,
} from 'store/resource/resourcesSelectors'
import { fetchResourceGroups, fetchResources } from 'store/resource/resourcesThunks'
import { Resource, ResourceGroup } from 'store/resource/resourcesTypes'
import { useReduxDispatch } from 'store/store'
import { selectTasksForStudent } from 'store/task/tasksSelectors'
import { fetchTasks } from 'store/task/tasksThunks'
import { selectStudent } from 'store/user/usersSelector'
import { fetchStudent, updateStudent } from 'store/user/usersThunks'
import { Student, UserType } from 'store/user/usersTypes'
import ExpandedStudentPackagesHours from './ExpandedStudentPackagesHours'

const { TabPane } = Tabs

type Props = {
  userID: number
  studentID: number
}

type EntityType = 'Resources' | 'ResourceGroups'

/**
 * Component renders a set of Tabs/TabPane components containing
 * further details for student with @param studentID and @param userID (required to fetch tasks)
 */
export const CASExpandedStudentRow = ({ userID, studentID }: Props) => {
  const dispatch = useReduxDispatch()
  const [form] = Form.useForm()
  const [loadingStudent, setLoadingStudent] = useState(true)

  const tasks = useSelector(selectTasksForStudent(studentID))
  const student = useSelector(selectStudent(studentID))
  const accountIsCreated = student?.account_is_created
  const studentWellnessHistory = student?.wellness_history

  const studentResources = useSelector(selectResourcesForStudent(studentID))
  const resourceGroups = useSelector(selectResourceGroupsForStudent(studentID))

  const fullResourceList = useSelector(selectResources)
  const fullResourceGroupList = useSelector(selectResourceGroups)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const fetchTasksCB = useCallback(() => {
    setError(false)
    setLoading(true)
    dispatch(fetchTasks({ user: userID }))
      .catch(err => setError(true))
      .finally(() => setLoading(false))
  }, [userID, dispatch])

  const fetchResourceGroupsCB = useCallback(() => {
    setError(false)
    setLoading(true)
    dispatch(fetchResourceGroups())
      .catch(err => setError(true))
      .finally(() => setLoading(false))
  }, [dispatch])

  const fetchResourcesCB = useCallback(() => {
    setError(false)
    setLoading(true)
    dispatch(fetchResources({ student: studentID }))
      .catch(err => setError(true))
      .finally(() => setLoading(false))
  }, [studentID, dispatch])

  // Hacky check to see if we've loaded CAS data for student. If not, then we load it.
  const mustLoadStudent = typeof student?.courses === 'undefined'
  useEffect(() => {
    fetchTasksCB()
    if (mustLoadStudent) {
      setLoadingStudent(true)
      dispatch(fetchStudent(studentID, Platform.CAS)).then(() => setLoadingStudent(false))
    } else {
      setLoadingStudent(false)
    }
  }, [dispatch, fetchTasksCB, mustLoadStudent, studentID])

  /** For certain tabs, we need to fetch resources */
  const handleTabChange = (activeTab: string) => {
    switch (activeTab) {
      case 'tasks':
        return fetchTasksCB()
      case 'resources':
        return fetchResourcesCB()
      case 'resourceGroups':
        return fetchResourceGroupsCB()
      default:
        return null
    }
  }
  // If error, render nothing. If loading, render Skeleton loader. If no error and not loading, render component
  const renderTaskList = () => {
    if (error) {
      return null
    }
    return loading ? <Skeleton active /> : <TaskList tasks={tasks} />
  }

  const updateResourceView = (values: Store) => {
    setLoading(true)
    let concatList: number[]
    let editStudent: Partial<Student>
    if (values.Resources) {
      concatList = studentResources.map(r => r.pk).concat(values.Resources)

      editStudent = { visible_resources: concatList }
    } else {
      concatList = resourceGroups.map(r => r.pk).concat(values.ResourceGroups)
      editStudent = { visible_resource_groups: concatList }
    }

    dispatch(updateStudent(studentID, editStudent))
      .then(() => {
        if (values.resources) handleSuccess('Resource successfully added')
        else handleSuccess('Resource group successfully added')
        form.resetFields()
      })
      .catch(() => handleError('Update failed'))
      .finally(() => setLoading(false))
  }

  /** User (admin) wants to send student an email inviting them to take a diagnostic*/
  const confirmDiagRegistrationEmail = () => {
    const confirm = () =>
      createNotification(student?.notification_recipient, CreateableNotification.DiagnosticInvite)
        .then(() => message.success('Diagnostic invite sent'))
        .catch(() => message.error('Failed to send diagnostic invite'))

    Modal.confirm({
      title: `Send ${getFullName(student)} an email inviting them to register for a diagnostic?`,
      okText: 'Yup - send the email',
      onOk: confirm,
    })
  }

  const addResourceForm = (entityType: EntityType) => {
    const list: Array<Partial<Resource>> | Array<Partial<ResourceGroup>> =
      entityType === 'Resources'
        ? fullResourceList.filter(res => !studentResources.includes(res))
        : fullResourceGroupList.filter(res => !resourceGroups.includes(res))

    const phrasing = entityType === 'Resources' ? 'resources' : 'resource groups'
    const placeholderText = list.length > 0 ? `Add ${phrasing} for student` : `No available options`

    return (
      <Form layout="inline" form={form} onFinish={updateResourceView}>
        <Form.Item label={`Add ${phrasing}`} name={entityType}>
          <Select mode="multiple" className={styles.selectInput} placeholder={placeholderText}>
            {list.map((res: Resource | ResourceGroup) => {
              return (
                <Select.Option key={res.pk} value={res.pk}>
                  {res.title}
                </Select.Option>
              )
            })}
          </Select>
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Submit
          </Button>
        </Form.Item>
      </Form>
    )
  }

  const renderResourceGroupTable = () => {
    if (error) {
      return null
    }
    return loading ? (
      <Skeleton active />
    ) : (
      <>
        {addResourceForm('ResourceGroups')}
        <StudentResourcesTable allowRemove={true} studentID={studentID} entity="resourceGroups" />
      </>
    )
  }
  const renderResourceTable = () => {
    if (error) {
      return null
    }
    return loading ? (
      <Skeleton active />
    ) : (
      <>
        <div className="resources-toolbar flex">
          {addResourceForm('Resources')}
          <StudentBasecampDetails studentID={studentID} />
        </div>

        <StudentResourcesTable allowRemove={true} studentID={studentID} entity="resources" />
      </>
    )
  }

  /** Display modal to create tutoring session for student associated with this row */
  const showCreateTutoringSessionModal = () => {
    const props: CreateTutoringSessionModalProps = { studentID }
    dispatch(
      showModal({
        modal: MODALS.CREATE_TUTORING_SESSION,
        props,
      }),
    )
  }

  /** Render our filterable table of tutoring sessions and a button to create a new session */
  const renderTutoringSessions = () => {
    return (
      <>
        <div className={styles.actionsContainer}>
          <Button type="primary" onClick={showCreateTutoringSessionModal}>
            <PlusCircleOutlined />
            Create Tutoring Session
          </Button>
        </div>
        <TutoringSessionsFilter tab="list" />
        <TutoringSessionsTable />
        {studentWellnessHistory && (
          <p>
            <strong>Wellness Appointment History:</strong>&nbsp;{studentWellnessHistory}
          </p>
        )}
      </>
    )
  }

  return (
    <div className="expandedRowWrapper">
      {!accountIsCreated && <InvitationStatus userID={studentID} userType={UserType.Student} />}
      {loadingStudent && (
        <div className="center">
          <Loading />
        </div>
      )}
      {!loadingStudent && (
        <Tabs defaultActiveKey="tasks" animated={false} className={styles.tabsContainer} onChange={handleTabChange}>
          <TabPane
            key="tasks"
            tab={
              <span>
                <TableOutlined />
                Tasks
              </span>
            }
          >
            <CreateTaskButton studentID={studentID} />
            {renderTaskList()}
          </TabPane>
          <TabPane
            key="resourceGroups"
            tab={
              <span>
                <FolderOutlined />
                Resource Groups
              </span>
            }
          >
            {renderResourceGroupTable()}
          </TabPane>
          <TabPane
            key="resources"
            tab={
              <span>
                <FileTextOutlined />
                Resources
              </span>
            }
          >
            {renderResourceTable()}
          </TabPane>
          <TabPane
            key="sessions"
            tab={
              <span>
                <ReadOutlined />
                Sessions
              </span>
            }
          >
            <TutoringSessionsContainer isAdminStudentSessionsPage={true} studentID={studentID}>
              {renderTutoringSessions()}
            </TutoringSessionsContainer>
          </TabPane>
          <TabPane
            key="packages"
            tab={
              <span>
                <CreditCardOutlined />
                Packages and Hours
              </span>
            }
          >
            <ExpandedStudentPackagesHours studentID={studentID} />
          </TabPane>
          <TabPane
            key="test_results"
            tab={
              <span>
                <BulbOutlined />
                Test Results
              </span>
            }
          >
            <CreateTestResultButton studentPK={studentID} />
            <TestResultTable studentPK={studentID} />
            <div className={styles.viewDiagnostics}>
              <ViewDiagnostics studentID={studentID} />
            </div>
          </TabPane>
          <TabPane
            key="courseList"
            tab={
              <span>
                <LaptopOutlined />
                Courses
              </span>
            }
          >
            <StudentCourseListPage studentID={studentID} />
          </TabPane>
          <TabPane
            key="courses"
            tab={
              <span>
                <SnippetsOutlined />
                Coursework
              </span>
            }
          >
            <StudentHighSchoolCourseTabbedTable studentID={studentID} />
          </TabPane>
          <TabPane
            key="activityLogs"
            tab={
              <span>
                <NotificationOutlined />
                Activity Logs
              </span>
            }
          >
            <ActivityLogList userPK={userID} />
          </TabPane>
        </Tabs>
      )}
    </div>
  )
}
