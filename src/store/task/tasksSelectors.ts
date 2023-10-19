import { createSelector } from '@reduxjs/toolkit'
import { isEmpty, values } from 'lodash'
import { getCounselorMeetings } from 'store/counseling/counselingSelectors'
import { RootState } from 'store/rootReducer'
import { TaskType } from './tasksTypes'

export const getTasks = (state: RootState) => state.task.tasks
export const getTaskTemplates = (state: RootState) => state.task.taskTemplates
export const getTaskForms = (state: RootState) => state.task.taskForms
export const getTaskFormSubmissions = (state: RootState) => state.task.taskFormSubmissions

export const selectTasks = createSelector(getTasks, tasks => values(tasks))
export const selectTaskTemplates = createSelector(getTaskTemplates, taskTemplates => values(taskTemplates))
export const selectTaskForms = createSelector(getTaskForms, taskForm => values(taskForm))
export const selectTaskFormSubmissions = createSelector(getTaskFormSubmissions, taskFormSubmissions =>
  values(taskFormSubmissions),
)
export const selectTasksForStudent = (studentPK?: number, includeSchoolResearch?: boolean) =>
  createSelector(getTasks, tasks =>
    values(tasks).filter(
      t =>
        t.for_student &&
        t.for_student === studentPK &&
        (includeSchoolResearch || t.task_type !== TaskType.SchoolResearch),
    ),
  )
export const selectStudentHasTasks = (studentPK?: number) =>
  createSelector(selectTasksForStudent(studentPK), tasks => !isEmpty(tasks))

export const selectTasksForSUD = (SUDPK?: number) =>
  createSelector(getTasks, t =>
    SUDPK ? values(t).filter(task => task.student_university_decisions.includes(SUDPK)) : [],
  )
export const selectTask = (taskID?: number) => createSelector(getTasks, t => (taskID ? t[taskID] : undefined))
export const selectTaskFormSubmission = (pk?: number) =>
  createSelector(getTaskFormSubmissions, tfs => (pk ? tfs[pk] : undefined))

export const selectTasksForCounselorMeeting = (mtgPK?: number) =>
  createSelector([getTasks, getCounselorMeetings], (tasks, meetings) => {
    const meeting = mtgPK ? meetings[mtgPK] : undefined
    if (!meeting) return []
    return meeting.tasks.map(t => tasks[t]).filter(t => t) // filter out undefineds incase tasks aren't loaded
  })
export const selectTaskTemplate = (pk?: number) =>
  createSelector(getTaskTemplates, templates => (pk ? templates[pk] : undefined))

export const selectTaskForm = (pk?: number | string) =>
  createSelector(getTaskForms, forms => (pk ? forms[Number(pk)] : undefined))

export const selectTaskFormSubmissionForTask = (taskPk?: number) =>
  createSelector(selectTaskFormSubmissions, taskFormSubmissions =>
    taskPk ? taskFormSubmissions.find(tfs => tfs.task === taskPk) : undefined,
  )

/**
 * Select roadmap task templates and counselor created task templates
 */
export const selectRoadmapAndCustomTaskTemplatesForCounselor = (counselorCWUserID?: number) =>
  createSelector(selectTaskTemplates, taskTemplates =>
    taskTemplates.filter(tt => tt.roadmap_key && tt.created_by === counselorCWUserID),
  )
