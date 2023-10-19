// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Modal } from 'antd'
import { CreateCounselingTaskForm } from 'components/counseling/CreateCounselingTaskForm'
import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { selectActiveModal, selectVisibleModal } from 'store/display/displaySelectors'
import { closeModal } from 'store/display/displaySlice'
import { CreateTaskModalProps, MODALS } from 'store/display/displayTypes'
import { useReduxDispatch } from 'store/store'
import { selectStudent } from 'store/user/usersSelector'
import styles from './styles/CreateCounselingTaskModal.scss'

const CreateEditCounselingTaskModal = () => {
  const [showFormPreview, setShowFormPreview] = useState(false)
  const dispatch = useReduxDispatch()

  const modalProps = useSelector(selectActiveModal)?.modalProps as CreateTaskModalProps
  const visible = useSelector(selectVisibleModal(MODALS.CREATE_COUNSELING_TASK))
  const student = useSelector(selectStudent(visible && modalProps ? modalProps.studentID : undefined))

  return (
    <Modal
      visible={visible}
      onCancel={e => {
        dispatch(closeModal())
      }}
      footer={null}
      className={styles.createCounselingTaskModal}
      title={`Create Task for ${student ? student.first_name : 'student'}`}
      width={showFormPreview ? 1400 : 760}
    >
      {visible && (
        <CreateCounselingTaskForm
          showFormPreview={showFormPreview}
          setShowFormPreview={setShowFormPreview}
          studentID={modalProps?.studentID}
          taskID={modalProps?.taskID}
          taskTemplateID={modalProps?.taskTemplateID}
        />
      )}
    </Modal>
  )
}
export default CreateEditCounselingTaskModal
