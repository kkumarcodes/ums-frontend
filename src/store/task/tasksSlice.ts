import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import _, { filter, values } from 'lodash'
import { Task, TaskState, TaskForm, TaskFormSubmission, TaskTemplate } from './tasksTypes'

const initialState: TaskState = {
  tasks: {},
  taskTemplates: {},
  taskForms: {},
  taskFormSubmissions: {},
}

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    addTask(state, action: PayloadAction<Task>) {
      state.tasks[action.payload.pk] = action.payload
    },
    removeTask(state, action: PayloadAction<number>) {
      delete state.tasks[action.payload]
    },
    removeTasks(state, action: PayloadAction<number[]>) {
      state.tasks = filter(state.tasks, t => !action.payload.includes(t.pk))
    },
    addTasks(state, action: PayloadAction<Array<Task>>) {
      state.tasks = { ...state.tasks, ..._.zipObject(_.map(action.payload, 'pk'), action.payload) }
    },
    // Replace all of the prompt tasks in the slice. We remove tasks with a prompt ID, and insert
    // all of the tasks included in our payload
    replacePromptTasks(state, action: PayloadAction<Task[]>) {
      const filteredTasks = values(state.tasks).filter(t => !t.is_prompt_task)
      const allTasks = [...filteredTasks, ...action.payload]
      state.tasks = _.zipObject(_.map(allTasks, 'pk'), allTasks)
    },

    addTaskForm(state, action: PayloadAction<TaskForm>) {
      state.taskForms[action.payload.pk] = action.payload
    },
    addTaskTemplate(state, action: PayloadAction<TaskTemplate>) {
      state.taskTemplates[action.payload.pk] = action.payload
    },
    addTaskTemplates(state, action: PayloadAction<Array<TaskTemplate>>) {
      state.taskTemplates = { ...state.taskTemplates, ..._.zipObject(_.map(action.payload, 'pk'), action.payload) }
    },
    removeTaskTemplate(state, action: PayloadAction<number>) {
      delete state.taskTemplates[action.payload]
    },
    addTaskForms(state, action: PayloadAction<Array<TaskForm>>) {
      state.taskForms = { ...state.taskForms, ..._.zipObject(_.map(action.payload, 'pk'), action.payload) }
    },
    addTaskFormSubmission(state, action: PayloadAction<TaskFormSubmission>) {
      state.taskFormSubmissions[action.payload.pk] = action.payload
    },
    addTaskFormSubmissions(state, action: PayloadAction<Array<TaskFormSubmission>>) {
      state.taskFormSubmissions = {
        ...state.taskFormSubmissions,
        ..._.zipObject(_.map(action.payload, 'pk'), action.payload),
      }
    },
  },
})

export const {
  addTask,
  addTasks,
  removeTasks,
  addTaskTemplate,
  addTaskTemplates,
  removeTaskTemplate,
  removeTask,
  replacePromptTasks,
  addTaskForm,
  addTaskForms,
  addTaskFormSubmission,
  addTaskFormSubmissions,
} = tasksSlice.actions

export default tasksSlice.reducer
