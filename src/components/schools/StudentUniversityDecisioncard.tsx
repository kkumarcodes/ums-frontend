// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import {
  ArrowsAltOutlined,
  BulbOutlined,
  CheckCircleFilled,
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  ShrinkOutlined,
  StarOutlined,
} from '@ant-design/icons'
import { Button, message, Popconfirm, Select, Tooltip } from 'antd'
import { renderAppIcons } from 'components/applicationPlan/ApplicationTrackerTable'
import { map } from 'lodash'
import React, { RefObject, useEffect, useState } from 'react'
import { DraggableProvided } from 'react-beautiful-dnd'
import { useSelector } from 'react-redux'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import { useReduxDispatch } from 'store/store'
import { selectTaskFormSubmission, selectTasksForSUD } from 'store/task/tasksSelectors'
import { fetchTaskFormSubmission, getOrCreateSchoolResearchTask } from 'store/task/tasksThunks'
import { TaskType } from 'store/task/tasksTypes'
import { selectSUD, selectUniversity } from 'store/university/universitySelectors'
import { deleteStudentUniversityDecision, updateStudentUniversityDecision } from 'store/university/universityThunks'
import { IsApplying, TargetReachSafety } from 'store/university/universityTypes'
import { selectIsAdmin, selectIsCounselor, selectIsParent } from 'store/user/usersSelector'
import DeadlineSelector from './DeadlineSelector'
import styles from './styles/SUDCard.scss'

const RATING_KEY = 'rating'

type Props = {
  studentUniversityDecisionPK: number
  displayIsApplying?: boolean
  displayCounselorControls?: boolean
  initialDisplay?: SUDCardDisplay // When this changes we update our internal display state to match
  provided?: DraggableProvided
  innerRef?: string | ((instance: HTMLDivElement | null) => void) | RefObject<HTMLDivElement> | null | undefined
  readOnly?: boolean
  fetchOwnCollegeResearch?: boolean
  displayRTLColor: boolean
}

export enum SUDCardDisplay {
  Standard,
  Condensed,
}

const SUDCard = ({
  studentUniversityDecisionPK,
  displayIsApplying,
  displayCounselorControls,
  initialDisplay = SUDCardDisplay.Standard,
  innerRef,
  provided,
  readOnly = false,
  fetchOwnCollegeResearch = false,
  displayRTLColor = true,
}: Props) => {
  const [deleting, setDeleting] = useState(false)
  const [display, setDisplay] = useState(initialDisplay)
  const [loadingResearchTask, setLoadingResearchTask] = useState(false)
  const dispatch = useReduxDispatch()

  const sud = useSelector(selectSUD(studentUniversityDecisionPK))
  const university = useSelector(selectUniversity(sud?.university))
  const tasks = useSelector(selectTasksForSUD(studentUniversityDecisionPK))
  const schoolResearchTask = tasks.find(task => task.task_type === TaskType.SchoolResearch)
  const ratingFormFieldID = schoolResearchTask?.form?.form_fields?.find(ff => ff.key === RATING_KEY)?.pk
  const schoolResearchTaskFormSubmissionID = schoolResearchTask?.form_submission_id
  const researchTaskFormSubmission = useSelector(selectTaskFormSubmission(schoolResearchTaskFormSubmissionID))

  const isCounselor = useSelector(selectIsCounselor)
  const isAdmin = useSelector(selectIsAdmin)
  const isCounselorOrAdmin = isCounselor || isAdmin
  const isParent = useSelector(selectIsParent)
  readOnly = readOnly || !!isParent

  // Parent can toggle our display between standard/condensed. But note that display can also be toggled
  // internally
  useEffect(() => {
    setDisplay(initialDisplay)
  }, [initialDisplay])

  useEffect(() => {
    if (schoolResearchTaskFormSubmissionID && fetchOwnCollegeResearch) {
      dispatch(fetchTaskFormSubmission(schoolResearchTaskFormSubmissionID))
    }
  }, [dispatch, fetchOwnCollegeResearch, schoolResearchTaskFormSubmissionID])

  /** IMPORTANT! Fail safe to ensure we still return an element with innerRef should we not actually render,
   *  Because all of drag and drop on parent component won't work if there's an innerRef not actually
   *  attached to an element
   */
  if (!sud || !university) {
    return <div ref={innerRef} />
  }
  const updateTarget = (target_reach_safety: TargetReachSafety) => {
    dispatch(updateStudentUniversityDecision(studentUniversityDecisionPK, { target_reach_safety }))
  }

  // Call our get or create research task on the backend, then open task modal for it
  const showSchoolResearchTask = async () => {
    const schoolResearchTask = tasks.find(task => task.task_type === TaskType.SchoolResearch)
    if (schoolResearchTask) {
      dispatch(showModal({ props: { taskID: schoolResearchTask.pk }, modal: MODALS.SUBMIT_TASK }))
      return
    }
    setLoadingResearchTask(true)
    const task = await dispatch(getOrCreateSchoolResearchTask(sud.pk))
    dispatch(showModal({ props: { taskID: task.pk }, modal: MODALS.SUBMIT_TASK }))
    setLoadingResearchTask(false)
  }

  /** Helper render methods */
  const renderStudentResearchButton = () => (
    <Button type="primary" onClick={showSchoolResearchTask} loading={loadingResearchTask}>
      <BulbOutlined />
      {displayCounselorControls ? 'View' : 'Submit'}
      &nbsp;Research
    </Button>
  )
  const renderUniversityStats = () => {
    return (
      <div className="university-stats-container">
        {university.city && (
          <p>
            {university.city}, {university.state}
          </p>
        )}
        {university.scorecard_data.UGDS && <p>{university.scorecard_data.UGDS} Undergrads</p>}
      </div>
    )
  }

  const renderTaskInfo = () => {
    const totalTaskCount = tasks.length
    // Figure out how many task in a batch are completed
    const completedTaskCount = tasks.filter(t => t.completed).length

    return (
      <div className="task-info">
        {completedTaskCount > 0 && completedTaskCount === totalTaskCount && <CheckCircleFilled />}
        {totalTaskCount > 0 && <span>{`${completedTaskCount}/${totalTaskCount}`}</span>}
        {totalTaskCount === 0 && <span>0</span>}
        <div className="tasks-text">Tasks</div>
      </div>
    )
  }

  // Render the <select> for choosing between target/reach/safety
  const renderTargetSelect = () => {
    return (
      <div className="target-select">
        <Select
          disabled={!displayCounselorControls}
          placeholder="Select React/Target/Likely..."
          value={sud.target_reach_safety === TargetReachSafety.None ? undefined : sud.target_reach_safety}
          onSelect={updateTarget}
        >
          {map(TargetReachSafety, (k, v) => (
            <Select.Option key={k} value={k}>
              {v}
            </Select.Option>
          ))}
        </Select>
      </div>
    )
  }

  const doDelete = () => {
    setDeleting(true)
    dispatch(deleteStudentUniversityDecision(sud.pk))
      .catch(() => message.warn('Could not delete school'))
      .finally(() => setDeleting(false))
  }

  // Show modal to edit notes for this StudentUniversityDecision
  const doEditNotes = () => {
    dispatch(
      showModal({
        modal: MODALS.SUD_NOTES,
        props: { studentUniversityDecisionIDs: [sud.pk], studentPK: sud.student },
      }),
    )
  }
  return (
    <div className={styles.sudCard} {...provided?.draggableProps} {...provided?.dragHandleProps} ref={innerRef}>
      {(sud.is_applying === IsApplying.Yes || sud.is_applying === IsApplying.Maybe) && !displayIsApplying && (
        <div className="deadline-selector-container-header">
          <DeadlineSelector studentUniversityDecision={sud} />
        </div>
      )}
      <div className={`title ${displayRTLColor ? sud.target_reach_safety : ''}`}>
        <div className="link-wrapper">
          <Tooltip title="Rating" className={`school-rating ${!researchTaskFormSubmission && 'invisible'}`}>
            <div className="school-rating">
              <StarOutlined />
              &nbsp;
              <span className="rating-value">
                {
                  researchTaskFormSubmission?.form_field_entries?.find(ffe => ffe.form_field === ratingFormFieldID)
                    ?.content
                }
              </span>
            </div>
          </Tooltip>
          <a href={`#/school/${university.iped}/student/${sud.student}/`}>
            <h3>{university.name}</h3>
          </a>
          <Tooltip title="Completed" className={`${schoolResearchTask?.completed ? '' : 'invisible'}`}>
            <CheckCircleOutlined className="research-completed-icon" />
          </Tooltip>
        </div>
        <Button
          type="link"
          className="expand-collapse-btn"
          onClick={() =>
            display === SUDCardDisplay.Standard
              ? setDisplay(SUDCardDisplay.Condensed)
              : setDisplay(SUDCardDisplay.Standard)
          }
        >
          {display === SUDCardDisplay.Standard ? <ShrinkOutlined /> : <ArrowsAltOutlined />}
        </Button>
      </div>
      {display === SUDCardDisplay.Standard && (
        <div className="collapse-container">
          <div className="accepted-application-icons">
            {renderAppIcons(university.accepted_applications)}
            <hr />
          </div>
          <div className="note-container">
            <p className="student-note">{sud.note}</p>
            {!readOnly && (
              <Button type="link" onClick={doEditNotes}>
                <EditOutlined />
                &nbsp;Edit Notes
              </Button>
            )}
          </div>
          <div className="research-container">{renderStudentResearchButton()}</div>
          {(sud.is_applying === IsApplying.Yes || sud.is_applying === IsApplying.Maybe) && displayIsApplying && (
            <div className="deadline-selector-container">
              <DeadlineSelector studentUniversityDecision={sud} />
            </div>
          )}
          {renderUniversityStats()}
          <div className="target-reach-safety-container flex">
            {isCounselorOrAdmin && renderTargetSelect()}
            {renderTaskInfo()}
          </div>
          {isCounselorOrAdmin ? (
            <div className="delete-container right">
              <Popconfirm title="Are you sure you want to permanently delete this school?" onConfirm={doDelete}>
                <Button type="ghost" icon={<DeleteOutlined />} loading={deleting} />
              </Popconfirm>
            </div>
          ) : (
            ''
          )}
        </div>
      )}
    </div>
  )
}

export default React.forwardRef(SUDCard)
