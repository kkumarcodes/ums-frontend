// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Dispatch } from '@reduxjs/toolkit'
import { flatten, map } from 'lodash'
import API from 'store/api'
import { addDiagnostics } from 'store/diagnostic/diagnosticSlice'
import { Diagnostic } from 'store/diagnostic/diagnosticTypes'
import { RootState } from 'store/rootReducer'
import { ReduxDispatch } from 'store/store'
import errorHandler from '../errorHandler'
import { addResources } from '../resource/resourcesSlice'
import { Resource } from '../resource/resourcesTypes'
import {
  addTask,
  addTaskForm,
  addTaskForms,
  addTaskFormSubmission,
  addTaskFormSubmissions,
  addTasks,
  addTaskTemplate,
  addTaskTemplates,
  removeTask,
  removeTaskTemplate,
  replacePromptTasks,
} from './tasksSlice'
import { Task, TaskForm, TaskFormSubmission, TaskTemplate } from './tasksTypes'

const SYNC_ESSAY_TASKS_ENDPOINT = (studentID: number) => `/counseling/sync-prompt-assignments/${studentID}/`
const TASK_ENDPOINT = (id?: string | number) => (id ? `/task/tasks/${id}/` : '/task/tasks/')
const TASK_REMINDER_ENDPOINT = (pk: number) => `${TASK_ENDPOINT(pk)}remind/`
const BULK_TASK_ENDPOINT = `/task/tasks/bulk-create/`
const REASSIGN_TASK = (taskID: number) => `/task/tasks/${taskID}/reassign/`
const FORM_ENDPOINT = (pk?: number | string) => (pk ? `/task/forms/${pk}/` : '/task/forms/')
const FORM_SUBMISSION_ENDPOINT = (pk?: number | string) =>
  pk ? `/task/form-submissions/${pk}/` : '/task/form-submissions/'
const TASK_TEMPLATE_ENDPOINT = (id?: string | number) => (id ? `/task/task-templates/${id}/` : '/task/task-templates/')
const SCHOOL_RESEARCH_TASK_ENDPOINT = '/task/tasks/create-research-task/'
const COLLEGE_RESEARCH_SUBMISSION_ENDPOINT = '/task/form-submissions/college-research/'
/**
 * Utility function to pull resources and diagnostic off task, and add everything to store
 */
type TaskNestedFields = {
  resources: Resource[]
  diagnostic: Diagnostic
}
export type BackendTask = Omit<Omit<Task, 'resources'>, 'diagnostic'> & TaskNestedFields

export function extractTask(task: BackendTask | BackendTask[], dispatch: Dispatch, shouldAddTask = true) {
  const taskArr = Array.isArray(task) ? task : [task]
  dispatch(addResources(flatten(map(taskArr, 'resources').filter(d => d))))
  dispatch(addDiagnostics(map(taskArr, 'diagnostic').filter(d => d)))

  const newTasks: Task[] = taskArr.map(task => ({
    ...task,
    resources: map(task.resources, 'pk'),
    diagnostic: task.diagnostic?.pk,
  }))
  if (shouldAddTask) dispatch(addTasks(newTasks))
  return Array.isArray(task) ? newTasks : newTasks[0]
}

/**
 * Sync tasks with Prompt for a student, and then replace all of the student's essay tasks in our store with what
 * is returned
 * @param studentID
 */
export const syncEssayTasks = (studentID: number) => async (dispatch: ReduxDispatch, getState: () => RootState) => {
  try {
    const { data }: { data: Task[] } = await API.post(SYNC_ESSAY_TASKS_ENDPOINT(studentID))
    dispatch(replacePromptTasks(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

export const createTask = (task: Partial<Task>) => async (dispatch: Dispatch) => {
  try {
    const response = await API.post(TASK_ENDPOINT(), task)
    return extractTask(response.data, dispatch)
  } catch (err) {
    throw errorHandler(err)
  }
}

/** Send an individual reminder for a task */
export const sendTaskReminder = (taskPK: number) => async (dispatch: Dispatch) => {
  try {
    const response = await API.post(TASK_REMINDER_ENDPOINT(taskPK))
    return extractTask(response.data, dispatch)
  } catch (err) {
    throw errorHandler(err)
  }
}

export const createBulkTask = (task: Partial<Task>) => async (dispatch: Dispatch) => {
  try {
    const { data: tasks }: { data: BackendTask[] } = await API.post(BULK_TASK_ENDPOINT, task)
    return extractTask(tasks, dispatch)
  } catch (err) {
    throw errorHandler(err)
  }
}

// Thunk that hits dedicated backend action to get or create school research task for a SUD
export const getOrCreateSchoolResearchTask = (sudPK: number) => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: BackendTask } = await API.post(SCHOOL_RESEARCH_TASK_ENDPOINT, {
      student_university_decision: sudPK,
    })
    return extractTask(data, dispatch) as Task
  } catch (err) {
    throw errorHandler(err)
  }
}

/**
 * Reassign a task from one user to another. Note that only admins will be permitted to take this action
 * @param taskID
 * @param newUserId User that task should be assigned to (PK of Django User object)
 */
export const reassignTask = (taskID: number, newUserId: number) => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: Task } = await API.put(REASSIGN_TASK(taskID), { for_user: newUserId })
    dispatch(addTask(data))
    return data
  } catch (err) {
    return errorHandler(err)
  }
}

/**
 * Fetch tasks for current (or specified) user. Related resources will also be fetched
 * and added to resources slice.
 *
 * @param userID Optional ID of user to fetch tasks for
 */
export type fetchTasksFilter = {
  user?: number
  counselor?: number
  task_template?: number
  start?: string // DATE
  end?: string // DATE
}
export const fetchTasks = (filter?: fetchTasksFilter) => async (dispatch: Dispatch) => {
  try {
    const response = await API.get(TASK_ENDPOINT(), { params: filter })
    const result = extractTask(response.data, dispatch) as Task[]
    return result
  } catch (err) {
    throw errorHandler(err)
  }
}

/** Shortcut to fetch tasks for a student (uses fetchTasks thunk) */
export const fetchTasksForStudent = (studentID: number) => async (
  dispatch: ReduxDispatch,
  getState: () => RootState,
) => {
  const student = getState().user.students[studentID]
  return dispatch(fetchTasks({ user: student?.user_id }))
}

/**
 * Delete a task (just sets it to be archived)
 * @param taskID
 */
export const deleteTask = (taskID: number) => async (dispatch: Dispatch) => {
  try {
    const url = TASK_ENDPOINT(taskID)
    await API.delete(url)
    dispatch(removeTask(taskID))
    return true
  } catch (err) {
    return errorHandler(err)
  }
}

/**
 * Fetch a single task, and then add that tasky task to our store
 * @param taskID
 */
export const fetchTask = (taskID: number) => async (dispatch: Dispatch) => {
  try {
    const url = TASK_ENDPOINT(taskID)
    const response = await API.get(url)
    const task: BackendTask = response.data
    return extractTask(task, dispatch)
  } catch (err) {
    return errorHandler(err)
  }
}

/**
 * Update (via PATCH) a single task
 * @param {Task} task
 */
export const updateTask = (task: Partial<Task> & { pk: number }) => async (
  dispatch: Dispatch,
  getState: () => RootState,
) => {
  // Show loading on task
  const existingTask = getState().task.tasks[task.pk]
  if (existingTask) {
    dispatch(addTask({ ...existingTask, loading: true }))
  }
  try {
    const response = await API.patch(TASK_ENDPOINT(task.pk), task)
    return extractTask(response.data, dispatch)
  } catch (err) {
    if (existingTask) {
      dispatch(addTask({ ...existingTask, loading: false }))
    }
    throw errorHandler(err)
  }
}

/** Task Templates CRUD */
export type FetchTaskTemplatesFilter = {
  student?: number
}
export const fetchTaskTemplates = (params?: FetchTaskTemplatesFilter) => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: TaskTemplate[] } = await API.get(TASK_TEMPLATE_ENDPOINT(), { params })
    dispatch(addTaskTemplates(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

export const fetchAllTaskTemplates = () => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: TaskTemplate[] } = await API.get(TASK_TEMPLATE_ENDPOINT())
    dispatch(addTaskTemplates(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

export const fetchTaskTemplate = (taskTemplateID: number | string) => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: TaskTemplate } = await API.get(TASK_TEMPLATE_ENDPOINT(taskTemplateID))
    dispatch(addTaskTemplate(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}
export const createTaskTemplate = (template: Partial<TaskTemplate>) => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: TaskTemplate } = await API.post(TASK_TEMPLATE_ENDPOINT(), template)
    dispatch(addTaskTemplate(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}
// Optional boolean for whether or not tasks related to task template should also be updated
export const updateTaskTemplate = (template: Partial<TaskTemplate> & { update_tasks?: boolean; pk: number }) => async (
  dispatch: ReduxDispatch,
) => {
  try {
    const { data }: { data: TaskTemplate } = await API.patch(TASK_TEMPLATE_ENDPOINT(template.pk), template)
    dispatch(addTaskTemplate(data))
    // We fetch all of our tasks with this template if they were updated
    if (template.update_tasks) await dispatch(fetchTasks({ task_template: template.pk }))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}
export const deleteTaskTemplate = (pk: number) => async (dispatch: Dispatch) => {
  try {
    await API.delete(TASK_TEMPLATE_ENDPOINT(pk))
    dispatch(removeTaskTemplate(pk))
  } catch (err) {
    throw errorHandler(err)
  }
}

/**
 * Fetch all forms
 */
export const fetchTaskForms = () => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: TaskForm[] } = await API.get(FORM_ENDPOINT())
    dispatch(addTaskForms(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

/**
 * Fetch a single form, identified by @param taskFormID
 */
export const fetchTaskForm = (taskFormID: number | string) => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: TaskForm } = await API.get(FORM_ENDPOINT(taskFormID))
    dispatch(addTaskForm(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

/**
 * Create a form
 */
export const createTaskForm = (payload: Partial<TaskForm>) => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: TaskForm } = await API.post(FORM_ENDPOINT(), payload)
    dispatch(addTaskForm(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

/**
 * Fetch a single form submission, identified by @param taskFormSubmissionID
 */
export const fetchTaskFormSubmission = (taskFormSubmissionID: number | string) => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: TaskFormSubmission } = await API.get(FORM_SUBMISSION_ENDPOINT(taskFormSubmissionID))
    dispatch(addTaskFormSubmission(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

/**
 * Fetch a all form submission
 */
export const fetchTaskFormSubmissions = () => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: TaskFormSubmission[] } = await API.get(FORM_SUBMISSION_ENDPOINT())
    dispatch(addTaskFormSubmissions(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

/**
 * Create form submission
 */
export const createTaskFormSubmission = (payload: Partial<TaskFormSubmission>) => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: TaskFormSubmission } = await API.post(FORM_SUBMISSION_ENDPOINT(), payload)
    dispatch(addTaskFormSubmission(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

/**
 * Update task form submission
 */
export const updateTaskFormSubmission = (
  taskFormSubmissionID: number | string,
  payload: Partial<TaskFormSubmission>,
) => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: TaskFormSubmission } = await API.patch(
      FORM_SUBMISSION_ENDPOINT(taskFormSubmissionID),
      payload,
    )
    dispatch(addTaskFormSubmission(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

type FetchCollegeResearchFormSubmissionsFilter = {
  student: number
}

export const fetchCollegeResearchFormSubmissions = (params: FetchCollegeResearchFormSubmissionsFilter) => async (
  dispatch: Dispatch,
) => {
  try {
    const { data }: { data: TaskFormSubmission[] } = await API.get(COLLEGE_RESEARCH_SUBMISSION_ENDPOINT, {
      params,
    })
    dispatch(addTaskFormSubmissions(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}
