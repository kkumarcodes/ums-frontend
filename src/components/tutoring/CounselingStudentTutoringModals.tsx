// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { CreateTutoringPackagePurchaseModal } from 'components/administrator'
import { CourseModal } from 'components/administrator/course/CourseModal'
import { HamburgerMenuModal } from 'components/common/HamburgerMenuModal'
import React from 'react'
import CreateTutoringSessionModal from './CreateTutoringSessionModal/CreateTutoringSessionModal'
import PurchaseTutoringPackageModal from './PurchaseTutoringPackageModal'
import PaygoPurchaseModal from './TutoringSessions/PaygoPurchaseModal'
import { TutoringSessionNotesModal } from './TutoringSessions/TutoringSessionNotesModal/TutoringSessionNotesModal'

const CounselingStudentTutoringModals = () => {
  return (
    <>
      <CreateTutoringPackagePurchaseModal />
      <TutoringSessionNotesModal />
      <HamburgerMenuModal />
      <PurchaseTutoringPackageModal />
      <CourseModal />
      <PaygoPurchaseModal />
      <CreateTutoringSessionModal />
    </>
  )
}
export default CounselingStudentTutoringModals
