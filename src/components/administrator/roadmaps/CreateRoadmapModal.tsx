// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Modal } from 'antd'
import React from 'react'
import { useSelector } from 'react-redux'
import { selectVisibleModal, selectVisibleModalProps } from 'store/display/displaySelectors'
import { closeModal } from 'store/display/displaySlice'
import { CreateRoadmapsProps, MODALS } from 'store/display/displayTypes'
import { useReduxDispatch } from 'store/store'
import { RoadmapForm } from './RoadmapForm'

// visible {boolean} whether or not to show modal
// sessionID {number} extracted from modalProps. If defined, this is an EditModal, otherwise CreateModal

export const CreateRoadmapModal = () => {
  const dispatch = useReduxDispatch()
  const visible = useSelector(selectVisibleModal(MODALS.CREATE_ROADMAP))
  const props = useSelector(selectVisibleModalProps(MODALS.CREATE_ROADMAP))

  const roadmapID = (props as CreateRoadmapsProps)?.roadmapID
  const headerTitle = roadmapID ? `Edit Roadmap` : 'Create Roadmap'

  return (
    <Modal
      className="roadmapModal"
      title={headerTitle}
      visible={visible}
      style={{ top: 16 }}
      onCancel={() => dispatch(closeModal())}
      footer={null}
      destroyOnClose
    >
      <RoadmapForm roadmapID={roadmapID} />
    </Modal>
  )
}

export default CreateRoadmapModal
