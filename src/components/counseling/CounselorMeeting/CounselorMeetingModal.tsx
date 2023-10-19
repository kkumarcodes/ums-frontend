// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { ArrowLeftOutlined } from '@ant-design/icons'
import { Button, Checkbox, message, Modal, Steps, Tooltip } from 'antd'
import Loading from 'components/common/Loading'
import CounselorMeetingForm, {
  CounselorMeetingFormInterface,
} from 'components/counseling/CounselorMeeting/CounselorMeetingForm'
import _, { map, omit } from 'lodash'
import moment from 'moment'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { getCounselorMeetingTemplates, selectCounselorMeeting } from 'store/counseling/counselingSelectors'
import {
  createCounselorMeeting,
  fetchAgendaItems,
  fetchAgendaItemTemplates,
  fetchCounselorMeeting,
  fetchCounselorMeetingTemplates,
  PostCounselorMeeting,
  updateCounselorMeeting,
} from 'store/counseling/counselingThunks'
import { selectActiveModal, selectVisibleModal } from 'store/display/displaySelectors'
import { closeModal } from 'store/display/displaySlice'
import { CounselorMeetingProps, MODALS } from 'store/display/displayTypes'
import { useReduxDispatch } from 'store/store'
import { createTask, fetchTasksForStudent, fetchTaskTemplates, updateTask } from 'store/task/tasksThunks'
import { Task } from 'store/task/tasksTypes'
import { fetchStudentUniversityDecisions } from 'store/university/universityThunks'
import { selectStudent } from 'store/user/usersSelector'
import CounselorMeetingAgendaItems from './CounselorMeetingAgendaItemsForm'
import { CounselorMeetingContextProvider, useCreateCounselorMeetingCtx } from './counselorMeetingContext'
import CounselorMeetingTasks from './CounselorMeetingTasks'
import styles from './styles/CounselorMeetingModal.scss'

enum ModalSteps {
  Meeting,
  Agenda,
  Tasks,
  Submission,
}
const OrderedSteps = [ModalSteps.Meeting, ModalSteps.Agenda, ModalSteps.Tasks, ModalSteps.Submission]

enum LoadingStates {
  LoadStudentData = 'Loading',
  LoadMeetingData = 'Loading Meeting',
}

// Initial idea here was to show useful status messages while saving, but in practice this isn't
// really used (yet?)
enum SubmissionState {
  CreateMeeting = 'Creating Meeting',
  CreateAgendaItems = 'Creating Agenda Items',
  CreateTasks = 'Creating Tasks',
  Complete = 'Complete',
  Failure = 'Whoops',
}

export const CounselorMeetingModal = () => {
  const [loading, setLoading] = useState<LoadingStates>()
  const [saving, setSaving] = useState(false)
  const [fetching, setFetching] = useState(false)
  const dispatch = useReduxDispatch()
  const visible = useSelector(selectVisibleModal(MODALS.COUNSELOR_MEETING))
  const props = useSelector(selectActiveModal)?.modalProps as CounselorMeetingProps
  const [sendNotification, setSendNotification] = useState(true)
  const formRef = useRef<CounselorMeetingFormInterface>()

  // If submission failed, an array of error messages
  const [stepIdx, setStepIdx] = useState(0)
  const step = OrderedSteps[stepIdx]
  const [submissionState, setSubmissionState] = useState(SubmissionState.CreateMeeting)

  // Setup our context
  const ctxValue = useCreateCounselorMeetingCtx()
  const { setStudent, addMeetingTasks } = ctxValue
  const student = useSelector(selectStudent(ctxValue.student))

  // Reset to first step when modal becomes visible
  const editMeetingPK = props?.counselorMeetingID
  const editMeeting = useSelector(selectCounselorMeeting(editMeetingPK))
  const meetingTemplates = useSelector(getCounselorMeetingTemplates)

  // If we have a meeting template and that template stipulates that we don't use an agenda, then we don't
  // create any agenda items or tasks. makes this all easier
  const noAgenda =
    ctxValue.templatePK && meetingTemplates[ctxValue.templatePK] && !meetingTemplates[ctxValue.templatePK].use_agenda

  useEffect(() => {
    if (visible) {
      setStepIdx(0)
    }
  }, [visible])

  // If we are editing a meeting, then we need to seed context data
  useEffect(() => {
    if (visible && editMeeting) {
      // If we are editing a meeting, then we need to set agenda items to include existing agenda items for the meeting

      // We call hidden start here because calling setStart updates our meetingTasks in context, which results
      // in a race condition with setting meetingTasks after meeting fetch finishes
      ctxValue.setStartWithoutUpdatingMeetings(editMeeting.start ? moment(editMeeting.start) : undefined)
      ctxValue.setEnd(editMeeting.end ? moment(editMeeting.end) : undefined)
      ctxValue.setDurationMinutes(editMeeting.duration_minutes)
      ctxValue.setTemplatePK(editMeeting.counselor_meeting_template)
      ctxValue.setStudent(editMeeting.student)
      ctxValue.setTitle(editMeeting.title)
      ctxValue.setStudentSchedulable(editMeeting.student_schedulable)
      ctxValue.setMeetingAgendaItems(editMeeting.agenda_items.map(aiPK => ({ agendaItem: aiPK })))
      ctxValue.setMeetingLocation(editMeeting.location || null)
      // We assume that student tasks are already loaded
      ctxValue.setEditMeeting(editMeeting.pk)
      setSendNotification(true)
    } else if (visible && !editMeeting) {
      ctxValue.setMeetingLocation(null)
    }
  }, [visible, editMeeting]) // eslint-disable-line react-hooks/exhaustive-deps

  // When modal opens, we load agenda item templates. Always
  const studentID = props?.studentID

  const fetchData = useCallback(async () => {
    ctxValue.reset()
    ctxValue.setStudent(studentID)
    setFetching(true)
    await Promise.all([
      dispatch(fetchAgendaItemTemplates({ student: studentID })),
      dispatch(fetchCounselorMeetingTemplates()),
      dispatch(fetchStudentUniversityDecisions({ student: studentID })),
      dispatch(fetchTaskTemplates({ student: studentID })),
      dispatch(fetchTasksForStudent(studentID)),
    ])
    setFetching(false)
    setLoading(editMeetingPK ? LoadingStates.LoadMeetingData : undefined)
  }, [ctxValue, dispatch, editMeetingPK, studentID])

  const fetchMeetingData = useCallback(
    async meetingPK => {
      await Promise.all([
        dispatch(fetchAgendaItems(meetingPK)),
        dispatch(fetchCounselorMeeting(meetingPK)).then(m => {
          addMeetingTasks(m.tasks.map(t => ({ task: t })))
        }),
      ])
      setFetching(false)
      setLoading(undefined)
    },
    [addMeetingTasks, dispatch],
  )

  // When the modal opens and is visible, we kick off our loading process
  useEffect(() => {
    if (visible && !loading && !fetching) {
      setLoading(LoadingStates.LoadStudentData)
      setStudent(studentID)
      fetchData().catch(e => {
        console.warn(e)
        message.warn('Could not load meeting data')
      })
    }
  }, [dispatch, visible]) // eslint-disable-line react-hooks/exhaustive-deps

  // Break out second useEffect to load meeting data AFTER our init data load
  useEffect(() => {
    if (visible && loading === LoadingStates.LoadMeetingData && !fetching) {
      setFetching(true)
      fetchMeetingData(editMeetingPK).then(() => setLoading(undefined))
    }
  }, [loading, visible]) // eslint-disable-line react-hooks/exhaustive-deps

  /** Woot - finally get to create/update our meeting!! */
  const handleSubmit = async () => {
    setSubmissionState(SubmissionState.CreateTasks)
    setSaving(true)
    // First we figure out all of the agenda items, agenda item templates (from which agenda items will be created)
    // and custom agenda items (agenda items that don't have a parent AgendaItemTemplate) to create
    const customAgendaItems: string[] = []
    const agendaItemTemplates: number[] = []
    const agendaItems: number[] = []

    if (!noAgenda) {
      ctxValue.meetingAgendaItems.forEach(ai => {
        if (ai.agendaItemTemplate) agendaItemTemplates.push(ai.agendaItemTemplate)
        else if (ai.customAgendaItem) customAgendaItems.push(ai.customAgendaItem)
        else if (ai.agendaItem) agendaItems.push(ai.agendaItem)
      })
    }
    try {
      // Then we create our custom tasks, with a due date where appropriate
      let customTasks: Task[] = []
      if (!noAgenda) {
        const customTasksToCreate = ctxValue.meetingTasks.filter(t => t.newTask)
        const promises = customTasksToCreate.map(t => {
          const newTask: Partial<Task> = {
            for_user: student?.user_id,
            title: t.newTask,
            due: t.due || null,
            visible_to_counseling_student: !!t.due,
          }
          if (t.taskTemplate) newTask.task_template = t.taskTemplate
          return dispatch(createTask(newTask)).catch(e => message.warn(`Failed to create task for: ${t.newTask}`))
        })
        customTasks = await Promise.all(promises)
        setSubmissionState(SubmissionState.CreateMeeting)
      }
      let { end } = ctxValue
      if (!end && ctxValue.start && ctxValue.durationMinutes) {
        end = moment(ctxValue.start).add(ctxValue.durationMinutes, 'minute')
      }
      const tasks = noAgenda
        ? []
        : ([...map(ctxValue.meetingTasks, 'task').filter(t => t), ...map(customTasks, 'pk')] as number[])
      const data: Partial<PostCounselorMeeting> = {
        title: ctxValue.title,
        start: ctxValue.start?.toISOString(),
        end: end?.toISOString(),
        duration_minutes: ctxValue.durationMinutes,
        student_schedulable: ctxValue.studentSchedulable,
        agenda_item_templates: agendaItemTemplates,
        custom_agenda_items: customAgendaItems,
        counselor_meeting_template: ctxValue.templatePK,
        tasks,
        send_notification: sendNotification,
        location: ctxValue.meetingLocation,
      }
      if (!ctxValue.editMeeting) {
        data.student = ctxValue.student
        await dispatch(createCounselorMeeting(data))
      } else if (!noAgenda) {
        data.agenda_items = agendaItems
        await dispatch(updateCounselorMeeting(ctxValue.editMeeting, data))
      } else if (noAgenda) {
        await dispatch(
          updateCounselorMeeting(
            ctxValue.editMeeting,
            omit(data, ['agenda_item_templates', 'custom_agenda_items', 'tasks']),
          ),
        )
      }

      if (!noAgenda) {
        const tasksNeedingDueDate = ctxValue.meetingTasks.filter(
          t => t.task && (t.due || t.student_university_decisions),
        )
        // Then we set due dates on our non-custom tasks
        await Promise.all(
          tasksNeedingDueDate.map(t =>
            dispatch(
              updateTask({
                pk: t.task as number,
                due: t.due || null,
                visible_to_counseling_student: !!t.due,
                student_university_decisions: t.student_university_decisions || [],
              }),
            ),
          ),
        )
      }
      // All done :)
      ctxValue.reset()
      setSendNotification(true)
      dispatch(closeModal())
    } catch {
      setStepIdx(stepIdx - 1)
      message.warn('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  // We advance to the next step
  const handleContinue = async () => {
    const shouldSubmit = (step === ModalSteps.Meeting && noAgenda) || step === ModalSteps.Tasks
    if (step === ModalSteps.Meeting) {
      // Validate
      try {
        await formRef.current?.validate()
      } catch {
        return
      }
    }
    if (shouldSubmit) handleSubmit()
    setStepIdx(stepIdx + 1)
  }

  const onClose = () => {
    ctxValue.reset()
    dispatch(closeModal())
  }

  let continueText = 'Continue'
  if (step === ModalSteps.Meeting && noAgenda) {
    continueText = 'Create Meeting'
  } else if (step === ModalSteps.Tasks) {
    continueText = editMeetingPK ? 'Update Meeting' : 'Create Meeting'
  } else if (step === ModalSteps.Submission && submissionState !== SubmissionState.Failure) {
    continueText = submissionState
  }

  const footer = (
    <div className="footer flex">
      <div className="left">
        {stepIdx > 0 && (
          <Button type="default" onClick={() => setStepIdx(stepIdx - 1)}>
            <ArrowLeftOutlined /> Previous
          </Button>
        )}
      </div>
      <div className="right">
        {stepIdx === 2 && (
          <Tooltip
            title={`Whether or not ${student?.first_name} should receive a notification confirming this meeting`}
          >
            <Checkbox checked={sendNotification} onChange={e => setSendNotification(e.target.checked)}>
              Notify Student
            </Checkbox>
          </Tooltip>
        )}
        <Button type="default" onClick={onClose}>
          Cancel
        </Button>
        <Button type="primary" onClick={handleContinue} loading={!!(loading || saving)}>
          {continueText}
        </Button>
      </div>
    </div>
  )

  return (
    <Modal
      wrapClassName="counselor-meeting-modal-wrap"
      title="Create Counselor Meeting"
      visible={visible}
      width={740}
      destroyOnClose={true}
      className={styles.counselorMeetingModal}
      footer={footer}
      onCancel={onClose}
    >
      {(loading || saving) && (
        <div className="center">
          <Loading message={loading ? 'Loading meeting data...' : 'Saving...'} />
        </div>
      )}
      {!(loading || saving) && (
        <>
          <Steps current={stepIdx} progressDot size="small">
            <Steps.Step title="Meeting Details" />
            <Steps.Step title={`Agenda Items (${ctxValue.meetingAgendaItems.length})`} />
            <Steps.Step title={`Tasks (${ctxValue.meetingTasks.length})`} />
          </Steps>
          <CounselorMeetingContextProvider value={ctxValue}>
            {step === ModalSteps.Meeting && (
              <CounselorMeetingForm
                ref={formRef}
                counselorMeeting={editMeeting || undefined}
                studentID={props?.studentID}
              />
            )}
            {step === ModalSteps.Agenda && <CounselorMeetingAgendaItems />}
            {step === ModalSteps.Tasks && <CounselorMeetingTasks />}
          </CounselorMeetingContextProvider>
        </>
      )}
    </Modal>
  )
}
