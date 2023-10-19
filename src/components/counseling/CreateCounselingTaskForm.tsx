// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import {
  CaretLeftOutlined,
  CaretRightOutlined,
  FormOutlined,
  QuestionCircleOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import { Button, DatePicker, Input, message, Select, Switch, Tooltip } from 'antd'
import Loading from 'components/common/Loading'
import { RichTextEditor } from 'components/common/RichTextEditor'
import { TaskFormDetail } from 'components/task/TaskForm'
import { assign, pick, some, uniqBy } from 'lodash'
import moment from 'moment'
import React, { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectCounselorMeetingsForStudent } from 'store/counseling/counselingSelectors'
import { fetchCounselorMeetings } from 'store/counseling/counselingThunks'
import { closeModal } from 'store/display/displaySlice'
import { selectResources } from 'store/resource/resourcesSelectors'
import { Resource } from 'store/resource/resourcesTypes'
import { useReduxDispatch } from 'store/store'
import { selectTask, selectTaskForms, selectTaskTemplates } from 'store/task/tasksSelectors'
import {
  createBulkTask,
  createTask,
  createTaskTemplate,
  fetchTaskForms,
  fetchTaskTemplates,
  updateTask,
} from 'store/task/tasksThunks'
import { Task, TaskForm, TaskTemplate, TaskType } from 'store/task/tasksTypes'
import { selectSUDsForStudent } from 'store/university/universitySelectors'
import { fetchStudentUniversityDecisions } from 'store/university/universityThunks'
import { IsApplying } from 'store/university/universityTypes'
import { selectStudent } from 'store/user/usersSelector'
import styles from './styles/CreateCounselingTaskModal.scss'

// Will be value of selectedTaskTemplate when "Custom Task..." is selected
const CUSTOM_TASK_ID = -1
const NUMBER_OF_SUGGESTIONS = 5
const MAX_SUGGESTED_TEMPLATE_TITLE_LENGTH = 40

// Helper function that gives recommendations for task templates given a title
const suggestTaskTemplatesFromTitle = (taskTemplates: TaskTemplate[], title: string) => {
  const words = title
    .split(' ')
    .filter(w => w.length > 4)
    .map(w => w.toLowerCase())
  // We return templates that have one word in common
  return uniqBy(
    taskTemplates.filter(tt => some(words, w => tt.title.toLowerCase().includes(w))),
    'title',
  ).slice(0, NUMBER_OF_SUGGESTIONS)
}

/** Either studentID or forUserBulkCreate must be defined */
type Props = {
  showFormPreview: boolean
  setShowFormPreview: React.Dispatch<React.SetStateAction<boolean>>
  studentID?: number // Defined if creating a task for a single student
  forUserBulkCreate?: number[] // Defined if creating a single task for many students (createBulkTask)
  taskID?: number
  taskTemplateID?: number
  prevStep?: () => void
}

export const CreateCounselingTaskForm = ({
  showFormPreview,
  setShowFormPreview,
  studentID,
  forUserBulkCreate,
  taskID,
  taskTemplateID,
  prevStep,
}: Props) => {
  const isBulkCreate = !!forUserBulkCreate?.length
  const [loading, setLoading] = useState(false)
  const [selectedSUD, setSUD] = useState<number[]>([])
  const [selectedTaskTemplate, setTaskTemplate] = useState<number>()
  const [selectedDueDate, setDueDate] = useState<string>()
  const [displayOnStudentTaskList, setDisplayOnStudentTaskList] = useState(false)
  const [selectedResources, setSelectedResources] = useState<number[]>([])
  const [selectedTaskForm, setTaskForm] = useState<number>()
  const [selectedMeeting, setSelectedMeeting] = useState<number>()
  const [saveNewTemplate, setSaveNewTemplate] = useState(false)
  const [refreshingTaskTemplates, setRefreshingTaskTemplates] = useState(false)
  // We only overwrite description if it has been sullied (changed)
  const [changedDescription, setChangedDescription] = useState(false)
  const [note, setNote] = useState('')
  const [title, setTitle] = useState('')
  const dispatch = useReduxDispatch()

  const student = useSelector(selectStudent(studentID))
  const editTask = useSelector(selectTask(taskID))
  const taskForms = useSelector(selectTaskForms).filter(f => f.active || f.pk === editTask?.pk)

  const resources = useSelector(selectResources)

  const taskTemplates = useSelector(selectTaskTemplates)
  const displayTaskTemplates = taskTemplates.filter(
    tt => tt.created_by || !tt.roadmap || tt.pk === selectedTaskTemplate,
  )

  const counselorMeetings = useSelector(selectCounselorMeetingsForStudent(studentID))

  const SUDs = useSelector(selectSUDsForStudent(student?.pk)).filter(sud =>
    student?.school_list_finalized ? sud.is_applying === IsApplying.Yes : sud,
  )

  // Reset form on open
  const taskFormsLength = taskForms?.length
  const SUDsLength = SUDs?.length
  const taskTemplatesLength = taskTemplates?.length
  const propsTaskTemplateID = taskTemplateID

  // When selected task template changes, we update all fields to match new template
  const onChangeTaskTemplate = useCallback(
    (newTaskTemplatePK?: number, newTaskTemplateProp?: TaskTemplate) => {
      if (newTaskTemplatePK === CUSTOM_TASK_ID) {
        setTaskTemplate(newTaskTemplatePK)
        setChangedDescription(false)
        return true
      }
      const newTaskTemplate = newTaskTemplateProp || taskTemplates.find(t => t.pk === newTaskTemplatePK)
      if (!newTaskTemplate) {
        return false
      }

      const oldTaskTemplate = taskTemplates.find(t => t.pk === selectedTaskTemplate)
      // We overwrite title and description iff existing title and description were blank or same as old task template
      if (!title || (oldTaskTemplate && oldTaskTemplate.title === title)) {
        setTitle(newTaskTemplate.title)
      }
      if (!note || !changedDescription) {
        setNote(newTaskTemplate.description)
        setChangedDescription(false)
      }
      if (!selectedResources.length) setSelectedResources(newTaskTemplate.resources)
      setTaskTemplate(newTaskTemplate.pk)
      return true
    },
    [changedDescription, note, selectedResources.length, selectedTaskTemplate, taskTemplates, title],
  )

  // When due date goes from not being set to being set, we make task visible to student
  const innerSetDueDate = (newDue: string | undefined) => {
    if (newDue && !selectedDueDate) setDisplayOnStudentTaskList(true)
    setDueDate(newDue)
  }

  // The meeting that task is for
  const editTaskMeeting = counselorMeetings.find(m => editTask?.pk && m.tasks.includes(editTask.pk))
  const editTaskPK = editTask?.pk

  // Helper function to refresh task templates for counselor; we use sentry to track when counselors manually
  // initiate this action so that we can debug an issue with task templates not appearing for counselors
  const handleRefresh = (updateSentry = false) => {
    setRefreshingTaskTemplates(true)

    dispatch(fetchTaskTemplates())
      .then(taskTemplates => {
        
      })
      .finally(() => setRefreshingTaskTemplates(false))
  }

  useEffect(() => {
    setTaskForm(editTask?.form_id)
    setSUD(editTask?.student_university_decisions || [])
    setTitle(editTask?.title || '')
    setNote(editTask?.description || '')
    setDueDate(editTask?.due || '')
    setSelectedResources(editTask?.resources || [])
    setSelectedMeeting(editTaskMeeting?.pk || undefined)
    setDisplayOnStudentTaskList(!editTask || editTask.visible_to_counseling_student)
    if (propsTaskTemplateID) {
      onChangeTaskTemplate(propsTaskTemplateID)
    } else {
      setTaskTemplate(undefined)
    }
  }, [SUDsLength, dispatch, editTaskPK, propsTaskTemplateID, taskFormsLength]) // eslint-disable-line react-hooks/exhaustive-deps

  // When our selected task template or selected form changes, we reset showFormPreview
  useEffect(() => {
    setShowFormPreview(false)
  }, [selectedTaskForm, selectedTaskTemplate, setShowFormPreview])

  // Loading useEffects
  useEffect(() => {
    if (!taskTemplatesLength) {
      setLoading(true)
      dispatch(fetchTaskTemplates()).then(taskTemplates => {
        if (selectedTaskTemplate) {
          onChangeTaskTemplate(
            undefined,
            taskTemplates.find(t => t.pk === selectedTaskTemplate),
          )
        } else if (propsTaskTemplateID) {
          onChangeTaskTemplate(
            undefined,
            taskTemplates.find(t => t.pk === propsTaskTemplateID),
          )
        }
        setLoading(false)
      })
    } else {
      // We fetch task templates anwyways, but don't show loading
      handleRefresh()
    }
  }, [dispatch]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!SUDsLength) {
      dispatch(fetchStudentUniversityDecisions())
    }
  }, [SUDsLength, dispatch])
  useEffect(() => {
    if (!taskFormsLength) {
      dispatch(fetchTaskForms())
    }
  }, [dispatch, taskFormsLength])

  // Callback for when we finish updating or creating task
  const finish = (fetchSUDs: boolean) => {
    setLoading(false)
    // We may need to fetch meeting that was updated
    if (student) dispatch(fetchCounselorMeetings({ student: student.pk }))
    if (student && fetchSUDs) dispatch(fetchStudentUniversityDecisions({ student: student.pk }))
    dispatch(closeModal())
  }

  // Creating or updating our task :)
  const submit = async () => {
    if (editTask) {
      const updateTaskPayload: Partial<Task> & { set_resources: number[]; pk: number; counselor_meetings: number[] } = {
        title,
        description: note,
        due: selectedDueDate || null,
        student_university_decisions: selectedSUD,
        set_resources: selectedResources,
        pk: editTask.pk,
        visible_to_counseling_student: displayOnStudentTaskList,
      }
      if (selectedMeeting === undefined) {
        updateTaskPayload.counselor_meetings = []
      } else if (selectedMeeting) {
        updateTaskPayload.counselor_meetings = [selectedMeeting]
      }
      setLoading(true)
      try {
        await dispatch(updateTask(updateTaskPayload))
        finish(selectedSUD.length > 0)
      } catch (e) {
        message.error(e)
      } finally {
        setLoading(false)
      }
      return
    }

    const saveTask: Partial<Task> & {
      set_resources: number[]
      task_template?: number
      counselor_meetings: number[]
      for_user_bulk_create?: number[]
    } = {
      title,
      description: note,
      due: selectedDueDate || null,
      set_resources: selectedResources,
      task_type: TaskType.Other,
      form_id: selectedTaskForm,
      require_file_submission: false,
      allow_file_submission: true,
      require_content_submission: false,
      allow_content_submission: true,
      visible_to_counseling_student: displayOnStudentTaskList,
    }

    if (!isBulkCreate) {
      saveTask.student_university_decisions = selectedSUD
      saveTask.for_user = student?.user_id
      if (selectedMeeting) saveTask.counselor_meetings = [selectedMeeting]
    } else {
      saveTask.for_user_bulk_create = forUserBulkCreate
    }

    if (selectedTaskTemplate !== CUSTOM_TASK_ID) {
      // Creating a task from a TaskTemplate
      const template = taskTemplates.find(tt => tt.pk === selectedTaskTemplate)
      saveTask.task_template = template?.pk
      // We override some values on our saveTask
      const overrideValues = pick(template, [
        'require_file_submission',
        'allow_file_submission',
        'require_content_submission',
        'allow_content_submission',
        'task_type',
      ])
      assign(saveTask, overrideValues)
      if (template?.form) {
        saveTask.form_id = template.form
      }
    } else if (selectedTaskForm) {
      saveTask.form_id = selectedTaskForm
      // Find the selected Form object
      const selectedForm = taskForms.find(form => form.pk === selectedTaskForm)
      // Counselor selected a form, we need to override the default task_type="Other"
      if (selectedForm?.title.includes('College Search') || selectedForm?.title.includes('College Research')) {
        saveTask.task_type = TaskType.SchoolResearch
      } else {
        saveTask.task_type = TaskType.Survey
      }
    }
    setLoading(true)
    try {
      if (saveNewTemplate && !selectedTaskForm && selectedTaskTemplate === CUSTOM_TASK_ID) {
        const newTaskTemplate = await dispatch(
          createTaskTemplate({
            title: saveTask.title,
            description: saveTask.description,
            task_type: TaskType.Other,
            resources: saveTask.resources,
          }),
        )
        saveTask.task_template = newTaskTemplate.pk
      }
      if (!isBulkCreate) {
        await dispatch(createTask(saveTask))
      } else {
        await dispatch(createBulkTask(saveTask))
      }

      finish(selectedSUD.length > 0)
    } catch (err) {
      
    } finally {
      setLoading(false)
    }
  }

  // Here we compute some state variables that aid in rendering
  const selectedTemplateObject = taskTemplates.find(t => t.pk === selectedTaskTemplate)
  const selectedTemplateForm = selectedTemplateObject?.form
    ? taskForms.find(f => f.pk === selectedTemplateObject.form)
    : null

  const taskTemplateSuggestions =
    selectedTaskTemplate === CUSTOM_TASK_ID ? suggestTaskTemplatesFromTitle(taskTemplates, title ?? '') : []

  /** If we've selected a task template that includes a form, render a description and button to preview
   * that form
   */
  const renderFormPreview = () => {
    let form
    if (selectedTaskTemplate === CUSTOM_TASK_ID && selectedTaskForm) {
      form = taskForms.find(t => t.pk === selectedTaskForm)
    } else if (selectedTemplateForm) {
      form = selectedTemplateForm
    }
    if (!form) {
      return null
    }
    return (
      <div className="form-preview-container">
        <div className="form-preview-header">
          <strong>{form.title} Form Preview</strong>
          <br />
          <Button type="link" onClick={() => setShowFormPreview(false)}>
            Close Preview
          </Button>
        </div>
        <div className="form-preview-scroll-container">
          <TaskFormDetail taskFormID={form.pk} readOnly={true} />
        </div>
      </div>
    )
  }

  /** Render a set of links suggesting task templates that - when clicked - switch to using that task template
   * This gets rendered below title field when user has selected they're creating a custom task
   */
  const renderTemplateSuggestions = () => {
    if (taskTemplateSuggestions.length === 0) {
      return null
    }
    return (
      <div className="template-suggestions-container">
        <strong className="f-subtitle-2">Suggested templates:</strong>
        {taskTemplateSuggestions.map(t => (
          <Tooltip title={t.title} key={t.pk}>
            <Button key={t.pk} type="link" onClick={() => setTaskTemplate(t.pk)}>
              {t.form && (
                <span>
                  <FormOutlined />
                  &nbsp;
                </span>
              )}
              {t.title.slice(0, Math.max(0, MAX_SUGGESTED_TEMPLATE_TITLE_LENGTH))}
              {t.title.length > MAX_SUGGESTED_TEMPLATE_TITLE_LENGTH ? '...' : ''}
            </Button>
          </Tooltip>
        ))}
      </div>
    )
  }

  const showHidePreviewButton = (
    <Button type="link" onClick={() => setShowFormPreview(!showFormPreview)}>
      {showFormPreview && (
        <span>
          Hide Preview <CaretLeftOutlined />
        </span>
      )}
      {!showFormPreview && (
        <span>
          Preview Form <CaretRightOutlined />
        </span>
      )}
    </Button>
  )

  // Custom footer that includes toggle for whether or not to include on student's task list
  const footer = (
    <div className="flex footer-control">
      <div className="visibility-container">
        {!editTask?.is_prompt_task && (
          <>
            <Switch checked={displayOnStudentTaskList} onChange={setDisplayOnStudentTaskList} />
            &nbsp; Display on student/parent task list&nbsp;&nbsp;
            <Tooltip title="Students will only see (and be reminded of) tasks visible on their task list">
              <QuestionCircleOutlined />
            </Tooltip>
          </>
        )}
      </div>
      <div className="ok-cancel right">
        {isBulkCreate ? (
          <Button type="default" onClick={prevStep}>
            Previous
          </Button>
        ) : (
          <Button type="default" onClick={() => dispatch(closeModal())}>
            Cancel
          </Button>
        )}
        <Button type="primary" onClick={submit} loading={loading} className="submit-btn">
          {editTask ? 'Update Task' : 'Create Task'}
        </Button>
      </div>
    </div>
  )

  const taskTypeSelected = !!(editTask || selectedTaskTemplate)

  return (
    <div className={styles.createCounselingTaskModal}>
      {loading && (
        <div className="center">
          <Loading />
        </div>
      )}
      {!loading && (
        <div className="modal-flex">
          <div className="vertical-form-container">
            {!editTask && (
              <div className="form-group task-type">
                {!selectedTaskTemplate && <label>First, what type of task would you like to create?</label>}
                {selectedTaskTemplate && <label>Task Type:</label>}
                <Select
                  className={styles.selectTaskType}
                  value={selectedTaskTemplate}
                  onChange={v => onChangeTaskTemplate(v)}
                  loading={loading}
                  showSearch={true}
                  optionFilterProp="children"
                >
                  <Select.Option value={CUSTOM_TASK_ID} className={styles.selectOptionCustomTask}>
                    <SettingOutlined />
                    &nbsp; Custom Task...
                  </Select.Option>
                  {displayTaskTemplates?.map(tt => (
                    <Select.Option key={tt.pk} value={tt.pk}>
                      {tt.form ? (
                        <span>
                          <FormOutlined />
                          &nbsp;
                        </span>
                      ) : (
                        <span className="spacer">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
                      )}
                      {tt.title}
                    </Select.Option>
                  ))}
                </Select>
                <div className="right">
                  <Button type="link" onClick={() => handleRefresh(true)} loading={loading || refreshingTaskTemplates}>
                    Refresh Task List
                  </Button>
                </div>
              </div>
            )}
            {selectedTemplateForm && (
              <div className="form-description">
                <FormOutlined />
                This task type uses the {selectedTemplateForm.title} form
                {showHidePreviewButton}
              </div>
            )}
            {taskTypeSelected && (
              <div>
                <div className="flex">
                  <div className="form-group title">
                    <label>Title:</label>
                    <Input
                      value={title}
                      maxLength={250}
                      onChange={e => {
                        setTitle(e.target.value)
                      }}
                    />
                  </div>
                  <div className="form-group due">
                    <label>Due Date:</label>&nbsp;
                    <DatePicker
                      value={selectedDueDate ? moment(selectedDueDate) : null}
                      onChange={e => innerSetDueDate(e ? e.toISOString() : undefined)}
                    />
                  </div>
                </div>
                {selectedTaskTemplate === CUSTOM_TASK_ID && renderTemplateSuggestions()}
                {!editTask && selectedTaskTemplate === CUSTOM_TASK_ID && (
                  <div className="flex select-form">
                    <div className="form-group select-form-selector">
                      <label>Form (optional):</label>
                      <Select
                        value={selectedTaskForm || undefined}
                        onChange={setTaskForm}
                        loading={loading}
                        allowClear={true}
                      >
                        {taskForms.map((taskForm: TaskForm) => (
                          <Select.Option key={taskForm.pk} value={taskForm.pk}>
                            {taskForm.title}
                          </Select.Option>
                        ))}
                      </Select>
                    </div>
                    <div className="select-form-preview right">{selectedTaskForm && showHidePreviewButton}</div>
                  </div>
                )}
                {!isBulkCreate && (
                  <div className="flex">
                    <div className="form-group">
                      <label>University (optional):</label>
                      <Select
                        value={selectedSUD}
                        allowClear={true}
                        onChange={setSUD}
                        loading={loading}
                        showSearch={true}
                        optionFilterProp="children"
                        mode="tags"
                      >
                        {SUDs.map(sud => (
                          <Select.Option key={sud.pk} value={sud.pk}>
                            {sud.university_name}
                          </Select.Option>
                        ))}
                      </Select>
                    </div>

                    <div className="form-group">
                      <label>Meeting (optional):</label>
                      <Select
                        value={selectedMeeting}
                        onChange={setSelectedMeeting}
                        showSearch={true}
                        optionFilterProp="children"
                        allowClear={true}
                      >
                        {counselorMeetings.map(cm => (
                          <Select.Option key={cm.slug} value={cm.pk}>
                            {cm.title}
                          </Select.Option>
                        ))}
                      </Select>
                    </div>
                  </div>
                )}
                <div className="form-group rich-text-editor">
                  <label>Description</label>
                  <RichTextEditor
                    value={note}
                    onChange={setNote}
                    onKeyPress={() => setChangedDescription(true)}
                    placeholder="write something..."
                  />
                </div>
                <div className="form-group">
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
                    Optional resources to make available to student as part of this task. Need to add a resource? Do so
                    on a student&apos;s Resources tab, then create this task.
                  </p>
                </div>

                {selectedTaskTemplate === CUSTOM_TASK_ID && (
                  <div className="form-group">
                    <Switch
                      disabled={Boolean(selectedTaskForm)}
                      checked={saveNewTemplate}
                      onChange={setSaveNewTemplate}
                    />
                    &nbsp;
                    {selectedTaskForm && <label className="help">Cannot save as task template with a form</label>}
                    {!selectedTaskForm && (
                      <label>
                        Save as a custom task template &nbsp;
                        <Tooltip title="Title, description, and resources will be saved on a Task Template that you can use to create future tasks for any student">
                          <QuestionCircleOutlined />
                        </Tooltip>
                      </label>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          {showFormPreview && renderFormPreview()}
        </div>
      )}
      {footer}
    </div>
  )
}
