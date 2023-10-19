// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Button, Checkbox, Input, Modal, Select } from 'antd'
import { clone, keys, uniq } from 'lodash'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectVisibleModal, selectVisibleModalProps } from 'store/display/displaySelectors'
import { closeModal, showModal } from 'store/display/displaySlice'
import { HighSchoolCourseModalProps, MODALS } from 'store/display/displayTypes'
import { useReduxDispatch } from 'store/store'
import { selectHSCourse, selectIsCounselorOrAdmin, selectIsStudent, selectStudent } from 'store/user/usersSelector'
import { createHSCourse, updateHSCourse } from 'store/user/usersThunks'
import {
  StudentHighSchoolCourse,
  StudentHighSchoolCourseGradingScale,
  StudentHighSchoolCourseLevel,
  StudentHighSchoolCourseSchedule,
  StudentHighSchoolCourseSubject,
} from 'store/user/usersTypes'
import styles from './styles/StudentHighSchoolCourseModal.scss'

/**
 * Renders a modal for creating/editing StudentHighSchoolCourse object
 */
const newCourse: Partial<StudentHighSchoolCourse> = {
  name: '',
  course_level: undefined,
  school_year: undefined,
  grading_scale: undefined,
  schedule: undefined,
  grades: [],
  credits: [],
  credits_na: false,
  course_notes: '',
  cw_equivalent_grades: [],
  include_in_cw_gpa: true,
}

// Number of grades (and credits) student is to receive per grading period.
// Note that except for Yearly, this is one more than the number of grades you expect, because the last grade
// is "Final"
const ScheduleGradesCount = {
  [StudentHighSchoolCourseSchedule.Quarters]: 5,
  [StudentHighSchoolCourseSchedule.Semesters]: 3,
  [StudentHighSchoolCourseSchedule.Trimesters]: 4,
  [StudentHighSchoolCourseSchedule.Yearly]: 1,
  [StudentHighSchoolCourseSchedule.Other]: 1,
}

export const StudentHighSchoolCourseModal = () => {
  const dispatch = useReduxDispatch()

  const [loading, setLoading] = useState(false)
  const visible = useSelector(selectVisibleModal(MODALS.HIGH_SCHOOL_COURSE))
  const isStudent = useSelector(selectIsStudent)
  const modalProps = useSelector(selectVisibleModalProps(MODALS.HIGH_SCHOOL_COURSE)) as HighSchoolCourseModalProps
  const studentID = modalProps?.studentID
  const courseID = modalProps?.courseID
  const student = useSelector(selectStudent(studentID))
  const course = useSelector(selectHSCourse(courseID))
  const [editCourse, setEditCourse] = useState<Partial<StudentHighSchoolCourse>>(clone(newCourse))
  const isCounselorOrAdmin = useSelector(selectIsCounselorOrAdmin)

  const ARRAY_FIELD_KEYS: (keyof StudentHighSchoolCourse)[] = ['grades', 'cw_equivalent_grades', 'credits']

  useEffect(() => {
    if (visible && course) {
      setEditCourse(course)
    } else if (visible && !courseID) {
      setEditCourse(clone(newCourse))
    }
  }, [visible, courseID]) // eslint-disable-line react-hooks/exhaustive-deps

  // Updat the number of grades/credits when schedule changes
  useEffect(() => {
    if (!editCourse.schedule) return
    const desiredGrades = ScheduleGradesCount[editCourse.schedule]
    const newEditCourse = { ...editCourse }
    ARRAY_FIELD_KEYS.forEach(k => {
      let data: string[] = editCourse[k]
      if (!data || data.length === 0) data = new Array(desiredGrades).fill(undefined)
      else if (data.length < desiredGrades) data = data.concat(new Array(desiredGrades - data.length).fill(undefined))
      else if (data.length > desiredGrades) data = data.slice(0, desiredGrades)
      newEditCourse[k] = data
    })

    setEditCourse(newEditCourse)
  }, [editCourse.schedule]) // eslint-disable-line react-hooks/exhaustive-deps

  // Helper that updates a single element in one of our array fields
  const updateArrayField = (fieldName: keyof StudentHighSchoolCourse, idx: number, value: string | number) => {
    const data: string[] = editCourse[fieldName]
    if (data) {
      setEditCourse({ ...editCourse, [fieldName]: data.map((g, i) => (i === idx ? value : g)) })
    }
  }

  const onSubmit = async (addAnother?: boolean) => {
    const props = clone(modalProps)
    setLoading(true)
    const data: Partial<StudentHighSchoolCourse> = {
      ...editCourse,
      student: studentID,
      school_year: props.year,
      grades: (editCourse.grades ?? []).map(g => g || ''),
      credits: (editCourse.credits ?? []).map(g => g || ''),
      planned_course: modalProps.coursePlanning,
    }
    if (modalProps.coursePlanning) {
      delete data.grades
      delete data.cw_equivalent_grades
      data.include_in_cw_gpa = false
    }
    try {
      if (editCourse.pk) await dispatch(updateHSCourse(editCourse.pk, data))
      else await dispatch(createHSCourse(data))
      setLoading(false)
      dispatch(closeModal())
      setEditCourse(clone(newCourse))
      if (addAnother) dispatch(showModal({ modal: MODALS.HIGH_SCHOOL_COURSE, props }))
    } catch {
      setLoading(false)
    }
  }

  const valid = editCourse.schedule && editCourse.name

  const footer = (
    <div className="footer">
      <Button type="default" onClick={() => dispatch(closeModal())}>
        Close
      </Button>
      {!editCourse.pk && (
        <Button loading={loading} disabled={!valid} type="default" onClick={() => onSubmit(true)}>
          Save and Add Another Course
        </Button>
      )}
      <Button loading={loading} disabled={!valid} type="primary" onClick={() => onSubmit(false)}>
        Save and Close
      </Button>
    </div>
  )

  return (
    <Modal
      forceRender
      wrapClassName={styles.studentHighSchoolCourseModal}
      title={`${courseID ? 'Edit' : 'Create'} High School Course ${isStudent ? '' : `for ${student?.first_name}`}`}
      visible={visible}
      footer={footer}
      onCancel={() => dispatch(closeModal())}
    >
      <div className="form-container">
        <div className="form-group">
          <label>Subject</label>
          <Select value={editCourse.subject} onChange={v => setEditCourse({ ...editCourse, subject: v })}>
            {keys(StudentHighSchoolCourseSubject).map(s => (
              <Select.Option value={s} key={s}>
                {s}
              </Select.Option>
            ))}
          </Select>
        </div>
        <div className="form-group">
          <label>Course Name</label>
          <Input value={editCourse.name} onChange={e => setEditCourse({ ...editCourse, name: e.target.value })} />
        </div>
        <div className="form-group">
          <label>School</label>
          <Select value={editCourse.high_school} onChange={v => setEditCourse({ ...editCourse, high_school: v })}>
            {uniq([student?.high_school].concat(student?.high_schools).filter(x => x)).map(s => (
              <Select.Option value={s} key={s}>
                {s}
              </Select.Option>
            ))}
          </Select>
        </div>
        <div className="form-group">
          <label>Level</label>
          <Select value={editCourse.course_level} onChange={v => setEditCourse({ ...editCourse, course_level: v })}>
            {keys(StudentHighSchoolCourseLevel).map(s => (
              <Select.Option value={s} key={s}>
                {s}
              </Select.Option>
            ))}
          </Select>
        </div>
        <div className="form-group">
          <label>Grading Scale</label>
          <Select value={editCourse.grading_scale} onChange={v => setEditCourse({ ...editCourse, grading_scale: v })}>
            {keys(StudentHighSchoolCourseGradingScale).map(s => (
              <Select.Option value={s} key={s}>
                {s}
              </Select.Option>
            ))}
          </Select>
        </div>
        <div className="form-group">
          <label>Schedule</label>
          <Select value={editCourse.schedule} onChange={v => setEditCourse({ ...editCourse, schedule: v })}>
            {keys(StudentHighSchoolCourseSchedule).map(s => (
              <Select.Option value={s} key={s}>
                {s}
              </Select.Option>
            ))}
          </Select>
        </div>

        {!modalProps?.coursePlanning && (
          <div className="form-group">
            <label>Grades</label>
            <div className="grades-container">
              {!editCourse.schedule && <span className="help">Select a schedule...</span>}
              {(editCourse.grades ?? []).map((g, idx) => (
                <div className="grade-item" key={idx}>
                  <label>{idx !== (editCourse.grades ?? []).length - 1 ? idx + 1 : 'Final'}</label>
                  <Input
                    value={editCourse.grades ? editCourse.grades[idx] : ''}
                    onChange={e => updateArrayField('grades', idx, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="form-group">
          <label>Credits</label>
          <div className="credits-container">
            {!editCourse.schedule && <span className="help">Select a schedule...</span>}
            {(editCourse.credits ?? []).map((g, idx) => (
              <div className="credit-item" key={idx}>
                <label>{idx !== (editCourse.credits ?? []).length - 1 ? idx + 1 : 'Final'}</label>
                <Input
                  value={editCourse.credits ? editCourse.credits[idx] : ''}
                  onChange={e => updateArrayField('credits', idx, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
        {isCounselorOrAdmin && !modalProps?.coursePlanning && (
          <>
            <div className="form-group">
              <label>CW Equivalent</label>
              <div className="cw-equiv-container">
                {!editCourse.schedule && <span className="help">Select a schedule...</span>}
                {(editCourse.cw_equivalent_grades ?? []).map((g, idx) => (
                  <div className="grade-item" key={idx}>
                    <label>{idx !== (editCourse.cw_equivalent_grades ?? []).length - 1 ? idx + 1 : 'Final'}</label>
                    <Input
                      type="number"
                      value={editCourse.cw_equivalent_grades ? editCourse.cw_equivalent_grades[idx] : ''}
                      onChange={e => updateArrayField('cw_equivalent_grades', idx, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
            <p className="help">
              Please only enter a final grade only if the student’s school has a final grade listed on the transcript.
              When a final grade is entered, it will override term grades that have been entered.
            </p>
            <div className="right">
              <Checkbox
                checked={editCourse.include_in_cw_gpa}
                onChange={v => setEditCourse({ ...editCourse, include_in_cw_gpa: v.target.checked })}
              >
                Include in CW GPA
              </Checkbox>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
