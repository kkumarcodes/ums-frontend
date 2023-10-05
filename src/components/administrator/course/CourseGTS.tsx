// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { DeleteOutlined, InfoCircleTwoTone, PlusOutlined } from '@ant-design/icons'
import { Button, Card, DatePicker, Form, Input, message, Select } from 'antd'
import { WrappedGenericSelect, WrappedPersonSelect } from 'components/common/FormItems'
import _ from 'lodash'
import moment, { Moment } from 'moment-timezone'
import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectDiagnostics } from 'store/diagnostic/diagnosticSelectors'
import { GroupTutoringSession } from 'store/tutoring/tutoringTypes'
import { selectTutors } from 'store/user/usersSelector'
import styles from './AddCourse.scss'
import { useCourseGTSCtx } from './CourseGTSContext'

export type CourseGTSInterface = {
  getSessions: () => Promise<Partial<GroupTutoringSession>[]>
  getStudentChargeDuration: () => number
  getTutorPayDuration: () => number
}

// Possible durations for sessions
const DURATIONS = [30, 45, 60, 90, 105, 120, 150, 180, 210, 250]

const CourseGTS = forwardRef((_props, ref) => {
  const [duration, setDuration] = useState(90)
  const [studentDuration, setStudentDuration] = useState(90)

  const [errors, setErrors] = useState<string[]>([])
  const tutors = useSelector(selectTutors)
  const diagnostics = useSelector(selectDiagnostics)

  const { GTSCourses, setGTSCourses, timezone } = useCourseGTSCtx()

  // A helper for setting duration that updates end time of existing sessions
  const helpDurationWrapper = (newDuration: number) => {
    setGTSCourses(
      GTSCourses.map(course => ({ ...course, end: moment(course.start).add(newDuration, 'm').toISOString() })),
    )
    setDuration(newDuration)
    setStudentDuration(newDuration)
  }

  useImperativeHandle(ref, () => ({
    getSessions: () => {
      setErrors([])
      const result: Promise<Partial<GroupTutoringSession>[]> = new Promise((resolve, reject) => {
        _.each(GTSCourses, c => {
          if (!c.start) {
            setErrors([...errors, `Session missing start: ${c.title}`])
          }
          if (!c.primary_tutor) {
            setErrors([...errors, `Session missing tutor: ${c.title}`])
          }
        })
        if (errors.length) {
          message.warn(errors[0])
          reject(errors)
        }
        resolve(
          GTSCourses.map(course => {
            // Convert times from timezone to local timezone
            const newCourse: Partial<GroupTutoringSession> = {
              ...course,
              set_charge_student_duration: studentDuration,
              set_pay_tutor_duration: duration,
              start: moment.tz(moment(course.start).format('YYYY-MM-DD HH:mm:ss'), timezone).toISOString(),
            }
            newCourse.end = moment(course.start).add(duration, 'minute').toISOString()
            return newCourse
          }),
        )
      })
      return result
    },
    getStudentChargeDuration: () => studentDuration,
    getTutorPayDuration: () => duration,
  }))

  // When component initializes, we add our first course WITH NO DATE
  useEffect(() => {
    const newCourse: Partial<GroupTutoringSession> = {
      title: 'Session 1',
    }
    setGTSCourses([newCourse])
  }, [setGTSCourses])

  const renderForm = () => {
    return (
      <div className="gts-form">
        <Form layout="horizontal">
          <div className="flex">
            <Form.Item
              label="Session duration (minutes)"
              extra="How long session lasts, including breaks. Also how long a tutor is paid for."
            >
              <Select value={duration} onChange={e => helpDurationWrapper(Number(e))}>
                {DURATIONS.map(d => (
                  <Select.Option value={d} key={d}>
                    {d}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </div>
          <div className="flex">
            <Form.Item
              label="Charge students for (minutes)"
              extra="How many minutes each session costs a student. Exclude breaks"
            >
              <Select value={studentDuration} onChange={e => setStudentDuration(Number(e))}>
                {DURATIONS.map(d => (
                  <Select.Option value={d} key={d}>
                    {d}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </div>
        </Form>
        <div className="errors">
          {errors.map(e => (
            <p className="error" key={e}>
              {e}
            </p>
          ))}
        </div>
      </div>
    )
  }

  // Add a new GTS to our list
  const addGTS = () => {
    // Only allowed if last GTS has a start
    if (!GTSCourses.length || !GTSCourses[GTSCourses.length - 1].start) {
      return null
    }
    const start = moment(GTSCourses[GTSCourses.length - 1].start).add(1, 'week')
    const newCourse: Partial<GroupTutoringSession> = {
      start: start.toISOString(),
      end: moment(start).add(duration, 'minutes').toISOString(),
      title: `Session ${GTSCourses.length + 1}`,
      primary_tutor: GTSCourses[GTSCourses.length - 1].primary_tutor,
    }
    // When adding or removing a course, we sort by date so
    setGTSCourses([...GTSCourses, newCourse])
    return newCourse
  }

  // Remove a GTS from our list
  const removeGTS = (idx: number) => {
    setGTSCourses(GTSCourses.filter((_, i) => i !== idx))
  }

  // Update a single GTS
  const updateGTS = (idx: number, update: Partial<GroupTutoringSession>) => {
    setGTSCourses(
      _.map(GTSCourses, (c, gtsIdx) => {
        if (idx === gtsIdx) {
          return _.assignIn(c, update)
        }
        return c
      }),
    )
  }

  // Update start and end of a GTS
  const changeGTSStart = (idx: number, newStart: Moment | null) => {
    const start = newStart ? newStart.toISOString() : ''
    const end = start ? moment(start).add(duration, 'minutes').toISOString() : ''
    updateGTS(idx, { start, end })
  }

  /** Render one GroupTutoringSEssion, with options to change fields that are editable */
  const renderSingleGTS = (idx: number) => {
    const gts = GTSCourses[idx]
    // Don't allow selecting dates on or before last session
    const previousSessionDate = idx > 0 ? moment(GTSCourses[idx - 1].start) : null
    return (
      <Card size="small" key={idx} title={`${gts.title} - ${moment(gts.start).format('MMMM Do h:mma')}`}>
        <Form layout="horizontal" autoComplete="off">
          <Form.Item label="Title">
            <Input value={gts.title} onChange={e => updateGTS(idx, { title: e.target.value })} />
          </Form.Item>
          <Form.Item label="Date/Time">
            <DatePicker
              showTime={true}
              showSecond={false}
              format="MMM Do h:mma"
              use12Hours
              disabledDate={d => Boolean(previousSessionDate && d < previousSessionDate)}
              minuteStep={15}
              value={gts.start ? moment(gts.start) : undefined}
              onChange={dateMoment => changeGTSStart(idx, dateMoment)}
            />
          </Form.Item>
          <WrappedPersonSelect
            name="tutor"
            label="Tutor"
            entities={tutors}
            isRequired={true}
            wrapperCN={styles.antFormItem}
            defaultValue={gts.primary_tutor}
            value={gts.primary_tutor}
            onChange={v => updateGTS(idx, { primary_tutor: v })}
            autoComplete="do-not-autocomplete"
          />
          <WrappedGenericSelect
            name="diagnostic"
            label="Diagnostic"
            isRequired={false}
            tooltip="Selected diagnostic will be assigned to students when they enroll in the course, and will be due on the date of this session"
            entities={diagnostics}
            propToDisplay="title"
            value={gts.diagnostic}
            onChange={v => updateGTS(idx, { diagnostic: v })}
          />
          <div className="sessionActions">
            {idx > 0 && (
              <Button type="link" className="delete" onClick={() => removeGTS(idx)}>
                <DeleteOutlined />
              </Button>
            )}
          </div>
        </Form>
      </Card>
    )
  }

  /** Render cards for the GroupTutoringSessions */
  const renderGTS = () => {
    if (!GTSCourses.length) {
      return null
    }
    return (
      <div className="gts-container">
        {_.range(GTSCourses.length).map(renderSingleGTS)}
        <Button onClick={addGTS} disabled={!GTSCourses[GTSCourses.length - 1].start}>
          <PlusOutlined /> Add Session
        </Button>
      </div>
    )
  }

  return (
    <div className={styles.addCourseGTS}>
      {renderForm()}
      <div className="timezone-warning center">
        <InfoCircleTwoTone />
        &nbsp; Select times in the timezone of the course location: {timezone}
      </div>
      <div className="cards-container">{renderGTS()}</div>
    </div>
  )
})

CourseGTS.displayName = 'CourseGTS'

export default CourseGTS
