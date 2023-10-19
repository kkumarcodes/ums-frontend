// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { CheckCircleFilled, EditOutlined, StopOutlined } from '@ant-design/icons'
import { Button, Modal, Row, Skeleton, Tag } from 'antd'
import {
  AddUserForm,
  EditParentForm,
  EditStudentForm,
  getFullName,
  handleError,
  renderLocationDetails,
} from 'components/administrator'
import InvitationStatus from 'components/administrator/users/InvitationStatus'
import { TestResultPage } from 'components/student/TestResultPage'
import { useShallowSelector } from 'libs'
import React, { ChangeEvent, KeyboardEvent, MouseEvent, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Platform } from 'store/common/commonTypes'
import { fetchNotificationRecipient } from 'store/notification/notificationsThunks'
import { RootState } from 'store/rootReducer'
import { useReduxDispatch } from 'store/store'
import { selectIsCounselor, selectParent, selectStudent } from 'store/user/usersSelector'
import { fetchParent, updateStudent, fetchStudent, BackendStudent } from 'store/user/usersThunks'
import { Student, UserType } from 'store/user/usersTypes'
import StudentBasecampDetails from '../tutoring/StudentBasecampExportDetails'
import { ActivityLogList } from './ActivityLog'
import { EditableText } from './FormItems'
import { StudentHighSchoolCourseTabbedTable } from './StudentHighSchoolCourse/StudentHighSchoolCourseTabbedTable'
import styles from './styles/StudentProfile.scss'
import WisernetSection, { WisernetSectionContrast } from './UI/WisernetSection'

type Props = {
  studentID: number
  hideCoursework?: boolean
  hideTestResults?: boolean
  showActivityLog?: boolean
  allowEdit?: boolean
}

const headStyle: React.CSSProperties = { fontWeight: 'bold' }

export const StudentProfile = ({
  studentID,
  hideCoursework,
  hideTestResults,
  allowEdit,
  showActivityLog = false,
}: Props) => {
  const dispatch = useReduxDispatch()

  const student = useSelector(selectStudent(studentID)) as Student
  const notification = useShallowSelector((state: RootState) => state.notification)
  const parent = useSelector(selectParent(student.parent))
  const isCounselor = useSelector(selectIsCounselor)

  const [isLoading, setLoading] = useState(false)
  // State variables associated with: accommodations field
  const [accommodationsText, setAccommodationsText] = useState(student.accommodations || '')
  // State vairables associated with: admin_note field
  const [noteText, setNoteText] = useState(student.admin_note || '')
  const [isSavingNote, setSavingNote] = useState(false)
  const [showUpdateStudentModal, setShowUpdateStudentModal] = useState(false)
  const [showUpdateParentModal, setShowUpdateParentModal] = useState(false)
  const [CASStudent, setCASStudent] = useState<BackendStudent>()

  const [phoneNumber, setPhoneNumber] = useState(
    notification.notificationRecipients[student.notification_recipient]?.phone_number,
  )
  const studentAccommodations = student.accommodations

  useEffect(() => {
    setAccommodationsText(studentAccommodations || '')
  }, [studentAccommodations, studentID])

  useEffect(() => {
    dispatch(fetchStudent(studentID, Platform.CAS)).then(stu => {
      setCASStudent(stu)
    })
  }, [dispatch, studentID])

  useEffect(() => {
    setNoteText(student.admin_note || '')
  }, [student.admin_note])

  const notificationRecipientID = student.notification_recipient
  const parentID = student.parent

  useEffect(() => {
    setLoading(true)
    const promises: Array<Promise<any>> = []
    if (notificationRecipientID) {
      promises.push(dispatch(fetchNotificationRecipient(notificationRecipientID)))
    }
    if (parentID) {
      promises.push(dispatch(fetchParent(parentID)))
    }

    Promise.all(promises)
      .then(data => {
        const studentNotificationRecipient = data[0]
        setPhoneNumber(studentNotificationRecipient?.phone_number)
      })
      .catch(err => {
        handleError('Failed to fetch data')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [dispatch, notificationRecipientID, parentID])

  const handleEdit = (e?: KeyboardEvent | MouseEvent) => {
    dispatch(updateStudent(student.pk, { accommodations: accommodationsText })).catch(err =>
      handleError('Failed to update.'),
    )
  }

  const handleEditNote = (newNote: string) => {
    setSavingNote(true)
    dispatch(updateStudent(student.pk, { admin_note: newNote }))
      .catch(err => handleError('Failed to update.'))
      .finally(() => setSavingNote(false))
  }
  return (
    <div className={styles.StudentProfile}>
      {allowEdit && (
        <>
          <Modal
            className={styles.updateProfileModal}
            footer={null}
            onCancel={() => setShowUpdateStudentModal(false)}
            visible={showUpdateStudentModal}
          >
            <EditStudentForm
              inModal={true}
              studentID={studentID}
              onCancel={() => setShowUpdateStudentModal(false)}
              onSubmit={() => setShowUpdateStudentModal(false)}
            />
          </Modal>
          <Modal
            className={styles.updateProfileModal}
            footer={null}
            onCancel={() => setShowUpdateParentModal(false)}
            visible={showUpdateParentModal}
          >
            {student.parent && (
              <EditParentForm
                inModal={true}
                parentID={student.parent}
                onCancel={() => setShowUpdateParentModal(false)}
                onSubmit={() => setShowUpdateParentModal(false)}
              />
            )}
          </Modal>
        </>
      )}
      {isLoading && <Skeleton />}
      <section>
        {!isLoading && (
          <>
            {!student.account_is_created && (
              <WisernetSection contrast={WisernetSectionContrast.Low} title="Account Status">
                <InvitationStatus userID={studentID} userType={UserType.Student} />
              </WisernetSection>
            )}
            <Row justify="space-between">
              <div
                style={{
                  flex: '0 1 48%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <WisernetSection contrast={WisernetSectionContrast.Low} title="Student Details">
                  {allowEdit && (
                    <div className="right edit-student-details">
                      <Button type="primary" onClick={() => setShowUpdateStudentModal(true)}>
                        <EditOutlined />
                        Edit Student Details
                      </Button>
                    </div>
                  )}
                  {isCounselor && (
                    <>
                      <p>
                        {student.has_access_to_cap && (
                          <span>
                            <CheckCircleFilled />
                            &nbsp;Has access to counseling platform
                          </span>
                        )}
                        {!student.has_access_to_cap && (
                          <span>
                            <StopOutlined />
                            &nbsp;No access to counseling platform
                          </span>
                        )}
                      </p>
                      <p>
                        {student.is_prompt_active && (
                          <span>
                            <CheckCircleFilled />
                            &nbsp;Has access to Prompt
                          </span>
                        )}
                        {!student.is_prompt_active && (
                          <span>
                            <StopOutlined />
                            &nbsp;No access to Prompt
                          </span>
                        )}
                      </p>
                    </>
                  )}
                  <p>
                    <strong>Name:</strong>
                    <span>&nbsp;&nbsp;{getFullName(student)}</span>
                  </p>
                  <p>
                    <strong>Pronouns:</strong>
                    <span>&nbsp;&nbsp;{student.pronouns || 'Preferred pronouns not specified'}</span>
                  </p>
                  <p>
                    <strong>Email:</strong>
                    <a href={`mailto:${student.email}`}>&nbsp;&nbsp;{student.email}</a>
                  </p>
                  <p>
                    <strong>Phone Number:</strong>
                    <span>&nbsp;&nbsp;{phoneNumber}</span>
                  </p>
                  <div>
                    <strong>Address:</strong>
                    <span>&nbsp;&nbsp;{renderLocationDetails(student)}</span>
                  </div>
                  <p>
                    <strong>Current High School:</strong>
                    <span>&nbsp;&nbsp;{student.high_school}</span>
                  </p>
                  <p>
                    <strong>Previous Schools:</strong>
                    <span>
                      &nbsp;&nbsp;
                      {student.high_schools.map((prevHS, idx) =>
                        idx !== student.high_schools.length - 1 ? `${prevHS}, ` : prevHS,
                      )}
                    </span>
                  </p>
                  <p>
                    <strong>Graduation Year:</strong>
                    <span>&nbsp;&nbsp;{student.graduation_year}</span>
                  </p>
                  <p>
                    <strong>Tags:</strong>
                    <span>
                      &nbsp;&nbsp;
                      {student.tags.length > 0
                        ? student.tags.map(tagString => {
                            return <Tag>{tagString}</Tag>
                          })
                        : 'No existing tags'}
                    </span>
                  </p>
                  <p>
                    <strong>Time Zone:</strong>
                    <span>&nbsp;&nbsp;{student.set_timezone}</span>
                  </p>
                  <p>
                    <strong>Counselor:</strong>
                    <span>&nbsp;&nbsp;{student.counselor_name}</span>
                  </p>
                  <p>
                    <strong>Wellness Appointment History:</strong>
                    <span>&nbsp;&nbsp;{student.wellness_history}</span>
                  </p>
                  <hr />
                  <StudentBasecampDetails studentID={studentID} />
                </WisernetSection>
                {parent && (
                  <WisernetSection contrast={WisernetSectionContrast.Low} title="Parent Details" headStyle={headStyle}>
                    {allowEdit && (
                      <div className="right edit-student-details">
                        <Button type="primary" onClick={() => setShowUpdateParentModal(true)}>
                          <EditOutlined />
                          Edit Parent Details
                        </Button>
                      </div>
                    )}
                    {!parent?.account_is_created && <InvitationStatus userID={parent?.pk} userType={UserType.Parent} />}
                    <p>
                      <strong>Parent Name:</strong>
                      <span>&nbsp;&nbsp;{getFullName(parent)}</span>
                    </p>
                    <p>
                      <strong>Parent Email:</strong>
                      <span>&nbsp;&nbsp;{parent?.email}</span>
                    </p>
                    <p>
                      <strong>Parent Phone:</strong>
                      <span>&nbsp;&nbsp;{parent?.phone_number}</span>
                    </p>
                    <p>
                      <strong>Second Parent Name:</strong>
                      <span>
                        &nbsp;&nbsp;{parent?.secondary_parent_first_name}&nbsp;{parent?.secondary_parent_last_name}
                      </span>
                    </p>
                    <p>
                      <strong>Second Parent Email (CC Email):</strong>
                      <span>&nbsp;&nbsp;{parent?.cc_email}</span>
                    </p>
                    <p>
                      <strong>Second Parent Phone:</strong>
                      <span>&nbsp;&nbsp;{parent?.secondary_parent_phone_number}</span>
                    </p>
                  </WisernetSection>
                )}
                {!parent && (
                  <WisernetSection contrast={WisernetSectionContrast.Low} title="Parent Details">
                    <p>No parent account has been created.</p>
                    <AddUserForm userType={UserType.Parent} studentForParent={student.pk} />
                  </WisernetSection>
                )}
              </div>

              <div
                style={{
                  flex: '0 1 48%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <WisernetSection contrast={WisernetSectionContrast.Low} title="Student Hours">
                  {CASStudent && (
                    <>
                      <p>
                        <strong>Individual Test Prep:</strong>
                        <br />
                        <span>
                          &nbsp;&nbsp; <strong>Remaining:</strong> {CASStudent.individual_test_prep_hours} hours
                        </span>
                        <span>
                          &nbsp;&nbsp; <strong>Total:</strong> {CASStudent.total_individual_test_prep_hours} hours
                        </span>
                      </p>
                      <p>
                        <strong>Group Test Prep:</strong>
                        <br />
                        <span>
                          &nbsp;&nbsp; <strong>Remaining:</strong> {CASStudent.group_test_prep_hours} hours
                        </span>
                        <span>
                          &nbsp;&nbsp; <strong>Total:</strong> {CASStudent.total_group_test_prep_hours} hours
                        </span>
                      </p>
                      <p>
                        <strong>Individual Curriculum:</strong>
                        <br />
                        <span>
                          &nbsp;&nbsp; <strong>Remaining:</strong> {CASStudent.individual_curriculum_hours} hours
                        </span>
                        <span>
                          &nbsp;&nbsp; <strong>Total:</strong> {CASStudent.total_individual_curriculum_hours} hours
                        </span>
                      </p>
                    </>
                  )}
                </WisernetSection>

                <WisernetSection contrast={WisernetSectionContrast.Low} title="Student Note">
                  <EditableText
                    isFormItem={false}
                    name="privateStudentNote"
                    value={noteText}
                    onUpdate={handleEditNote}
                  />
                  <hr />
                  <p className="help">
                    This note is shared between you and the Collegewise admin/ops team. This note is not visible
                    to&nbsp;
                    {getFullName(student)}.
                  </p>
                </WisernetSection>
                <WisernetSection contrast={WisernetSectionContrast.Low} title="Accomodations">
                  <EditableText
                    onUpdate={v => {
                      setAccommodationsText(v)
                      handleEdit()
                    }}
                    name="accommodations"
                    isFormItem={false}
                    value={accommodationsText}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setAccommodationsText(e.target.value)}
                  />
                </WisernetSection>
              </div>
            </Row>
          </>
        )}
        {!hideCoursework && (
          <WisernetSection contrast={WisernetSectionContrast.Low} title="Coursework">
            <StudentHighSchoolCourseTabbedTable studentID={studentID} />
          </WisernetSection>
        )}
        {!hideTestResults && (
          <WisernetSection contrast={WisernetSectionContrast.Low} title="Test Results">
            <TestResultPage student={studentID} />
          </WisernetSection>
        )}
        {showActivityLog && (
          <WisernetSection contrast={WisernetSectionContrast.Low} title="Activity Log">
            <p className="help">
              Note that the &quot;Unread Messages&quot; notification is an email sent to students informing them that
              they have unread messages in UMS. Individual messages sent to students via the Messaging module do
              not appear here.
            </p>
            <ActivityLogList userPK={student.user_id} />
          </WisernetSection>
        )}
      </section>
    </div>
  )
}
