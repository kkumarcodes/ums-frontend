// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { SmileTwoTone } from '@ant-design/icons'
import { Input, Modal, notification, Select, Upload } from 'antd'
import { UploadChangeParam, UploadFile as AntUploadFile } from 'antd/lib/upload/interface'
import { getFullName } from 'components/administrator'
import { extend, orderBy } from 'lodash'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { UploadFile } from 'store/common/commonTypes'
import { selectDiagnosticResult, selectDiagnostics } from 'store/diagnostic/diagnosticSelectors'
import { fetchDiagnosticResult, fetchDiagnostics, saveDiagnosticResult } from 'store/diagnostic/diagnosticThunks'
import { DiagnosticResult } from 'store/diagnostic/diagnosticTypes'
import { selectActiveModal, selectVisibleModal, selectVisibleModalProps } from 'store/display/displaySelectors'
import { closeModal } from 'store/display/displaySlice'
import { DiagnosticResultModalProps, MODALS } from 'store/display/displayTypes'
import { useReduxDispatch } from 'store/store'
import { selectStudent, selectStudents } from 'store/user/usersSelector'
import { fetchStudents } from 'store/user/usersThunks'
import styles from './styles/DiagnosticResultModal.scss'

const CREATE_RESULT_COPY = "Your diagnostic is submitted. We'll review your diagnostic and follow up with the results"

const DiagnosticResultModal = () => {
  const dispatch = useReduxDispatch()
  const [uploadedFiles, setUploadedFiles] = useState<Array<UploadFile>>([])
  const [defaultUploadedFiles, setDefaultUploadedFiles] = useState<Array<AntUploadFile>>([])
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Array<string>>([])
  const [submissionNote, setSubmissionNote] = useState('')
  const [selectedDiagnostic, setSelectedDiagnostic] = useState<number>()
  const [selectedStudent, setSelectedStudent] = useState<number>()

  const uploadProps = {
    name: 'file',
    action: '/cw/upload/',
    onChange: (info: UploadChangeParam) => {
      setUploadedFiles(info.fileList.filter(f => f.status === 'done').map(f => f.response))
      setDefaultUploadedFiles(info.fileList)
    },
    fileList: defaultUploadedFiles,
    defaultUploadedFiles,
  }
  const visible = useSelector(selectVisibleModal([MODALS.SUBMIT_DIAGNOSTIC_RESULT, MODALS.REVIEW_DIAGNOSTIC_RESULT]))
  const activeModal = useSelector(selectActiveModal)
  const modalProps = useSelector(
    selectVisibleModalProps([MODALS.SUBMIT_DIAGNOSTIC_RESULT, MODALS.REVIEW_DIAGNOSTIC_RESULT]),
  ) as DiagnosticResultModalProps
  const submitting = visible && activeModal?.modalType === MODALS.SUBMIT_DIAGNOSTIC_RESULT
  const student = useSelector(selectStudent(modalProps?.studentID))
  const diagnosticResult = useSelector(selectDiagnosticResult(modalProps?.diagnosticResultID))
  const students = orderBy(useSelector(selectStudents), 'last_name')
  const diagnostics = useSelector(selectDiagnostics)

  const loadDiagnosticResult =
    modalProps?.diagnosticResultID && !diagnosticResult ? modalProps.diagnosticResultID : null

  // Load DiagnosticResult when necessary
  useEffect(() => {
    if (visible && loadDiagnosticResult) {
      dispatch(fetchDiagnosticResult(loadDiagnosticResult))
    }
  }, [visible, loadDiagnosticResult, dispatch])

  const diagnosticID = modalProps?.diagnosticID
  // Clear form when diagnostic changes (that is diagnostic from modal props ONLY)
  useEffect(() => {
    if (visible) {
      setDefaultUploadedFiles([])
      setUploadedFiles([])
      setSubmissionNote('')
    }
  }, [diagnosticID, visible])

  // Load students and diagnostics when necessary
  // TODO: Let's track in store whether or not we've loaded all students instead of this hackity hack
  const showingAdminOptions = Boolean(modalProps?.showSelectStudentDiagnostic)
  useEffect(() => {
    if (showingAdminOptions) {
      // Always ensure we have up to date diagnostics
      dispatch(fetchDiagnostics())
      // Load students when necessary
      if (students.length < 2) {
        dispatch(fetchStudents({}))
      }
    }
  }, [dispatch, showingAdminOptions, students.length])

  // diagnosticResult changes. Update local state
  useEffect(() => {
    if (!diagnosticResult) {
      return
    }
    setDefaultUploadedFiles(
      diagnosticResult.file_uploads.map(f => ({
        uid: f.slug,
        status: 'done',
        size: 0,
        name: f.name,
        type: '',
      })),
    )
    setSubmissionNote(diagnosticResult.submission_note || '')
  }, [diagnosticResult])

  const submit = () => {
    // First we figure out whether we're submit diag or diag feedback
    if (!submitting) {
      console.warn('Cannot submit diagnostic result that already exists!')
    }
    // Check for errors
    if (!uploadedFiles.length) {
      setErrors(['Please upload at least one file'])
      return
    }
    const diagnosticID = modalProps?.diagnosticID || selectedDiagnostic
    const studentID = modalProps?.studentID || selectedStudent
    if (!diagnosticID || !studentID) {
      console.warn('Cannot submit diagnostic result w/o diagnostic and student!')
    }

    // Create or update diagnosticResult
    const data: Partial<DiagnosticResult> = extend(diagnosticResult || {}, {
      submission_note: submissionNote,
      update_file_uploads: uploadedFiles.map(uf => uf.slug),
      student: studentID,
      diagnostic: diagnosticID,
      file_uploads: [],
    })
    setSaving(true)
    dispatch(saveDiagnosticResult(data))
      .then(() => {
        dispatch(closeModal())
        notification.open({
          message: 'Submitted!',
          description: modalProps?.showSelectStudentDiagnostic ? '' : CREATE_RESULT_COPY,
          icon: <SmileTwoTone />,
        })
      })
      .finally(() => {
        setSaving(false)
      })
  }

  /**
   * Render display of diagnostic result. Is editable if no feedback provided
   * and not providing feedback.
   */
  const renderDiagnosticResult = () => {
    return (
      <div className="submitForm">
        <Upload disabled={!submitting} {...uploadProps}>
          <div className="file-upload-target">
            Select one or more files to upload ...
            <br />
            <small>Hint: Take a picture with your phone</small>
          </div>
        </Upload>
        <Input.TextArea
          rows={3}
          placeholder="Optional note..."
          readOnly={!submitting}
          onChange={e => {
            setSubmissionNote(e.target.value)
          }}
          value={submissionNote}
        />
      </div>
    )
  }

  /** Render form for selecting a student and a diagnostic (admin) */
  const renderSelectStudentDiagnostic = () => {
    return (
      <div className="selectStudentDiagnostic">
        <div className="selectContainer">
          <label>Student:</label>
          <Select value={selectedStudent} onSelect={setSelectedStudent} showSearch={true} optionFilterProp="children">
            {students.map(s => (
              <Select.Option value={s.pk} key={s.pk}>
                {getFullName(s)}
              </Select.Option>
            ))}
          </Select>
        </div>
        <div className="selectContainer">
          <label>Diagnostic:</label>
          <Select
            value={selectedDiagnostic}
            onSelect={setSelectedDiagnostic}
            showSearch={true}
            optionFilterProp="children"
          >
            {diagnostics.map(d => (
              <Select.Option value={d.pk} key={d.pk}>
                {d.title}
              </Select.Option>
            ))}
          </Select>
        </div>
      </div>
    )
  }

  /**
   * Display list of errors, if there are any
   */
  const renderErrors = () => {
    if (errors) {
      return (
        <ul className="modal-errors">
          {errors.map((err, idx) => (
            <li key={idx}>{err}</li>
          ))}
        </ul>
      )
    }
    return null
  }

  return (
    <Modal
      visible={visible}
      className={styles.diagnosticResultModal}
      onOk={submit}
      onCancel={() => {
        dispatch(closeModal())
      }}
      okText="Save"
      confirmLoading={saving}
      title={modalProps?.showSelectStudentDiagnostic ? 'Submit Diagnostic' : `${student?.first_name}'s Diagnostic`}
    >
      {modalProps?.showSelectStudentDiagnostic && renderSelectStudentDiagnostic()}
      {renderDiagnosticResult()}
      {renderErrors()}
    </Modal>
  )
}

export default DiagnosticResultModal
