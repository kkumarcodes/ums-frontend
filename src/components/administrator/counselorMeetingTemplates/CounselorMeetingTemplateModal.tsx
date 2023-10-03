// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Modal } from 'antd'
import React from 'react'
import { useSelector } from 'react-redux'
import { selectVisibleModal, selectVisibleModalProps } from 'store/display/displaySelectors'
import { closeModal } from 'store/display/displaySlice'
import { CreateCounselorMeetingTemplateProps, MODALS } from 'store/display/displayTypes'
import { useReduxDispatch } from 'store/store'
import { CounselorMeetingTemplateForm } from './CounselorMeetingTemplateForm'

export const CounselorMeetingTemplateModal = () => {
  const dispatch = useReduxDispatch()
  const visible = useSelector(selectVisibleModal(MODALS.CREATE_COUNSELOR_MEETING_TEMPLATE))
  const props = useSelector(selectVisibleModalProps(MODALS.CREATE_COUNSELOR_MEETING_TEMPLATE))

  const meetingTemplateID = (props as CreateCounselorMeetingTemplateProps)?.meetingTemplateID
  const headerTitle = meetingTemplateID ? `Edit Counselor Meeting Template` : 'Create Counselor Meeting Template'

  return (
    <Modal
      className="counselorMeetingModal"
      title={headerTitle}
      visible={visible}
      style={{ top: 16 }}
      onCancel={() => dispatch(closeModal())}
      footer={null}
      destroyOnClose
    >
      <CounselorMeetingTemplateForm meetingTemplateID={meetingTemplateID} />
    </Modal>
  )
}

export default CounselorMeetingTemplateModal
