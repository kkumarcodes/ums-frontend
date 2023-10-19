// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { createCtx } from 'components/administrator'
import { filter, flatten, isEmpty, map, matches, pickBy, values } from 'lodash'
import { Moment } from 'moment'
import { useState } from 'react'
import { useSelector } from 'react-redux'
import { selectCounselorMeeting } from 'store/counseling/counselingSelectors'
import { RootState } from 'store/rootReducer'

// Custom type representing the rows on the task list in our list of tasks when creating a meeting
export type CounselorMeetingTask = {
  taskTemplate?: number // If existing task. Shortcut to make lookups easier
  task?: number // If existing task
  newTask?: string
  due?: string
  student_university_decisions?: number[] // SUDs to associate with the task
}

// Custom type representing agenda items (including custom agenda items)
export type CreateMeetingAgendaItem = {
  agendaItemTemplate?: number
  customAgendaItem?: string
  agendaItem?: number
}

export function useCreateCounselorMeetingCtx() {
  const [templatePK, setTemplatePK] = useState<number>()
  const [title, setTitle] = useState('')
  const [start, hiddenSetStart] = useState<Moment>()
  const [end, setEnd] = useState<Moment>()
  const [durationMinutes, setDurationMinutes] = useState<number | null | undefined>()
  const [editMeeting, setEditMeeting] = useState<number>() // If we are editing an existing meeting (PK)
  const editMeetingTemplateID = useSelector(selectCounselorMeeting(editMeeting))?.counselor_meeting_template
  const [meetingLocation, setMeetingLocation] = useState<number | null>()

  const [meetingAgendaItems, setMeetingAgendaItems] = useState<CreateMeetingAgendaItem[]>([])
  const [meetingTasks, setMeetingTasks] = useState<CounselorMeetingTask[]>([])
  const [student, setStudent] = useState<number>()
  const [studentSchedulable, setStudentSchedulable] = useState(false)
  // We need these store values in our initMeetingTasks helper
  const studentUniversityDecisions = useSelector((state: RootState) =>
    values(state.university.studentUniversityDecisions).filter(s => s.student === student),
  )
  const taskTemplates = useSelector((state: RootState) => state.task.taskTemplates)
  const tasks = useSelector((state: RootState) => pickBy(state.task.tasks, t => t.for_student === student))
  const agendaItemTemplates = useSelector((state: RootState) => state.counseling.agendaItemTemplates)

  // Helper function that just gets the SUDs for our student that should be pulled from tracker for a task
  // with the task template that matches our parameter (filters on the template's include_school_sud_values)
  const getSUDsForTemplate = (taskTemplatePK: number | null | undefined) => {
    if (!taskTemplatePK) return []
    const template = taskTemplates[taskTemplatePK]
    if (!template || isEmpty(template.include_school_sud_values)) return []
    const matcher = matches(template.include_school_sud_values)
    return map(filter(studentUniversityDecisions, matcher), 'pk')
  }

  /** Prepare a new task for addition to our context by ensuring it has the correct due date (adopted from meeting date
   * if not already set), and correct student_university_decisions (based on tracker values) */
  const prepareTask = (counselorMeetingTask: CounselorMeetingTask) => {
    const task = counselorMeetingTask.task ? tasks[counselorMeetingTask.task] : null
    // Task keeps its own due date or gets set on start date
    let due = start ? start.toISOString() : ''
    if (task?.due) due = task.due
    let suds = task?.student_university_decisions || []
    if (!suds.length) {
      suds = getSUDsForTemplate(task ? task.task_template : counselorMeetingTask.taskTemplate)
    }
    return { ...counselorMeetingTask, student_university_decisions: suds, due }
  }

  // Add a new meeting task, and set proper SUDs on it
  const addMeetingTask = (counselorMeetingTask: CounselorMeetingTask) => {
    setMeetingTasks([...meetingTasks, prepareTask(counselorMeetingTask)])
  }
  const addMeetingTasks = (counselorMeetingTasks: CounselorMeetingTask[]) => {
    setMeetingTasks([...meetingTasks, ...map(counselorMeetingTasks, prepareTask)])
  }

  /** Add a new agenda item to our context. Will also add tasks if we're adding an agenda item template
   *
   */
  const extractTasksToAddForAgendaItem = (agendaItem: CreateMeetingAgendaItem) => {
    if (!(agendaItem.agendaItemTemplate && agendaItemTemplates[agendaItem.agendaItemTemplate])) return []
    const existingTasks = map(meetingTasks, 'task')
    const ait = agendaItemTemplates[agendaItem.agendaItemTemplate]
    return values(tasks).filter(t => {
      return (
        !t.completed &&
        t.task_template &&
        ait.pre_meeting_task_templates.includes(t.task_template) &&
        !existingTasks.includes(t.pk)
      )
    })
  }
  const addAgendaItem = (agendaItem: CreateMeetingAgendaItem) => {
    const tasksToAdd = extractTasksToAddForAgendaItem(agendaItem)
    addMeetingTasks(tasksToAdd.map(t => ({ taskTemplate: t.task_template, task: t.pk })))
    setMeetingAgendaItems([...meetingAgendaItems, agendaItem])
  }
  const setAgendaItems = (agendaItems: CreateMeetingAgendaItem[]) => {
    const tasksToAdd = flatten(agendaItems.map(extractTasksToAddForAgendaItem))
    addMeetingTasks(tasksToAdd.map(t => ({ taskTemplate: t.task_template, task: t.pk })))
    setMeetingAgendaItems(agendaItems)
  }

  // When start gets updated, we need to update the due date of related tasks to be new start date if (and only if)
  // they previously had due date of old start date
  const setStart = (moment: Moment | undefined) => {
    if (moment || start) {
      const updatedMeetingTasks = meetingTasks.map(mt => {
        const shouldUpdate = (!mt.due && !start) || (start && mt.due === start.toISOString())
        if (shouldUpdate) mt.due = moment?.toISOString()
        return mt
      })
      setMeetingTasks(updatedMeetingTasks)
    }
    hiddenSetStart(moment)
  }

  const reset = () => {
    setTemplatePK(undefined)
    setTitle('')
    setStart(undefined)
    setEnd(undefined)
    setDurationMinutes(undefined)
    setStudentSchedulable(false)
    setMeetingAgendaItems([])
    setMeetingTasks([])
    setStudent(undefined)
    setEditMeeting(undefined)
  }

  return {
    templatePK,
    setTemplatePK,
    title,
    setTitle,
    start,
    setStart,
    setStartWithoutUpdatingMeetings: hiddenSetStart,
    end,
    setEnd,
    durationMinutes,
    setDurationMinutes,
    meetingAgendaItems,
    setMeetingAgendaItems,
    meetingTasks,
    setMeetingTasks,
    addMeetingTask,
    addMeetingTasks,
    getSUDsForTemplate,
    student,
    setStudent,
    studentSchedulable,
    setStudentSchedulable,
    editMeeting,
    setEditMeeting,
    editMeetingTemplateID,
    addAgendaItem,
    setAgendaItems,
    reset,
    meetingLocation,
    setMeetingLocation,
  }
}

export const [useCounselorMeetingCtx, CounselorMeetingContextProvider] = createCtx<
  ReturnType<typeof useCreateCounselorMeetingCtx>
>()
