// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { DatePicker, Input, Modal, Select } from 'antd'
import TextArea from 'antd/lib/input/TextArea'
import moment from 'moment'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { fetchDiagnostics } from 'store/diagnostic/diagnosticThunks'
import { Diagnostic } from 'store/diagnostic/diagnosticTypes'
import { closeModal } from 'store/display/displaySlice'
import { CreateTaskModalProps, MODALS } from 'store/display/displayTypes'
import { useReduxDispatch } from 'store/store'
import { createTask } from 'store/task/tasksThunks'
import { Task, TaskType } from 'store/task/tasksTypes'
import { fetchStudent } from 'store/user/usersThunks'
import { selectResources } from 'store/resource/resourcesSelectors'
import { Resource } from 'store/resource/resourcesTypes'
import { selectVisibleModal, selectVisibleModalProps } from 'store/display/displaySelectors'
import { selectStudent } from 'store/user/usersSelector'
import { selectDiagnostics } from 'store/diagnostic/diagnosticSelectors'
import styles from './styles/CreateTaskModal.scss'

const CreateTaskModal = () => {
  const dispatch = useReduxDispatch()
  const [loading, setLoading] = useState(false)
  const [selectedDiagnostic, setDiagnostic] = useState<number>()
  const [selectedDueDate, setDueDate] = useState<string | null>(null)
  const [selectedResources, setSelectedResources] = useState<number[]>([])
  const [note, setNote] = useState('')
  const [title, setTitle] = useState('')
  const [errors, setErrors] = useState<Array<string>>([])

  const visible = useSelector(selectVisibleModal(MODALS.CREATE_TASK))
  const modalProps = useSelector(selectVisibleModalProps(MODALS.CREATE_TASK)) as CreateTaskModalProps
  const student = useSelector(selectStudent(modalProps?.studentID))
  const diagnostics = useSelector(selectDiagnostics)

  const resources = useSelector(selectResources)

  // Resets select fields on tab change and on modal mount
  useEffect(() => {
    if (visible) {
      setDiagnostic(null)
      setTitle('')
      setNote('')
      setSelectedResources([])
    }
  }, [visible])

  // Prevents excessive fetching of SUDs
  const studentExists = !!student

  const studentID = modalProps?.studentID
  useEffect(() => {
    if (!visible) {
      return
    }
    // Load student if they don't exist
    if (!studentExists || !diagnostics.length) {
      setLoading(true)
    }
    const promises: Array<Promise<any>> = []
    if (!studentExists && studentID) {
      promises.push(dispatch(fetchStudent(studentID)))
    }

    // Load diagnostics
    if (!diagnostics.length) {
      promises.push(dispatch(fetchDiagnostics()))
    }
    Promise.all(promises).finally(() => setLoading(false))
  }, [diagnostics.length, dispatch, studentExists, studentID, visible])
  /**
   * Validate then submit form, creating a task. Close modal upon success
   */
  const submit = () => {
    const newErrors = []
    if (!title) {
      newErrors.push('Please enter a title')
    }
    if (!student) {
      newErrors.push('Please enter a title')
    }
    setErrors(newErrors)
    if (newErrors.length > 0 || !student) {
      return
    }
    // Creating a custom task
    // Note: All custom tasks default to TaskType.Other (except when a counselor selects a form; handled below)
    const task: Partial<Task> & { set_resources: number[] } = {
      description: note,
      title,
      task_type: TaskType.Other,
      for_user: student.user_id,
      require_file_submission: Boolean(selectedDiagnostic),
      require_form_submission: false,
      allow_content_submission: true,
      allow_file_submission: true,
      allow_form_submission: true,
      set_resources: selectedResources,
    }
    if (selectedDueDate) {
      task.due = selectedDueDate
    }
    if (selectedDiagnostic) {
      task.diagnostic_id = selectedDiagnostic
    }
    setLoading(true)
    dispatch(createTask(task))
      .catch(e => setErrors([...errors, e]))
      .then(() => {
        dispatch(closeModal())
      })
      .finally(() => setLoading(false))
  }

  return (
    <Modal
      visible={visible}
      onOk={submit}
      onCancel={e => {
        dispatch(closeModal())
      }}
      className={styles.createTaskModal}
      okText="Create Task"
      confirmLoading={loading}
      title={`Create Task for ${student ? student.first_name : 'student'}`}
    >
      <div className="vertical-form-container">
        <div className="formGroup">
          <label>Title:</label>
          <Input
            value={title}
            onChange={e => {
              setTitle(e.target.value)
            }}
          />
        </div>

        <div className="formGroup">
          <label>Description:</label>
          <TextArea autoSize={{ maxRows: 8 }} value={note} onChange={e => setNote(e.target.value)} />
        </div>

        <div className="formGroup datepicker">
          <label>Due Date (optional):</label>&nbsp;
          <DatePicker
            value={selectedDueDate ? moment(selectedDueDate) : null}
            onChange={e => setDueDate(e ? e.toISOString() : null)}
          />
        </div>
        <div className="formGroup">
          <label>Resources (optional):</label>
          <Select
            mode="tags"
            value={selectedResources}
            onChange={setSelectedResources}
            loading={loading}
            optionFilterProp="children"
          >
            {resources.map((resource: Resource) => (
              <Select.Option key={resource.pk} value={resource.pk}>
                {resource.title}
              </Select.Option>
            ))}
          </Select>
          <p className="help">
            Optional resources to make available to student as part of this task. Need to add a resource? Do so on a
            student&apos;s Resources tab, then create this task.
          </p>
        </div>
        <div className="formGroup">
          <label>Diagnostic or test (optional):</label>
          <Select value={selectedDiagnostic} onChange={setDiagnostic} loading={loading}>
            {diagnostics.map((diag: Diagnostic) => (
              <Select.Option key={diag.pk} value={diag.pk}>
                {diag.title}
              </Select.Option>
            ))}
          </Select>
          <p className="help">Optional diagnostic or test for student to complete as part of this task</p>
        </div>
        {errors.length > 0 && <div className="error-container center">{errors.join(', ')}</div>}
      </div>
    </Modal>
  )
}

export default CreateTaskModal
