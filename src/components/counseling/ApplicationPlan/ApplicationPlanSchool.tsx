// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { CheckCircleFilled, MinusCircleOutlined, PlusCircleOutlined } from '@ant-design/icons'
import { Button, Card } from 'antd'
import { renderAppIcons } from 'components/applicationPlan/ApplicationTrackerTable'
import { RichTextEditor } from 'components/common/RichTextEditor'
import { debounce, each, invert, startCase } from 'lodash'
import moment from 'moment-timezone'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import ReactQuill from 'react-quill'
import { useSelector } from 'react-redux'
import { useReduxDispatch } from 'store/store'
import { selectDeadlinesForUniversity, selectUniversitiesObject } from 'store/university/universitySelectors'
import { updateStudentUniversityDecision } from 'store/university/universityThunks'
import {
  CounselorTrackerApplicationStatus,
  CounselorTrackerStatus,
  StudentUniversityDecision
} from 'store/university/universityTypes'
import { selectIsCounselorOrAdmin } from 'store/user/usersSelector'
import ShortAnswerStatus from './ShortAnswerStatus'
import styles from './styles/ApplicationPlan.scss'

const SAVE_NOTE_DEBOUNCE = 700

type Props = {
  studentUniversityDecision: StudentUniversityDecision
  masterView: Views
  setMasterView: React.Dispatch<React.SetStateAction<Views>>
}

enum Views {
  Collapse,
  Expand,
  Undefined,
}

enum LORResponses {
  Required = 'required',
  Optional = 'optional',
}

const OrderedStatus = [
  CounselorTrackerStatus.None,
  CounselorTrackerStatus.Assigned,
  CounselorTrackerStatus.Requested,
  CounselorTrackerStatus.Received,
]
const StatusLabels = invert(CounselorTrackerStatus)
// We update some labels
StatusLabels[CounselorTrackerStatus.Received] = 'completed'
StatusLabels[CounselorTrackerStatus.Requested] = 'in_progress'

const ApplicationPlanSchool = ({ studentUniversityDecision, masterView, setMasterView }: Props) => {
  const editorRef = useRef<ReactQuill>(null)
  const dispatch = useReduxDispatch()

  const isCounselorOrAdmin = useSelector(selectIsCounselorOrAdmin)
  const sud = studentUniversityDecision
  const [view, setView] = useState(Views.Collapse)
  // Details are only displayed for unsubmitted schools unless this is true
  const [showCompletedSchool, setShowCompletedSchool] = useState(false)
  const [additionalRequirementDeadlineNote, setAdditionalRequirementDeadlineNote] = useState(
    studentUniversityDecision.additional_requirement_deadline_note,
  )
  const deadlines = useSelector(selectDeadlinesForUniversity(sud.university))
  const universities = useSelector(selectUniversitiesObject)
  /**
   * useEffect to set all schools to be expanded or collapsed when buttons are clicked on the parent component. It only sets child view state to masterView state if masterView is defined. This is necessary to prevent side effects.
   */
  useEffect(() => {
    if (masterView !== Views.Undefined) {
      setView(masterView)
    }
  }, [masterView])

  // We have to do a little aggregation with letters of recommendation

  const renderLORs = (sud: StudentUniversityDecision) => {
    let lorReq = 0
    let lorOpt = 0
    each(['one', 'two', 'three', 'four'], k => {
      const status = sud[`recommendation_${k}_status`] as CounselorTrackerStatus
      if (status === LORResponses.Required) {
        lorReq += 1
      }
      if (status === LORResponses.Optional) {
        lorOpt += 1
      }
    })
    return (
      <>
        <p>{`${lorReq || 0} Letters Required`}</p>
        <p>{`${lorOpt || 0} Optional Letters`}</p>
      </>
    )
  }

  const showDetails = sud.application_status !== CounselorTrackerApplicationStatus.Submitted || showCompletedSchool

  // Little helper to render our status string and complete (check) icon if complete
  const renderStatus = (status: string | undefined) => {
    if (!status) return ''
    return (
      <p className="status">
        {startCase(StatusLabels[status])}
        {StatusLabels[status] === 'completed' && <CheckCircleFilled className="complete-icon" />}
      </p>
    )
  }

  /**Setting masterView as undefined to prevent side effect from useEffect. Without either of these instances, all schools may expand when individual school's expand button is clicked. */

  const renderButton = () => {
    if (view === Views.Collapse) {
      return (
        <PlusCircleOutlined
          onClick={() => {
            setView(Views.Expand)
            setMasterView(Views.Undefined)
          }}
        />
      )
    }
    return (
      <MinusCircleOutlined
        onClick={() => {
          setView(Views.Collapse)
          setMasterView(Views.Undefined)
        }}
      />
    )
  }

  const saveNoteChange = useCallback(
    debounce((newNote: string) => {
      if (newNote !== sud.additional_requirement_deadline_note) {
        dispatch(updateStudentUniversityDecision(sud.pk, { additional_requirement_deadline_note: newNote }))
      }
    }, SAVE_NOTE_DEBOUNCE),
    [],
  )

  const noteChange = (newNote: string) => {
    setAdditionalRequirementDeadlineNote(newNote)
    saveNoteChange(newNote)
  }
  //finding correct deadline name within that specific university's deadlines. an array of 2-3 objects.
  const renderDeadlineType = () => {
    const sudDead = deadlines.find(deadline => sud.deadline === deadline.pk)
    return sudDead?.type_of_name
  }

  /**Handles conditional logic for the components return.  */
  const renderSchool = (sud: StudentUniversityDecision) => {
    if (view === Views.Expand) {
      return (
        <div className={styles.applicationPlanSchool}>
          <div
            className={`header flex ${sud.target_reach_safety} ${
              sud.application_status === CounselorTrackerApplicationStatus.Submitted && 'submitted'
            }`}
          >
            <div className="info-bar">
              <div className="info-expand-collapse-button">{renderButton()}</div>
              <div className="school">
                {sud.university_name}
                {renderAppIcons(universities[sud.university].accepted_applications)}
              </div>
              <div className="school-items">
                {!sud.submitted && (
                  <>
                    <div className="school-item">
                      {sud.deadline_date
                        ? `Deadline: ${moment.utc(sud.deadline_date).format('MMM Do')} (${
                            renderDeadlineType() || '...'
                          })`
                        : `No Deadline`}
                    </div>
                    <div className="school-item">
                      {sud.goal_date ? `Goal: ${moment(sud.goal_date).format('MMM Do')}` : `No Goal Date`}
                    </div>
                    <div className="school-item">{startCase(sud.application_status?.replace('_', ' '))}</div>
                  </>
                )}
              </div>
              <span
                className={`submitted-expanded ${
                  sud.application_status === CounselorTrackerApplicationStatus.Submitted && 'submitted'
                }`}
              >
                {sud.submitted
                  ? `🎉 Submitted ${moment(sud.submitted).format('MMM Do')} ${''}:${''} ${
                      startCase(sud.target_reach_safety) || `Likelihood Uncertain`
                    }`
                  : startCase(sud.target_reach_safety) || `Likelihood Uncertain`}
              </span>
            </div>
          </div>
          {!showDetails && (
            <div className="complete-content center">
              🎉 Application Submitted.{' '}
              <Button onClick={() => setShowCompletedSchool(true)} type="link">
                Click here to view details
              </Button>
            </div>
          )}
          {showDetails && (
            <div className="content">
              <Card className="elevated" title="Letters of Rec">
                {renderLORs(sud)}
              </Card>
              <Card className="elevated" title="Transcript">
                {renderStatus(sud.transcript_status)}
              </Card>
              <Card className="elevated" title="Test Scores">
                {renderStatus(sud.test_scores_status)}
              </Card>
              <Card className="elevated short-answers" title="Short Answers">
                <ShortAnswerStatus sud={sud.pk} />
              </Card>
              {sud.additional_requirement_deadline && (
                <Card className="elevated addl-req-note" title="Additional Requirement">
                  {isCounselorOrAdmin ? (
                    <RichTextEditor
                      onChange={noteChange}
                      ref={editorRef}
                      shouldFocusOnMount={false}
                      value={additionalRequirementDeadlineNote}
                      placeholder="write something..."
                      initialHtml={sud.additional_requirement_deadline_note}
                    />
                  ) : (
                    <div
                      className="addl-req-note-read-mode"
                      // eslint-disable-next-line react/no-danger
                      dangerouslySetInnerHTML={{
                        __html: sud.additional_requirement_deadline_note,
                      }}
                    />
                  )}
                </Card>
              )}
            </div>
          )}
        </div>
      )
    }
    if (sud.application_status === 'submitted') {
      return (
        <div className={styles.schoolSubCondensedBar}>
          <div className="sub-expand-collapse-button">{renderButton()}</div>
          <div className="school-sub">{sud.university_name}</div>
          <div className="chances-sub">{`🎉 Submitted ${moment(sud.submitted).format('MMM Do')} ${''}:${''} ${
            startCase(sud.target_reach_safety) || `Likelihood Uncertain`
          }`}</div>
        </div>
      )
    }
    return (
      <div className={styles.schoolCondensedBar}>
        <div className={`condensed-bar ${sud.target_reach_safety}`}>
          <div className="condensed-expand-collapse-button">{renderButton()}</div>
          <div className="school">
            {sud.university_name}
            {renderAppIcons(universities[sud.university].accepted_applications)}
          </div>
          <div className="school-items">
            <div className="school-item">
              {sud.deadline_date
                ? `Deadline: ${moment.utc(sud.deadline_date).format('MMM Do')} (${renderDeadlineType(sud.pk) || '...'})`
                : `No Deadline`}
            </div>
            <div className="school-item">
              {sud.goal_date ? `Goal: ${moment(sud.goal_date).format('MMM Do')}` : `No Goal Date`}
            </div>
            <div className="school-item">{startCase(sud.application_status?.replace('_', ' '))}</div>
            <div className="school-item-last">
              {sud.target_reach_safety
                ? sud.target_reach_safety.replace('_', ' ').replace(/\b\S/g, t => t.toUpperCase())
                : `R/T/L Uncertain`}
            </div>
          </div>
        </div>
      </div>
    )
  }
  return renderSchool(sud)
}
export default ApplicationPlanSchool
