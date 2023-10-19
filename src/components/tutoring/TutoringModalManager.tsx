// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

// These are the modals we manage
import { GroupTutoringSessionModal } from 'components/administrator'
import { CreateTutoringPackagePurchaseModal } from 'components/administrator/tutoringPackages/CreateTutoringPackagePurchaseModal'
import { HamburgerMenuModal } from 'components/common/HamburgerMenuModal'
import { StudentHighSchoolCourseModal } from 'components/common/StudentHighSchoolCourse/StudentHighSchoolCourseModal'
import GoogleCalInstructionsModal from 'components/common/TaskSession/GoogleCalendarInstructionsModal'
import { TestResultModal } from 'components/student/TestResultModal'
import CreateTaskModal from 'components/task/CreateTaskModal'
import EditTaskDueDateModal from 'components/task/EditTaskDueDateModal'
import SubmitTaskModal from 'components/task/SubmitTaskModal'
import CreateTutoringSessionModal from 'components/tutoring/CreateTutoringSessionModal/CreateTutoringSessionModal'
import DiagnosticResultModal from 'components/tutoring/DiagnosticResultModal'
import { ResourceModal } from 'components/tutoring/ResourceModal'
import SelfAssignDiagnosticModal from 'components/tutoring/SelfAssignDiagnosticModal'
import { TimeCardModal } from 'components/tutoring/TimeCard'
import React from 'react'
import LateCancelChargeModal from 'components/administrator/session/LateCancelChargeModal'
import MinimizedModalManager from 'components/common/MinimizedModalManager'
import { AvailabilityModal } from 'components/common/Availability/AvailabilityModal'
import LocationModal from './LocatonModal'
import PurchaseTutoringPackageModal from './PurchaseTutoringPackageModal'
import { CourseModal } from '../administrator/course/CourseModal'
import PaygoPurchaseModal from './TutoringSessions/PaygoPurchaseModal'
import DiagnosticRegistrationDetailsModal from '../administrator/diagnosticRegistrations/DiagnosticRegistrationDetailsModal'
import { TutoringSessionNotesModal } from './TutoringSessions/TutoringSessionNotesModal/TutoringSessionNotesModal'

const TutoringModalManager = () => {
  return (
    <>
      <MinimizedModalManager />
      <SubmitTaskModal />
      <DiagnosticResultModal />
      <CreateTaskModal />
      <EditTaskDueDateModal />
      <CreateTutoringSessionModal />
      <SelfAssignDiagnosticModal />
      <GroupTutoringSessionModal />
      <TutoringSessionNotesModal />
      <CreateTutoringPackagePurchaseModal />
      <StudentHighSchoolCourseModal />
      <GoogleCalInstructionsModal />
      <AvailabilityModal />
      <TimeCardModal />
      <ResourceModal />
      <LocationModal />
      <TestResultModal />
      <HamburgerMenuModal />
      <PurchaseTutoringPackageModal />
      <CourseModal />
      <PaygoPurchaseModal />
      <LateCancelChargeModal />
      <DiagnosticRegistrationDetailsModal />
    </>
  )
}

export default TutoringModalManager
