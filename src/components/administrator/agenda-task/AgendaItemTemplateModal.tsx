// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Modal } from 'antd'
import React from 'react'
import { useSelector } from 'react-redux'
import { selectVisibleModal, selectVisibleModalProps } from 'store/display/displaySelectors'
import { closeModal } from 'store/display/displaySlice'
import { AddEditAgendaItemTemplateModalProps, MODALS } from 'store/display/displayTypes'
import { useReduxDispatch } from 'store/store'
import { AgendaItemTemplateForm } from './AgendaItemTemplateForm'

export const AgendaItemTemplateModal = () => {
  const dispatch = useReduxDispatch()
  const visible = useSelector(selectVisibleModal(MODALS.ADD_EDIT_AGENDA_ITEM_TEMPLATE))
  const props = useSelector(selectVisibleModalProps(MODALS.ADD_EDIT_AGENDA_ITEM_TEMPLATE))

  const meetingTemplateID = (props as AddEditAgendaItemTemplateModalProps)?.meetingTemplateID
  const agendaItemTemplateID = (props as AddEditAgendaItemTemplateModalProps)?.agendaItemTemplateID
  const headerTitle = agendaItemTemplateID ? `Edit Agenda Item Template` : 'Add Agenda Item Template'

  return (
    <Modal
      className="agendaItemTemplateModal"
      title={headerTitle}
      visible={visible}
      style={{ top: 16 }}
      onCancel={() => dispatch(closeModal())}
      footer={null}
      destroyOnClose
    >
      <AgendaItemTemplateForm meetingTemplateID={meetingTemplateID} agendaItemTemplateID={agendaItemTemplateID} />
    </Modal>
  )
}

export default AgendaItemTemplateModal
