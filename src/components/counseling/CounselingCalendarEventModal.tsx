// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Button, Modal, Popconfirm } from 'antd'
import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { updateCounselorMeeting } from 'store/counseling/counselingThunks'
import { CounselorMeeting } from 'store/counseling/counselingTypes'
import { selectActiveModal, selectVisibleModal } from 'store/display/displaySelectors'
import { closeModal } from 'store/display/displaySlice'
import { CounselingCalendarEventProps, MODALS } from 'store/display/displayTypes'
import { useReduxDispatch } from 'store/store'
import { selectIsCounselor, selectIsStudent } from 'store/user/usersSelector'
import moment from 'moment'
import { messageSuccess } from 'components/administrator'

export const CounselingCalendarEventModal = () => {
  const dispatch = useReduxDispatch()
  const visible = useSelector(selectVisibleModal(MODALS.COUNSELING_CALENDAR_EVENT))
  const modalProps = useSelector(selectActiveModal)?.modalProps as CounselingCalendarEventProps
  const isStudent = useSelector(selectIsStudent)
  const isCounselor = useSelector(selectIsCounselor)

  const [cancelling, setCancelling] = useState(false)

  const handleCancel = (pk: number) => {
    setCancelling(true)
    dispatch(updateCounselorMeeting(pk, { cancelled: moment().toISOString() }))
      .then(() => {
        messageSuccess('Meeting canceled')
        dispatch(closeModal())
      })
      .finally(() => setCancelling(false))
  }

  return (
    <Modal
      title={<h3>Meeting: {modalProps?.item?.title}</h3>}
      visible={visible}
      footer={null}
      onCancel={() => dispatch(closeModal())}
      wrapClassName="counseling-calendar-event-modal"
    >
      <h3>Instructions:</h3>
      <br />
      {isStudent && (
        <>
          <div
            //eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: (modalProps?.item as CounselorMeeting)?.student_instructions }}
          />
          {!(modalProps?.item as CounselorMeeting)?.student_instructions && <div>No Meeting Instructions</div>}
        </>
      )}
      {isCounselor && (
        <>
          <div
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: (modalProps?.item as CounselorMeeting)?.counselor_instructions }}
          />
          {!(modalProps?.item as CounselorMeeting)?.counselor_instructions && <div>No Meeting Instructions</div>}
        </>
      )}
      <div className="modal-control">
        {/* Only show cancel button to counselors if meeting is in the future */}
        {isCounselor && moment(modalProps?.item?.start).isAfter() && (
          <Popconfirm
            title="Are you sure you want to cancel this meeting?"
            onConfirm={() => handleCancel(modalProps?.item?.pk)}
          >
            <Button className="modal-btn" danger loading={cancelling}>
              Cancel Meeting
            </Button>
          </Popconfirm>
        )}
        <Button className="modal-btn" type="default" onClick={() => dispatch(closeModal({}))}>
          Close
        </Button>
      </div>
    </Modal>
  )
}
