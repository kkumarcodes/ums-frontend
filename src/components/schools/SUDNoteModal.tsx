// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { ArrowRightOutlined, CaretDownFilled, CaretUpFilled, StarOutlined } from '@ant-design/icons'
import { Button, Input, Row, Tooltip } from 'antd'
import Modal from 'antd/lib/modal/Modal'
import MinimizeModalTitle from 'components/common/MinimizeModalTitle'
import {history} from 'App'
import { compact, map, orderBy, pick, throttle, zipObject } from 'lodash'
import React, { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectVisibleModal, selectVisibleModalProps } from 'store/display/displaySelectors'
import { alterModalVisibility, closeModal, showModal } from 'store/display/displaySlice'
import { MODALS, ModalVisibility, SUDNotesProps } from 'store/display/displayTypes'
import { useReduxDispatch } from 'store/store'
import { getTaskFormSubmissions, selectTasksForStudent } from 'store/task/tasksSelectors'
import { getOrCreateSchoolResearchTask } from 'store/task/tasksThunks'
import { TaskType } from 'store/task/tasksTypes'
import { selectSUDs, selectUniversitiesObject } from 'store/university/universitySelectors'
import { updateStudentUniversityDecision } from 'store/university/universityThunks'
import { StudentUniversityDecision } from 'store/university/universityTypes'
import styles from './styles/SUDNoteModal.scss'

const DEBOUNCE = 1000
const RATING_KEY = 'rating'
const CLOSING_THOUGHTS_KEY = 'closing_thoughts'
// Sub-component for editing a single note in a textarea
const EditSUDNoteTextarea = ({
  studentUniversityDecision,
  universityClosingThoughts,
}: {
  studentUniversityDecision: StudentUniversityDecision
  universityClosingThoughts?: string
}) => {
  const [notes, setNotes] = useState('')
  const dispatch = useReduxDispatch()
  const sudPK = studentUniversityDecision.pk
  useEffect(() => {
    if (studentUniversityDecision.note) {
      setNotes(studentUniversityDecision.note)
    } else {
      setNotes('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sudPK])

  const doAutosave = useCallback(
    throttle((newNote: string) => {
      dispatch(updateStudentUniversityDecision(sudPK, { note: newNote }))
    }, DEBOUNCE),
    [sudPK],
  )

  // Helper method to call debounced autosave and update local note state
  const onChangeNote = (newNote: string) => {
    setNotes(newNote)
    doAutosave(newNote)
  }

  return (
    <div className="edit-sud-note">
      <div>
        <h3 className="left">Notes:</h3>
        <Input.TextArea
          autoSize={{ minRows: 3, maxRows: 8 }}
          value={notes}
          onChange={e => onChangeNote(e.target.value)}
        />
      </div>
      {universityClosingThoughts && (
        <div className="closing-thoughts-wrapper">
          <h3 className="left">Closing Thoughts:</h3>
          <div className="closing-thoughts">{universityClosingThoughts}</div>
        </div>
      )}
    </div>
  )
}

const SUDNoteModal = () => {
  const dispatch = useReduxDispatch()
  const visible = useSelector(selectVisibleModal(MODALS.SUD_NOTES))
  const modalProps = useSelector(selectVisibleModalProps(MODALS.SUD_NOTES)) as SUDNotesProps
  const schoolResearchTasks = useSelector(selectTasksForStudent(modalProps?.studentPK, true)).filter(
    task => task.task_type === TaskType.SchoolResearch,
  )
  const schoolResearchTasksDict = zipObject(map(schoolResearchTasks, 'pk'), schoolResearchTasks)
  const formSubmissionIDs = compact(schoolResearchTasks.map(task => task.form_submission_id))
  const schoolResearchTaskFormSubmissions = pick(useSelector(getTaskFormSubmissions), formSubmissionIDs)
  const [expandedSections, setExpandedSections] = useState<number[]>([])
  const [loadingResearchTask, setLoadingResearchTask] = useState(false)

  const studentUniversityDecisions = orderBy(
    useSelector(selectSUDs(modalProps?.studentUniversityDecisionIDs ?? [])),
    'university_name',
  )

  /**
   * NOTE:
   * If sud hasn't been assigned a school-research task, its taskFormSubmissionId is undefined
   * If sud has been assigned a school-research task - but it hasn't been started, its taskFormSubmissionId is null
   */
  const taskFormSubmissionIDs = studentUniversityDecisions.map(
    sud => schoolResearchTasks.find(task => task.title.includes(sud.university_name))?.form_submission_id,
  )
  // We create a dictionary that links a sud via its pk, its rating and closingThoughts form_field_entries
  // If the sud doesn't have taskFormSubmission, then taskFormSubmissionID (`id`) will be null/undefined,
  // In this case, we return a "default object" ({rating: '', closingThoughts: '' })
  const sudToRatingAndThoughts = zipObject(
    map(studentUniversityDecisions, 'pk'),
    taskFormSubmissionIDs.map(id => {
      // Find associated task, then find ratingFormFieldID and closingThoughtsFormFieldID
      if (id) {
        // We do this for every task because form_fields may be added/removed
        // in future interations of the school-research form
        const schoolResearchTaskFormSubmission = schoolResearchTaskFormSubmissions[id]
        const task = schoolResearchTasksDict[schoolResearchTaskFormSubmission?.task]
        const ratingFormFieldID = task?.form?.form_fields?.find(ff => ff.key === RATING_KEY)?.pk
        const closingThoughtsFormFieldID = task?.form?.form_fields?.find(ff => ff.key === CLOSING_THOUGHTS_KEY)?.pk

        return {
          rating: schoolResearchTaskFormSubmissions[id]?.form_field_entries?.find(
            ffe => ffe.form_field === ratingFormFieldID,
          )?.content,
          closingThoughts: schoolResearchTaskFormSubmissions[id]?.form_field_entries?.find(
            ffe => ffe.form_field === closingThoughtsFormFieldID,
          )?.content,
        }
      }
      return { rating: '', closingThoughts: '' }
    }),
  )

  const universities = useSelector(selectUniversitiesObject)
  const title =
    studentUniversityDecisions.length === 1
      ? `Notes for ${studentUniversityDecisions[0].university_name}`
      : 'School Notes'

  const SUDsLength = studentUniversityDecisions.length
  const firstSUDPK = SUDsLength ? studentUniversityDecisions[0].pk : undefined

  useEffect(() => {
    if (SUDsLength && firstSUDPK) {
      setExpandedSections([firstSUDPK])
    } else {
      setExpandedSections([])
    }
  }, [SUDsLength, firstSUDPK])

  // Minimize this modal and navigate to page with school profile
  const onOpenSchoolProfile = (uniID: number) => {
    const university = universities[uniID]
    if (university && studentUniversityDecisions.length) {
      dispatch(alterModalVisibility({ title, visibility: ModalVisibility.Minimized }))
      History.push(`/school/${university.iped}/student/${studentUniversityDecisions[0].student}/`)
    }
  }

  const toggleExpanded = (sudPK: number) => {
    const idx = expandedSections.indexOf(sudPK)
    setExpandedSections(idx === -1 ? [...expandedSections, sudPK] : expandedSections.filter(a => a !== sudPK))
  }

  // Call our get or create research task on the backend, then open task modal for it
  const showSchoolResearchTask = async (sud: number) => {
    setLoadingResearchTask(true)
    const task = await dispatch(getOrCreateSchoolResearchTask(sud))
    dispatch(showModal({ props: { taskID: task.pk }, modal: MODALS.SUBMIT_TASK }))
    setLoadingResearchTask(false)
  }

  // Render section for a single SUD note
  const renderSchoolNoteTextarea = (studentUniversityDecision: StudentUniversityDecision) => {
    const university = universities[studentUniversityDecision.university]
    const universityRating = sudToRatingAndThoughts[studentUniversityDecision.pk]?.rating
    const universityClosingThoughts = sudToRatingAndThoughts[studentUniversityDecision.pk]?.closingThoughts
    const expanded = expandedSections.includes(studentUniversityDecision.pk)
    const title = (
      <div
        className="sud-title f-subtitle-2"
        onClick={() => toggleExpanded(studentUniversityDecision.pk)}
        tabIndex={0}
        role="button"
        onKeyPress={() => toggleExpanded(studentUniversityDecision.pk)}
      >
        <Row justify="space-between" align="middle">
          <Row align="middle">
            {expanded ? <CaretUpFilled /> : <CaretDownFilled />}
            &nbsp;{university.name}
          </Row>
          {universityRating && (
            <Tooltip title="Rating">
              <Row align="middle" style={{ width: 40 }}>
                <StarOutlined />
                &nbsp;{universityRating}
              </Row>
            </Tooltip>
          )}
        </Row>
      </div>
    )
    return (
      <div className="sud-note" key={studentUniversityDecision.pk}>
        {title}

        {expanded && (
          <div className="right">
            <EditSUDNoteTextarea
              studentUniversityDecision={studentUniversityDecision}
              universityClosingThoughts={universityClosingThoughts}
            />
            {studentUniversityDecision && university && (
              <div className="edit-note-btn-wrapper">
                <Button
                  loading={loadingResearchTask}
                  type="link"
                  className="slim-btn open-research-form-btn"
                  onClick={() => showSchoolResearchTask(studentUniversityDecision.pk)}
                >
                  Open Research Form <ArrowRightOutlined />
                </Button>
                <Button
                  type="link"
                  className="slim-btn"
                  onClick={() => onOpenSchoolProfile(studentUniversityDecision.university)}
                >
                  Open school profile <ArrowRightOutlined />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <Modal
      className={styles.SUDNoteModal}
      visible={visible}
      title={<MinimizeModalTitle title={title} />}
      closable={false}
      onOk={() => dispatch(closeModal())}
      okText="Save and Close"
      cancelButtonProps={{ style: { display: 'none' } }}
    >
      {studentUniversityDecisions.map(renderSchoolNoteTextarea)}
    </Modal>
  )
}
export default SUDNoteModal
