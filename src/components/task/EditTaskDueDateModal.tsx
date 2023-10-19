// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { DatePicker, Modal } from 'antd'
import moment from 'moment'
import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { selectVisibleModal, selectVisibleModalProps } from 'store/display/displaySelectors'
import { closeModal } from 'store/display/displaySlice'
import { EditTaskDueDateModalProps, MODALS } from 'store/display/displayTypes'
import { RootState } from 'store/rootReducer'
import { useReduxDispatch } from 'store/store'
import { updateTask } from 'store/task/tasksThunks'

const EditTaskDueDateModal = () => {
  const dispatch = useReduxDispatch()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Array<string>>([])
  const [selectedDueDate, setDueDate] = useState<string | null>(null)

  const visible = useSelector(selectVisibleModal(MODALS.EDIT_TASK_DUE_DATE))
  const modalProps = useSelector(selectVisibleModalProps(MODALS.EDIT_TASK_DUE_DATE)) as EditTaskDueDateModalProps
  const task = useSelector((state: RootState) => (modalProps?.taskID ? state.task.tasks[modalProps.taskID] : undefined))

  const submit = () => {
    if (selectedDueDate && task?.pk) {
      const taskUpdate = {
        pk: task.pk,
        due: selectedDueDate,
      }

      setLoading(true)
      dispatch(updateTask(taskUpdate))
        .catch(e => setErrors([...errors, e]))
        .then(e => {
          dispatch(closeModal())
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }

  const momentDueDate = task?.due ? moment(task?.due) : null

  return (
    <Modal
      visible={visible}
      onOk={submit}
      onCancel={e => {
        dispatch(closeModal())
      }}
      okText="Save Date"
      confirmLoading={loading}
      title={`Change task due date for ${task ? task.title : 'task'}`}
    >
      <div className="vertical-form-container">
        <div className="formGroup datepicker">
          <label>Change Due Date:</label>&nbsp;
          <DatePicker
            value={selectedDueDate ? moment(selectedDueDate) : momentDueDate}
            onChange={e => setDueDate(e ? e.toISOString() : null)}
            defaultPickerValue={task?.due ? moment(task?.due) : undefined}
          />
        </div>
      </div>
    </Modal>
  )
}

export default EditTaskDueDateModal
