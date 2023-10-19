// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { message, Modal, Select, Skeleton } from 'antd'
import _ from 'lodash'
import React, { useEffect, useState } from 'react'
import { shallowEqual, useSelector } from 'react-redux'
import { fetchAssignedDiagnostics, fetchDiagnostics } from 'store/diagnostic/diagnosticThunks'
import { selectVisibleModal, selectVisibleModalProps } from 'store/display/displaySelectors'
import { closeModal } from 'store/display/displaySlice'
import { MODALS, SelfAssignDiagnosticModalProps } from 'store/display/displayTypes'
import { RootState } from 'store/rootReducer'
import { useReduxDispatch } from 'store/store'
import { createTask } from 'store/task/tasksThunks'
import { Task } from 'store/task/tasksTypes'
import { selectStudent } from 'store/user/usersSelector'
import styles from './styles/SelfAssignDiagnosticModal.scss'

const SelfAssignDiagnosticModal = () => {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [assignedDiagnostics, setAssignedDiagnostics] = useState<number[]>([])
  const [selectedDiagnostic, setSelectedDiagnostic] = useState<number>()
  const dispatch = useReduxDispatch()

  const visible = useSelector(selectVisibleModal(MODALS.SELF_ASSIGN_DIAGNOSTIC))
  const modalProps = useSelector(
    selectVisibleModalProps(MODALS.SELF_ASSIGN_DIAGNOSTIC),
  ) as SelfAssignDiagnosticModalProps
  const student = useSelector(selectStudent(modalProps?.studentID))
  const studentID = student?.pk
  const studentUserID = student?.user_id
  const diagnostics = useSelector((state: RootState) =>
    Object.values(state.diagnostic.diagnostics).filter(d => d.can_self_assign && !assignedDiagnostics.includes(d.pk)),
  )

  /** Submit handler (assign diagnostic) */
  const submit = () => {
    if (!selectedDiagnostic || !studentUserID) {
      throw new Error('Cannot submit null diagnostic/student!')
    }
    const selectedDiagObj = _.find(diagnostics, d => d.pk === selectedDiagnostic)
    // Construct a task with associated diagnostic to submit
    const task: Partial<Task> & { self_assigned: boolean } = {
      for_user: studentUserID,
      diagnostic_id: selectedDiagnostic,
      title: selectedDiagObj?.title,
      require_file_submission: true,
      allow_content_submission: true,
      self_assigned: true,
    }

    setSaving(true)
    dispatch(createTask(task))
      .catch(e => message.error(e))
      .then(() => {
        dispatch(closeModal())
        setSelectedDiagnostic(undefined)
        message.success('Diagnostic task created! Find it in your task list.')
      })
      .finally(() => setSaving(false))
  }

  useEffect(() => {
    if (visible && studentID) {
      setLoading(true)
      // Load all diagnostics, and then load the diagnostics that have been assigned to student
      Promise.all([
        dispatch(fetchDiagnostics()),
        dispatch(fetchAssignedDiagnostics(studentID)).then(result => setAssignedDiagnostics(_.map(result, 'pk'))),
      ]).then(() => setLoading(false))
    }
  }, [dispatch, studentID, visible])

  return (
    <Modal
      className={styles.selfAssignDiagModal}
      visible={visible}
      onOk={submit}
      onCancel={e => {
        dispatch(closeModal())
      }}
      okButtonProps={{ disabled: !selectedDiagnostic }}
      okText="Submit"
      confirmLoading={saving || loading}
      title="Diagnostics"
    >
      <div className="selectDiagContainer">
        {loading && <Skeleton />}
        {!loading && (
          <div>
            <label>Select diagnostic:</label>&nbsp;
            <Select value={selectedDiagnostic} onChange={setSelectedDiagnostic}>
              {diagnostics.map(diag => (
                <Select.Option key={diag.pk} value={diag.pk}>
                  {diag.title}
                </Select.Option>
              ))}
            </Select>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default SelfAssignDiagnosticModal
