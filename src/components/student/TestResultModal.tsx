// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React from 'react'
import { Modal } from 'antd'
import { useReduxDispatch } from 'store/store'
import { closeModal } from 'store/display/displaySlice'
import { useSelector } from 'react-redux'
import { selectVisibleTestResultModal, selectActiveModal } from 'store/display/displaySelectors'
import { TestResultForm } from 'components/student/TestResultForm'
import { TestResultModalProps } from 'store/display/displayTypes'

type Props = {
  wrapperCN?: string
}
export const TestResultModal = ({ wrapperCN }: Props) => {
  const dispatch = useReduxDispatch()

  const visible = useSelector(selectVisibleTestResultModal)
  const props = useSelector(selectActiveModal)?.modalProps as TestResultModalProps

  return (
    <div className={wrapperCN}>
      <Modal
        wrapClassName="containerModal"
        title={props?.pk ? 'Edit Test Score' : 'Create Test Score'}
        visible={visible}
        onCancel={() => dispatch(closeModal())}
        footer={false}
        destroyOnClose
      >
        <TestResultForm testResultPK={props?.pk} student={props?.student} />
      </Modal>
    </div>
  )
}
