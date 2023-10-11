// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
  CheckOutlined,
  DownloadOutlined,
  EditOutlined,
  FileDoneOutlined,
  InfoCircleOutlined,
  LoadingOutlined,
  ScheduleOutlined,
  SnippetsFilled,
  UserOutlined,
  WarningFilled,
} from '@ant-design/icons'
import { Button, Checkbox, Dropdown, Input, Menu, message, Modal, Popover, Tag, Tooltip, Upload } from 'antd'
import { UploadChangeParam, UploadFile, UploadProps } from 'antd/lib/upload/interface'
import { getFullName, TagColors } from 'components/administrator'
import styles from 'components/administrator/styles/DiagnosticResultKanbanCard.scss'
import moment from 'moment'
import React, { ReactNode, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import {
  fetchDiagnosticResult,
  reassignDiagnosticResult,
  transitionDiagnosticResultState,
  updateDiagnosticResult,
} from 'store/diagnostic/diagnosticThunks'
import { DiagnosticResult, DiagnosticStates, TransitionDiagnosticResultPayload } from 'store/diagnostic/diagnosticTypes'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import { useReduxDispatch } from 'store/store'
import {
  selectAdministrators,
  selectCounselor,
  selectCounselors,
  selectStudent,
  selectStudents,
  selectTutors,
} from 'store/user/usersSelector'
import { updateStudent } from 'store/user/usersThunks'
import { Administrator, Tutor } from 'store/user/usersTypes'
import { PROGRAM_ADVISORS } from '../utils'

interface OwnProps {
  diagnosticResult: DiagnosticResult
}

const PRIMARY_ACTION_COPY = {
  [DiagnosticStates.PENDING_SCORE]: 'Mark Scored',
  [DiagnosticStates.PENDING_RECOMMENDATION]: 'Mark Recommended',
  [DiagnosticStates.PENDING_RETURN]: 'Return to Student',
}

const ORDERED_STATES = [
  DiagnosticStates.PENDING_SCORE,
  DiagnosticStates.PENDING_RECOMMENDATION,
  DiagnosticStates.PENDING_RETURN,
  DiagnosticStates.VISIBLE_TO_STUDENT,
]

const DiagnosticResultCard = (props: OwnProps) => {
  const dispatch = useReduxDispatch()
  // Form field bindings
  const [score, setScore] = useState<number | string>('') // Empty string instead of null so we can pass to input
  const [fileUpload, setFileUpload] = useState<UploadFile | null>(null)
  const [showConfirmation, setshowConfirmation] = useState(false)
  const [returnToStudent, setReturnToStudent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [reassigning, setReassigning] = useState(false)
  const [changingCounselor, setChangingCounselor] = useState(false)
  const [changingAdvisor, setChangingAdvisor] = useState(false)
  const [note, setNote] = useState('') // Var for controlled input to edit note
  const [showNoteModal, setShowNoteModal] = useState(false)

  const admins = useSelector(selectAdministrators)
  const tutors = useSelector(selectTutors)
  const counselors = useSelector(selectCounselors)
  const counselor = useSelector(selectCounselor(props.diagnosticResult.counselor))

  useEffect(() => {
    setNote(props.diagnosticResult.submission_note || '')
  }, [props.diagnosticResult.submission_note])

  const uploadProps: UploadProps = {
    name: 'file',
    showUploadList: false,
    action: '/cw/upload/',
    onChange: (info: UploadChangeParam) => {
      setFileUpload(info.file)
    },
  }

  /**
   * Reassign this diagnostic result's active task to another user
   * @param newUserID
   */
  const doReassign = (newUserID: number) => {
    setReassigning(true)
    dispatch(reassignDiagnosticResult(props.diagnosticResult.pk, newUserID))
      .catch(e => {
        message.error('Failed to reassign')
      })
      .finally(() => setReassigning(false))
  }

  /** Attempt to transition result to next state. Called after popconfirm confirm */
  const advanceState = () => {
    const newState = ORDERED_STATES[ORDERED_STATES.indexOf(props.diagnosticResult.state) + 1]
    const data: TransitionDiagnosticResultPayload = { return_to_student: returnToStudent }
    if (score) {
      data.score = Number(score)
    }
    if (fileUpload) {
      data.recommendation_file_upload = fileUpload.response.slug
    }
    setLoading(true)
    dispatch(transitionDiagnosticResultState(props.diagnosticResult.pk, newState, data)).catch(() => setLoading(false))
  }

  /**
   * Go back to previous state
   */
  const revertState = () => {
    const newState = ORDERED_STATES[ORDERED_STATES.indexOf(props.diagnosticResult.state) - 1]
    setLoading(true)
    dispatch(transitionDiagnosticResultState(props.diagnosticResult.pk, newState, {})).catch(() => setLoading(false))
  }

  /** Renders form that appears in modal upon attempting to advanceState (for states that require info) */
  const renderPopoverContent = () => {
    const confirmationButton = (
      <div className="popoverConfirmation">
        <Button
          type="primary"
          disabled={
            props.diagnosticResult.state === DiagnosticStates.PENDING_RECOMMENDATION &&
            !props.diagnosticResult.recommendation &&
            !fileUpload
          }
          onClick={advanceState}
        >
          Confirm <ArrowRightOutlined />
        </Button>
      </div>
    )
    let innerContent: ReactNode
    if (props.diagnosticResult.state === DiagnosticStates.PENDING_SCORE) {
      innerContent = (
        <div className="inputContainer flex">
          <label>Score:</label>
          <Input type="number" value={score} onChange={e => setScore(Number(e.target.value))} />
        </div>
      )
    } else if (props.diagnosticResult.state === DiagnosticStates.PENDING_RECOMMENDATION) {
      innerContent = (
        <>
          <div className="inputContainer right">
            <Upload {...uploadProps}>
              <Button type="default">
                {fileUpload && (
                  <span>
                    <CheckCircleOutlined /> Change
                  </span>
                )}
                {!fileUpload && <span>Select</span>}
                &nbsp;file...
              </Button>
            </Upload>
          </div>
          <div className="inputContainer right">
            <Checkbox checked={returnToStudent} onChange={e => setReturnToStudent(e.target.checked)}>
              Return to student
            </Checkbox>
          </div>
        </>
      )
    } else if (props.diagnosticResult.state === DiagnosticStates.PENDING_RETURN) {
      innerContent = <p>This diagnostic report will be visible to {props.diagnosticResult.student_name || 'student'}</p>
    }
    return innerContent ? (
      <div className={`formContainer ${styles.diagnosticResultKanbanCardPopover}`}>
        {innerContent}
        <div className="right">{confirmationButton}</div>
      </div>
    ) : null
  }

  /** Render primary action button (advances state). Includes rendering popover when necessary */
  const renderPrimaryAction = () => {
    if (props.diagnosticResult.state === DiagnosticStates.VISIBLE_TO_STUDENT) {
      return null
    }
    const popoverContent = renderPopoverContent()
    const btn = <Button type="primary">{PRIMARY_ACTION_COPY[props.diagnosticResult.state]}</Button>
    if (popoverContent) {
      return (
        <Popover
          content={popoverContent}
          trigger="click"
          visible={showConfirmation && !loading}
          onVisibleChange={setshowConfirmation}
        >
          {btn}
        </Popover>
      )
    }
    return (
      <Button type="primary" onClick={advanceState}>
        {PRIMARY_ACTION_COPY[props.diagnosticResult.state]}
      </Button>
    )
  }

  /** Render secondary action button (previous state). */
  const renderSecondaryAction = () => {
    if (props.diagnosticResult.state === DiagnosticStates.PENDING_SCORE) {
      return null
    }
    return (
      <Button type="default" onClick={revertState}>
        <ArrowLeftOutlined />
        {props.diagnosticResult.state === DiagnosticStates.PENDING_RETURN && <span className="help">Replace Rec</span>}
      </Button>
    )
  }

  /** Download all file uploads associated with diagnostic result */
  const downloadFileUploads = () => {
    props.diagnosticResult.file_uploads.map(fu => window.open(`/cw/upload/${fu.slug}/`))
  }

  /** Renders download button for score/rec report, or notes that there isn't one */
  const renderRecommendationDownload = () => {
    return (
      <div className="details flex">
        {props.diagnosticResult.recommendation ? (
          <Button target="_blank" href={`/cw/upload/${props.diagnosticResult.recommendation}`} type="link">
            <ScheduleOutlined />
            Download Score Reports &amp; Recommendations
          </Button>
        ) : (
          <p className="noDownloads">No ...</p>
        )}
      </div>
    )
  }

  // Open modal with diagnostic registration questionnaire details
  const openQuestionnaireModal = () => {
    dispatch(
      showModal({
        modal: MODALS.DIAGNOSTIC_REGISTRATION_DETAILS,
        props: { diagnosticResultPK: props.diagnosticResult.pk },
      }),
    )
  }

  const updateNote = () => {
    dispatch(updateDiagnosticResult(props.diagnosticResult.pk, { submission_note: note })).then(() => {
      setShowNoteModal(false)
    })
  }

  const renderNote = () => {
    // Render submission note and a modal to edit submission note
    return (
      <>
        <Modal
          title="Update Note"
          className="diagnosticResultModal"
          onOk={updateNote}
          onCancel={_ => setShowNoteModal(false)}
          visible={showNoteModal}
        >
          <Input.TextArea value={note} onChange={e => setNote(e.target.value)} />
        </Modal>
        <Button type="link" onClick={_ => setShowNoteModal(true)}>
          Note <SnippetsFilled />
        </Button>
      </>
    )
  }

  /** Renders option to reassign diagnostic result */
  const renderReassign = () => {
    if (props.diagnosticResult.state === DiagnosticStates.VISIBLE_TO_STUDENT) {
      return null
    }

    const potentialAssignees: Array<Tutor | Administrator> = [].concat(
      admins,
      tutors.filter(t => t.is_diagnostic_evaluator),
    )

    const assignee = potentialAssignees.find(t => t.user_id === props.diagnosticResult.assigned_to)

    const options = (
      <Menu onClick={e => doReassign(Number(e.key))}>
        {potentialAssignees.map(a => (
          <Menu.Item key={a.user_id}>{getFullName(a)}</Menu.Item>
        ))}
      </Menu>
    )
    return (
      <div className="reassign">
        {assignee && (
          <Tag color={TagColors.lightBlue}>
            <CheckOutlined />
            Assigned to {getFullName(assignee)}
          </Tag>
        )}
        <Dropdown overlay={options} trigger={['click']}>
          <Button type="link" loading={reassigning}>
            <UserOutlined /> Reassign...
          </Button>
        </Dropdown>
      </div>
    )
  }

  const submitCounselorChange = async (counselorPK: number) => {
    const data = { counselor: counselorPK }
    setChangingCounselor(true)
    await dispatch(updateStudent(props.diagnosticResult.student, data))
    await dispatch(fetchDiagnosticResult(props.diagnosticResult.pk))
    setChangingCounselor(false)
  }

  const renderEditCounselor = () => {
    const options = (
      <Menu onClick={e => submitCounselorChange(e.key as number)}>
        {counselors.map(counselor => (
          <Menu.Item key={counselor.pk}>{getFullName(counselor)}</Menu.Item>
        ))}
      </Menu>
    )
    return (
      <div>
        <Dropdown overlay={options} trigger={['click']}>
          <Button type="link" loading={changingCounselor}>
            Counselor: {getFullName(counselor)} <EditOutlined />
          </Button>
        </Dropdown>
      </div>
    )
  }

  const submitAdvisorChange = async (advisor: string) => {
    const data = { program_advisor: advisor }
    setChangingAdvisor(true)
    await dispatch(updateStudent(props.diagnosticResult.student, data))
    await dispatch(fetchDiagnosticResult(props.diagnosticResult.pk))
    setChangingAdvisor(false)
  }

  const renderEditAdvisor = () => {
    const options = (
      <Menu onClick={e => submitAdvisorChange(e.key)}>
        {PROGRAM_ADVISORS.map(advisor => (
          <Menu.Item key={advisor}>{advisor}</Menu.Item>
        ))}
      </Menu>
    )
    return (
      <div>
        <Dropdown overlay={options} trigger={['click']}>
          <Button type="link" loading={changingAdvisor}>
            Program Advisor: {props.diagnosticResult.program_advisor} <EditOutlined />
          </Button>
        </Dropdown>
      </div>
    )
  }

  return (
    <div className={`diagnosticResultCard ${styles.diagnosticResultKanbanCard}`}>
      <div className="details flex">
        <p className="name">
          {props.diagnosticResult.student_name}
          {props.diagnosticResult.student_accommodations && (
            <Tooltip title={`Accommodations: ${props.diagnosticResult.student_accommodations}`}>
              <>
                &nbsp;
                <InfoCircleOutlined className="tooltipIcon" />
              </>
            </Tooltip>
          )}
        </p>
        <p className="diagnosticTitle">{props.diagnosticResult.diagnostic_title}</p>
      </div>
      <div className="details flex">
        <p className="submitted">Submitted {moment(props.diagnosticResult.created).format('MMM Do, h:mm a')}</p>
        {props.diagnosticResult.score && <p className="score">Score: {props.diagnosticResult.score}</p>}
      </div>
      <div className="details flex">
        {props.diagnosticResult.file_uploads.length ? (
          <Button onClick={downloadFileUploads} type="link">
            <DownloadOutlined />
            Download Submitted Files ({props.diagnosticResult.file_uploads.length})
          </Button>
        ) : (
          <p className="noDownloads">No files submitted...</p>
        )}
        {props.diagnosticResult.registration_data && (
          <Button onClick={openQuestionnaireModal} type="link">
            <FileDoneOutlined />
            View Questionnaire
          </Button>
        )}
      </div>

      {renderEditCounselor()}
      {renderEditAdvisor()}
      {props.diagnosticResult.submission_note && renderNote()}
      {renderReassign()}

      {[DiagnosticStates.VISIBLE_TO_STUDENT, DiagnosticStates.PENDING_RETURN].includes(props.diagnosticResult.state) &&
        renderRecommendationDownload()}

      {props.diagnosticResult.student_has_multiple_unreturned && (
        <span>
          <WarningFilled className="tooltipIcon" />
          &nbsp;
          {props.diagnosticResult.student_name} has multiple unreturned diagnostic reports
        </span>
      )}
      {loading && (
        <p className="center">
          <LoadingOutlined spin />
        </p>
      )}
      {!loading && (
        <div
          className={`actionsContainer flex ${
            props.diagnosticResult.state === DiagnosticStates.VISIBLE_TO_STUDENT ? 'reverse' : ''
          }`}
        >
          {renderPrimaryAction()}
          {renderSecondaryAction()}
        </div>
      )}
    </div>
  )
}

export default DiagnosticResultCard
