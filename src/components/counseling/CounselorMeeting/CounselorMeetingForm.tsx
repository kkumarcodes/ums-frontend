// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Form, Radio, Row, Select } from 'antd'
import { mergeDateAndTime } from 'components/administrator'
import {
  WrappedCheckbox,
  WrappedDatePicker,
  WrappedEntitySelect,
  WrappedGenericSelect,
  WrappedPersonSelect,
  WrappedTextInput,
  WrappedTimePicker,
} from 'components/common/FormItems'
import styles from 'components/counseling/styles/CounselorMeeting.scss'
import moment, { Moment } from 'moment'
import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectCounselorMeetingTemplates } from 'store/counseling/counselingSelectors'
import { CounselorMeeting } from 'store/counseling/counselingTypes'
import { selectLocationsObject } from 'store/tutoring/tutoringSelectors'
import { selectIsCounselor, selectStudent, selectStudents } from 'store/user/usersSelector'
import { useCounselorMeetingCtx } from './counselorMeetingContext'

const DURATIONS = [15, 30, 45, 60, 90, 120, 150, 180, 210, 240]

type Props = {
  counselorMeeting?: CounselorMeeting
  studentID?: number
}

export interface CounselorMeetingFormInterface {
  validate: () => Promise<any>
}

const CounselorMeetingForm = forwardRef(({ counselorMeeting, studentID }: Props, ref) => {
  const [form] = Form.useForm()
  const context = useCounselorMeetingCtx()
  const locations = useSelector(selectLocationsObject)
  const isCounselor = useSelector(selectIsCounselor)
  const students = useSelector(selectStudents)
  const student = useSelector(selectStudent(context.student))
  const counselorMeetingTemplates = useSelector(selectCounselorMeetingTemplates)
  const meetingTemplatesForStudent = counselorMeetingTemplates.filter(
    cmt => cmt.roadmap && student && (student.roadmaps ?? []).includes(cmt.roadmap),
  )
  const initialDuration = context.start && context.end ? moment(context.end).diff(context.start, 'minutes') : undefined
  // `duration` is a frontend variable used in conjunction with `localDate` and `localTime` to derive the meeting `end` time
  // `durationMinutes` is set by a counselor to fix the length of a meeting in minutes,
  // without having to necessarily set a meeting's `start` or `end` time.
  const [duration, setDuration] = useState<number | undefined>(initialDuration)
  const [localDate, setLocalDate] = useState<Moment>()
  const [localTime, setLocalTime] = useState<Moment>()
  useImperativeHandle(ref, () => ({
    validate: () => form.validateFields(),
  }))

  const meetingPK = counselorMeeting?.pk
  useEffect(() => {
    const { start, title, end, durationMinutes, student, studentSchedulable, templatePK, meetingLocation } = context
    if (meetingPK) {
      // This is a bit tricky, but essentially, if `duration` is currently defined then it has been derived from a
      // meeting's `start` & `end` diff (`initialDuration`)
      // However, if a meeting hasn't been scheduled (no `start` and `end`), but does have a `duration_minutes` set,
      // then he use that as the initial duration for the meeting
      let newDuration = duration || durationMinutes
      if (!newDuration) {
        newDuration = start && end && moment(start) < moment(end) ? moment(end).diff(start, 'minutes') : undefined
      }
      form.setFieldsValue({
        title,
        date: start ? moment(start) : null,
        start: start ? moment(start) : null,
        duration: newDuration || null,
        student,
        student_schedulable: studentSchedulable,
        counselor_meeting_template: templatePK,
        location: meetingLocation,
      })
    } else {
      form.setFieldsValue({
        title,
        date: start ? moment(start) : null,
        start: start ? moment(start) : null,
        duration,
        student,
        student_schedulable: studentSchedulable,
        counselor_meeting_template: templatePK,
        location: meetingLocation,
      })
    }
  }, [context, meetingPK, duration, form])

  // When template changes, we update title
  const onUpdateTemplate = (pk: number) => {
    const oldTemplate = meetingTemplatesForStudent.find(t => t.pk === context.templatePK)
    const newTemplate = meetingTemplatesForStudent.find(t => t.pk === pk)

    if (newTemplate && (!oldTemplate || !context.title || context.title === oldTemplate.title)) {
      form.setFieldsValue({ title: newTemplate.title })
      context.setTitle(newTemplate.title)
    }
    context.setTemplatePK(pk)
  }

  // Either start date/time, or duration changes. Update context.start and context.end appropriately
  const handleUpdateDateComponent = (
    date: Moment | undefined,
    time: Moment | undefined,
    durationParam: number | undefined,
  ) => {
    if (date) setLocalDate(date)
    if (time) setLocalTime(time)
    if (durationParam) setDuration(durationParam)

    date = date || localDate
    time = time || localTime
    durationParam = durationParam || duration

    if (durationParam) {
      context.setDurationMinutes(durationParam)
    }
    if (date && time) {
      const start = moment(mergeDateAndTime(date, time))
      context.setStart(start)
      if (durationParam) {
        context.setEnd(moment(start).add(durationParam, 'm'))
      }
    }
  }

  const showLocation = student?.location_id && !locations[student.location_id].is_remote

  return (
    <div className={styles.CounselorMeetingForm}>
      <Form form={form} layout="vertical">
        <Row justify="space-between" className="student-title-row">
          {!studentID && (
            <WrappedPersonSelect
              name="student"
              label="Student"
              entities={students}
              wrapperCN="student-title student-field"
              value={context.student}
              onChange={context.setStudent}
            />
          )}
          <WrappedGenericSelect
            name="counselor_meeting_template"
            label="Meeting Type"
            placeholder="Select a meeting template"
            entities={meetingTemplatesForStudent}
            isRequired={true}
            propToDisplay="title"
            allowClear={true}
            extra={
              context.editMeetingTemplateID
                ? ''
                : "Only meetings for this student's roadmap will appear. Use the check-in meeting to create a custom meeting."
            }
            wrapperCN="student-title"
            value={context.templatePK}
            onChange={onUpdateTemplate}
          />
        </Row>
        {showLocation && student?.location_id && (
          <Row>
            <Form.Item name="location" label="Meeting Location">
              <Radio.Group onChange={e => context.setMeetingLocation(e.target.value)}>
                <Radio value={student.location_id}>{locations[student.location_id].name} (In-person)</Radio>
                <Radio value={null}>Remote</Radio>
              </Radio.Group>
            </Form.Item>
          </Row>
        )}
        <Row>
          <WrappedTextInput
            name="title"
            label="Meeting Title"
            placeholder="Enter meeting title"
            isRequired={true}
            wrapperCN="student-title"
            value={context.title}
            onChange={e => context.setTitle(e.target.value)}
          />
        </Row>
        <Row justify="space-between">
          <WrappedDatePicker
            name="date"
            label="Select Date"
            isRequired={!!(context.start || localTime)}
            format="M/D/YYYY"
            inputReadOnly
            wrapperCN="date-time"
            allowClear={false}
            onChange={e => handleUpdateDateComponent(e, context.start, duration)}
          />
          <WrappedTimePicker
            name="start"
            label="Start Time"
            isRequired={!!(context.start || localDate)}
            form={form}
            wrapperCN="date-time"
            allowClear={false}
            onChange={e => handleUpdateDateComponent(context.start, e, duration)}
          />
          <WrappedEntitySelect
            name="duration"
            label="Duration (minutes)"
            isRequired={!!(context.start || localDate)}
            entities={DURATIONS}
            showSearch={false}
            allowClear={true}
            placeholder="Select duration"
            wrapperCN="date-time"
            disabled={!!context.durationMinutes && !isCounselor}
            onChange={e => {
              setDuration(e)
              handleUpdateDateComponent(context.start, context.start, e)
            }}
          />
          <WrappedCheckbox
            defaultChecked={false}
            name="student_schedulable"
            label="Student Schedulable"
            checked={context.studentSchedulable}
            onChange={e => context.setStudentSchedulable(e.target.checked)}
          />
        </Row>
      </Form>
    </div>
  )
})

CounselorMeetingForm.displayName = 'CounselorMeetingForm'
export default CounselorMeetingForm
