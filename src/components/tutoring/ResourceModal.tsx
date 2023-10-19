// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import Modal from 'antd/lib/modal/Modal'
import { ResourceForm } from 'components/tutoring/ResourceForm'
import React from 'react'
import { useSelector } from 'react-redux'
import { selectActiveModal, selectVisibleModal } from 'store/display/displaySelectors'
import { closeModal } from 'store/display/displaySlice'
import { CreateResourceModalProps, EditResourceModalProps, MODALS } from 'store/display/displayTypes'
import { RootState } from 'store/rootReducer'
import { useReduxDispatch } from 'store/store'

const titleMap = {
  resources: 'Resource',
  resourceGroups: 'Resource Group',
}

export const ResourceModal = () => {
  const modal = useSelector(selectActiveModal)
  const modalProps = modal?.modalProps

  const visible = useSelector(selectVisibleModal([MODALS.CREATE_RESOURCE, MODALS.EDIT_RESOURCE]))
  const entityType = (modalProps as CreateResourceModalProps)?.type
  const id = (modalProps as EditResourceModalProps)?.id
  const student =
    modal?.modalType === MODALS.CREATE_RESOURCE ? (modalProps as CreateResourceModalProps).student : undefined
  const entity = useSelector((state: RootState) =>
    modal?.modalType === MODALS.EDIT_RESOURCE
      ? state.resource[entityType][(modalProps as EditResourceModalProps).id]
      : null,
  )

  const isResource = entityType === 'resources'
  const headerTitle = entity ? `Edit ${titleMap[entityType]}` : `Add ${titleMap[entityType]}`

  const dispatch = useReduxDispatch()

  return (
    <Modal
      className="resourceModal"
      style={{ top: 16 }}
      title={headerTitle}
      visible={visible}
      onCancel={() => dispatch(closeModal())}
      destroyOnClose
      footer={null}
      okText={`Create ${isResource ? 'Resource' : 'Resource Group'}`}
    >
      <ResourceForm studentID={student} id={id} isResource={isResource} entity={entity} />
    </Modal>
  )
}
