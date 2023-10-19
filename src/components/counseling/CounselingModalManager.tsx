// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

// These are the modals we manage on the counseling platform
import CreateBulletinModal from 'components/bulletin/CreateBulletinModal'
import ViewBulletinModal from 'components/bulletin/ViewBulletinModal'
import { AvailabilityModal } from 'components/common/Availability/AvailabilityModal'
import MinimizedModalManager from 'components/common/MinimizedModalManager'
import { StudentHighSchoolCourseModal } from 'components/common/StudentHighSchoolCourse'
import GoogleCalInstructionsModal from 'components/common/TaskSession/GoogleCalendarInstructionsModal'
import { CounselingCalendarEventModal } from 'components/counseling/CounselingCalendarEventModal'
import { CounselorMeetingModal } from 'components/counseling/CounselorMeeting'
import CounselorMeetingNoteMessageModal from 'components/counselor/CounselorMeetingNoteMessageModal/CounselorMeetingNoteMessageModal'
import { CounselorMeetingNoteModal } from 'components/counselor/CounselorMeetingNoteModal'
import ResourceModal from 'components/resources/ResourceModal'
import VimeoResourceModal from 'components/resources/VimeoResourceModal'
import CreateStudentUniversityDecisionModal from 'components/schools/CreateStudentUniversityDecisionModal'
import SUDNoteModal from 'components/schools/SUDNoteModal'
import { TestResultModal } from 'components/student/TestResultModal'
import SubmitTaskModal from 'components/task/SubmitTaskModal'
import DiagnosticResultModal from 'components/tutoring/DiagnosticResultModal'
import React from 'react'
import { BulkAssignTaskModal } from './BulkAssignTaskModal'
import CounselingFileUploadModal from './CounselingFileUploadModal'
import CounselorMeetingInfoModal from './CounselorMeeting/CounselorMeetingInfoModal'
import CreateEditCounselingTaskModal from './CreateCounselingTaskModal'
import RoadmapModal from './RoadmapModal/RoadmapModal'
import ScheduleCounselorMeetingModal from './ScheduleCounselorMeetingModal'
import TaskTemplateModal from './TaskTemplateModal'
import CounselorTimeEntryModal from './TimeTracking/CounselorTimeEntryModal'

const CounselingModalManager = () => {
  return (
    <>
      <MinimizedModalManager />
      <SUDNoteModal />
      <ResourceModal />
      <SubmitTaskModal />
      <DiagnosticResultModal />
      <CreateEditCounselingTaskModal />
      <BulkAssignTaskModal />
      <CreateStudentUniversityDecisionModal />
      <TestResultModal />
      <CounselorMeetingModal />
      <CounselingFileUploadModal />
      <RoadmapModal />
      <CounselingCalendarEventModal />
      <CounselorMeetingNoteModal />
      <CounselorMeetingNoteMessageModal />
      <CounselorTimeEntryModal />
      <AvailabilityModal />
      <GoogleCalInstructionsModal />
      <CreateBulletinModal />
      <ViewBulletinModal />
      <CounselorMeetingInfoModal />
      <ScheduleCounselorMeetingModal />
      <StudentHighSchoolCourseModal />
      <TaskTemplateModal />
      <VimeoResourceModal />
    </>
  )
}

export default CounselingModalManager
