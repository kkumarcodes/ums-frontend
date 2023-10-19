// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { DeleteOutlined, EditOutlined, FormOutlined, ReadOutlined, RedoOutlined } from '@ant-design/icons'
import { Button, Input, Modal, Popconfirm } from 'antd'
import MinimizeModalTitle from 'components/common/MinimizeModalTitle'
import MultiFileUpload from 'components/common/MultiFileUpload'
import { TaskFormDetail } from 'components/task/TaskForm'
import { filter, isEmpty, map, values } from 'lodash'
import moment from 'moment'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { FileUpload } from 'store/common/commonTypes'
import { selectActiveModal, selectVisibleModal, selectVisibleModalProps } from 'store/display/displaySelectors'
import { alterModalVisibility, closeModal, showModal } from 'store/display/displaySlice'
import { MODALS, ModalVisibility, SubmitTaskModalProps } from 'store/display/displayTypes'
import { Resource } from 'store/resource/resourcesTypes'
import { RootState } from 'store/rootReducer'
import { useReduxDispatch } from 'store/store'
import { selectTask } from 'store/task/tasksSelectors'
import { deleteTask, updateTask } from 'store/task/tasksThunks'
import { Task, TaskType } from 'store/task/tasksTypes'
import { fetchStudentUniversityDecisions } from 'store/university/universityThunks'
import { selectIsCounselorOrAdmin, selectIsParent } from 'store/user/usersSelector'

import styles from './styles/SubmitTaskModal.scss'

type ModalState = {
  uploadedFiles: FileUpload[]
  contentSubmission: string
}

const SubmitTaskModal = () => {
  const dispatch = useReduxDispatch()
  const [uploadedFiles, setUploadedFiles] = useState<Array<FileUpload>>([])
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Array<string>>([])
  const [contentSubmission, setContentSubmission] = useState('')
  const [unmarkingComplete, setUnmarkingComplete] = useState(false)

  const isCounselorOrAdmin = useSelector(selectIsCounselorOrAdmin)
  const visible = useSelector(selectVisibleModal(MODALS.SUBMIT_TASK))
  const modalProps = useSelector(selectVisibleModalProps(MODALS.SUBMIT_TASK)) as SubmitTaskModalProps
  const modalState = useSelector(selectActiveModal)?.state as ModalState
  const task = useSelector(selectTask(modalProps?.taskID))
  const isParent = useSelector(selectIsParent)
  const readOnly = isParent && !task?.counseling_parent_task

  const resources = useSelector((state: RootState) => {
    const resourcePKs = task?.resources || []
    return filter(values(state.resource.resources), (r: Resource) => resourcePKs.includes(r.pk))
  })

  const trackEvent = (eventName: string, task?: Task | undefined) => {

  }

  // When modal becomes active, we may need to pull state from minimized modal
  useEffect(() => {
    if (visible && modalState && !isEmpty(modalState)) {
      setContentSubmission(modalState.contentSubmission)
      setUploadedFiles(modalState.uploadedFiles)
    } else if (visible) {
      trackEvent('Submit Task - View', task)
      setContentSubmission('')
      setUploadedFiles([])
    }
  }, [visible, modalState]) // eslint-disable-line react-hooks/exhaustive-deps

  const submit = () => {
    trackEvent('Submit Task - Submitted', task)
    if (!task) {
      throw new Error('Cannot submit task - no task prop on SubmitTaskModal component')
    }
    setErrors([])
    if (task.require_file_submission && !uploadedFiles.length) {
      setErrors([...errors, 'Please upload a file to submit'])
    }
    if (task.require_content_submission && !contentSubmission) {
      setErrors([...errors, 'Please enter some text to submit'])
    }
    if (errors.length) {
      return
    }

    const fileUploadSlugs = map(uploadedFiles, 'slug')
    setSaving(true)
    dispatch(
      updateTask({
        ...task,
        update_file_uploads: fileUploadSlugs,
        content_submission: contentSubmission,
        completed: moment().format(),
      }),
    )
      .then(() => {
        // If there are SUDs associated with this task, then we reload SUDs for our student to ensure we get the
        // correct status
        if (task && task.student_university_decisions.length && task.for_student) {
          dispatch(fetchStudentUniversityDecisions({ student: task.for_student }))
        }
        // Success! close the modal
        dispatch(closeModal())
        // Clear form
        setContentSubmission('')
        setUploadedFiles([])
      })
      .catch(() => setErrors([...errors, 'Failed to save']))
      .finally(() => setSaving(false))
  }

  // Render widget for selecting files to upload
  const renderUpload = () => {
    if (!task || (!task.allow_file_submission && !task.require_file_submission)) {
      return null
    }
    return <MultiFileUpload value={uploadedFiles} onChange={setUploadedFiles} />
  }

  // Render widget for submitting content
  const renderContent = () => {
    if (!task || (!task.allow_content_submission && !task.require_content_submission)) {
      return null
    }
    return (
      <div className="input-container">
        {(task.allow_file_submission || task.require_file_submission) && <hr />}
        <Input.TextArea
          rows={3}
          onChange={e => {
            setContentSubmission(e.target.value)
          }}
          placeholder="Enter comments about your task submission here..."
          value={contentSubmission}
        />
      </div>
    )
  }

  const minimize = () => {
    dispatch(
      alterModalVisibility({
        state: { contentSubmission, uploadedFiles },
        visibility: ModalVisibility.Minimized,
        title: `Submit ${task?.title}`,
      }),
    )
  }

  /** Render link to open essays platform (Prompt) */
  const renderEssayTaskContent = () => {
    return (
      <div className="center">
        <p>Once you sumbit your draft through the essay platform this will be marked as complete.</p>
        <p>
          <Button target="_blank" href="/counseling/launch-essays/" type="primary" size="large">
            Open essay platform to submit your draft <FormOutlined />
          </Button>
        </p>
      </div>
    )
  }

  /** Opening Modal for Vimeo */
  const launchVimeoResourceModal = (pk: number) => {
    dispatch(
      showModal({
        modal: MODALS.VIMEO_RESOURCE_MODAL,
        props: {
          pk,
        },
      }),
    )
  }

  const renderResources = () => {
    if (!resources.length) {
      return null
    }
    return (
      <div className="task-resources">
        <h3 className="task-desc-header">Resources</h3>
        <div className="task-resource-group">
          <ReadOutlined />
          {(resources as Array<Resource>).map((r: Resource) => {
            if (r.link.includes('vimeo')) {
              return (
                <a
                  onClick={() => {
                    launchVimeoResourceModal(r.pk)
                  }}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="task-resource"
                  role="button"
                >
                  <p className="task-title">{r.title}</p>
                </a>
              )
            }
            return (
              <a key={r.pk} href={r.url} target="_blank" rel="noopener noreferrer" className="task-resource">
                <p className="task-title">{r.title}</p>
              </a>
            )
          })}
        </div>
      </div>
    )
  }

  // Render list of errors
  const renderErrors = () => {
    return (
      errors && (
        <div className="modal-errors">
          {errors.map(e => (
            <p key={e}>{e}</p>
          ))}
        </div>
      )
    )
  }

  const editTask = () => {
    if (!task) return
    // Close this modal, then open edit modal FOR COUNSELING TASKS ONLY
    const taskID = task.pk
    const studentID = task.for_student
    dispatch(closeModal())
    dispatch(showModal({ props: { studentID, taskID }, modal: MODALS.CREATE_COUNSELING_TASK }))
  }

  const doUnmarkComplete = () => {
    if (!task) return
    setUnmarkingComplete(true)
    dispatch(updateTask({ completed: null, pk: task.pk }))
      .then(() => {
        setUnmarkingComplete(false)
        dispatch(closeModal())
      })
      .finally(() => {
        setUnmarkingComplete(false)
      })
  }

  const doDeleteTask = () => {
    dispatch(closeModal())
    if (task) {
      dispatch(deleteTask(task.pk))
    }
  }

  const counselorTaskFooter = (
    <div className="counselor-task-footer flex">
      <div className="left">
        <Button type="default" onClick={editTask}>
          <EditOutlined />
          Edit Task
        </Button>
        <Popconfirm onConfirm={doDeleteTask} title="Are you sure you want to permanently delete this task?">
          <Button type="default">
            <DeleteOutlined />
            Delete Task
          </Button>
        </Popconfirm>
      </div>
      {!task?.form && (
        <div className="right">
          <Button type="primary" onClick={submit} loading={saving}>
            Mark Complete
          </Button>
        </div>
      )}
    </div>
  )

  const completeTaskFooter = (
    <div className="complete-task-footer flex">
      <div className="left">
        <Button type="default" loading={unmarkingComplete} onClick={doUnmarkComplete}>
          <RedoOutlined />
          Un-Mark Complete
        </Button>
      </div>
      <div className="right">
        {!task?.form && (
          <Button type="default" onClick={() => dispatch(closeModal())}>
            Close
          </Button>
        )}
      </div>
    </div>
  )

  // Note that school research tasks don't get a footer because they're not editable/unsubmittable
  let footer
  if (readOnly || task?.task_type === TaskType.SchoolResearch || task?.is_prompt_task) {
    footer = null
  } else if (task?.completed) {
    footer = completeTaskFooter
  } else if (isCounselorOrAdmin && !task?.is_prompt_task) {
    footer = counselorTaskFooter
  } else if (!isCounselorOrAdmin && task?.form) {
    footer = null
  }

  // If task has been submitted, we show those details instead of form elements to submit task
  const taskSubmissionDetails = () => {
    if (!task) return ''
    return (
      <div className="submission-details">
        <h3 className="task-desc-header">Submission Details</h3>
        {task.completed && (
          <p>
            This task was submitted on {moment(task.completed).format('MMM Do')} at{' '}
            {moment(task.completed).format('h:mma')}
          </p>
        )}
        {task.content_submission && (
          <p>
            <strong>Submitted response:&nbsp;</strong>
            {task.content_submission}
          </p>
        )}
        {task.file_uploads.length > 0 && (
          <div className="submission-file-uploads">
            <p>
              <strong>Submitted file(s):</strong>
            </p>
            <ul>
              {task.file_uploads.map(fu => (
                <li key={fu.slug}>
                  <a href={`/cw/upload/${fu.slug}/`} target="_blank" rel="noopener noreferrer">
                    {fu.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  return task ? (
    <Modal
      visible={visible}
      className={styles.submitTaskModal}
      onOk={submit}
      closable={false}
      okText={!task.completed ? 'Mark Task Complete' : 'Save'}
      confirmLoading={task.loading}
      title={<MinimizeModalTitle title={`Submitting ${task?.title}`} onMinimize={minimize} />}
      maskClosable={!task.form}
      footer={footer}
      width={768}
      destroyOnClose={true}
      onCancel={() => dispatch(closeModal())}
    >
      {(task.description || isCounselorOrAdmin) && (
        <div className="task-desc-wrapper">
          <h3 className="task-desc-header">Task Description</h3>
          <div className="task-desc" dangerouslySetInnerHTML={{ __html: task.description }} />
        </div>
      )}
      {task?.resources.length > 0 && renderResources()}
      {task.is_prompt_task && !readOnly && renderEssayTaskContent()}
      {task.completed && taskSubmissionDetails()}
      {!task.form && !readOnly && !task.completed && !task.is_prompt_task && renderUpload()}
      {!task.form && !readOnly && !task.completed && !task.is_prompt_task && renderContent()}
      {task.form && !task.is_prompt_task && (
        <TaskFormDetail readOnly={readOnly} taskID={task.pk} taskFormID={task.form.pk} />
      )}
      {renderErrors()}
    </Modal>
  ) : (
    <span />
  )
}

export default SubmitTaskModal
