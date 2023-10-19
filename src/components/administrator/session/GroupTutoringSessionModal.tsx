// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Modal } from 'antd'
import { GroupTutoringSessionForm } from 'components/administrator'
import React from 'react'
import { useSelector } from 'react-redux'
import { selectActiveModal, selectVisibleGroupTutoringSessionModal } from 'store/display/displaySelectors'
import { closeModal } from 'store/display/displaySlice'
import { GroupTutoringSessionModalProps } from 'store/display/displayTypes'
import { useReduxDispatch } from 'store/store'

/**
 * Renders a modal that creates or updates a GroupTutoringSession object,
 * Updates if modalProps contains @param sessionID, otherwise creates
 * Pulls or derives from store:
 * @param visible {boolean} whether or not to show modal
 * @param sessionID {number} extracted from modalProps. If defined, this is an EditModal, otherwise CreateModal
 */
export const GroupTutoringSessionModal = () => {
  const dispatch = useReduxDispatch()
  const visible = useSelector(selectVisibleGroupTutoringSessionModal)
  const props = useSelector(selectActiveModal)?.modalProps

  const sessionID = (props as GroupTutoringSessionModalProps)?.sessionID

  const headerTitle = sessionID ? `Edit Group Tutoring Session` : 'Create Group Tutoring Session'

  return (
    <Modal
      className="sessionModal"
      width="600px"
      title={headerTitle}
      visible={visible}
      style={{ top: 16 }}
      onCancel={() => dispatch(closeModal())}
      footer={null}
      destroyOnClose
    >
      <GroupTutoringSessionForm sessionID={sessionID} />
    </Modal>
  )
}
