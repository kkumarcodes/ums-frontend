// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import api from 'store/api'
import _, { sortBy } from 'lodash'
import React, { useEffect, useState } from 'react'
import { Course, GroupTutoringSession } from 'store/tutoring/tutoringTypes'
import Confetti from 'react-confetti'

import ReactDOM from 'react-dom'
import moment from 'moment-timezone'

import { Card, Modal, Input, Form, Skeleton, Select } from 'antd'
import 'style/common/global.scss'
import { CheckCircleTwoTone, CreditCardOutlined } from '@ant-design/icons'
import CourseSelector, { CompleteCourse } from 'components/tutoring/CourseSelector'

const COURSES_ENDPOINT = '/tutoring/courses/?landing=true'
const REGISTER_ENDPOINT = '/user/register/course/'

const CoursesApp = () => {
  const [loading, setLoading] = useState(false)
  const [enrolling, setEnrolling] = useState(false)
  const [courses, setCourses] = useState<CompleteCourse[]>([])
  const [enrollmentForm] = Form.useForm()
  // Course actively being registered for. If set, show modal
  const [registerCourse, setRegisterCourse] = useState<number | null>()
  // Show confirmation modal
  const [showConfirmation, setShowConfirmation] = useState<string>()
  const [showConfetti, setShowConfetti] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    setLoading(true)
    api.get(COURSES_ENDPOINT).then(response => {
      const { data }: { data: CompleteCourse[] } = response
      // Only display courses that are meant to be displayed on landing page and have magento link
      setCourses(
        sortBy(
          data.filter(c => c.magento_purchase_link && c.display_on_landing_page),
          c => (c.group_tutoring_sessions.length ? c.group_tutoring_sessions[0].start : null),
        ),
      )

      setLoading(false)
    })
  }, [])

  const submitEnrollment = async () => {
    try {
      setEnrolling(true)
      setErrors([])
      const formValues = await enrollmentForm.validateFields()
      if (formValues.student_email.toLowerCase() === formValues.parent_email.toLowerCase()) {
        setErrors([
          'Because parents and students each have a UMS account, you cannot use the same email address for both',
        ])
        return
      }
      const timezone = moment.tz.guess()
      await api.post(REGISTER_ENDPOINT, {
        ...formValues,
        course: registerCourse,
        timezone,
      })
      setRegisterCourse(null)
      const course = courses.find(c => c.pk === registerCourse)
      setShowConfirmation(course?.magento_purchase_link)
      setShowConfetti(true)
      setTimeout(() => {
        setShowConfetti(false)
      }, 5000)
    } catch (err) {
      if (err.response.status === 400 && typeof err.response.data === 'object') {
        setErrors(_.flatten(_.values(err.response.data)))
      } else {
        setErrors(['There was an error registering'])
      }
    } finally {
      setEnrolling(false)
    }
  }

  const renderSelectedCourseDescription = () => {
    const selectedCourse: CompleteCourse | undefined = courses.find(c => c.pk === registerCourse)
    if (!selectedCourse) {
      return null
    }
    return (
      <div className="course-description">
        <p className="title">Full Course Schedule for {selectedCourse.name}</p>
        <ul className="flex">
          {sortBy(selectedCourse.group_tutoring_sessions, 'start').map(gts => (
            <li key={gts.pk}>
              {moment(gts.start).tz(moment.tz.guess()).format('MMMM Do')}
              <br />
              {moment(gts.start).tz(moment.tz.guess()).format('h:mma')} to{' '}
              {moment(gts.end).tz(moment.tz.guess()).format('h:mma')} (
              {moment(gts.start).tz(moment.tz.guess()).format('z')})
            </li>
          ))}
        </ul>
      </div>
    )
  }

  const renderModal = () => {
    return (
      <Modal
        title={null}
        className="enroll-modal"
        visible={Boolean(registerCourse)}
        onOk={() => submitEnrollment()}
        confirmLoading={enrolling}
        okText="Enroll 😀"
        onCancel={() => setRegisterCourse(null)}
      >
        {renderSelectedCourseDescription()}
        <Form layout="vertical" form={enrollmentForm}>
          <div className="flex">
            <Form.Item
              label="Student First Name"
              name="student_first_name"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Input type="text" />
            </Form.Item>
            <Form.Item
              label="Student Last Name"
              name="student_last_name"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Input type="text" />
            </Form.Item>
          </div>
          <Form.Item label="Student Email" name="student_email" rules={[{ required: true, message: 'Required' }]}>
            <Input type="email" />
          </Form.Item>
          <div className="flex">
            <Form.Item
              label="Parent First Name"
              name="parent_first_name"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Input type="text" />
            </Form.Item>
            <Form.Item
              label="Parent Last Name"
              name="parent_last_name"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Input type="text" />
            </Form.Item>
          </div>
          <Form.Item label="Parent Email" name="parent_email" rules={[{ required: true, message: 'Required' }]}>
            <Input />
          </Form.Item>
        </Form>
        {errors.length > 0 && <div className="registerErrors center">{errors.join(', ')}</div>}
      </Modal>
    )
  }

  const renderConfirmation = () => {
    return (
      <Modal
        onCancel={() => setShowConfirmation('')}
        visible={Boolean(showConfirmation)}
        className="confirmation-modal"
        footer={null}
      >
        <div className="confirmation">
          <p className="icon">
            <CheckCircleTwoTone twoToneColor="#293a68" />
          </p>
          <p>Account created. Check your email for an invite to our online portal.</p>
          <p>Click the button below to submit payment and complete your enrollment.</p>
        </div>
        <div className="complete-payment">
          <a href={showConfirmation} className="action-button primary">
            Complete Payment <CreditCardOutlined />
          </a>
        </div>
        <p className="center">
          After you complete your payment, check your email for an invite to our online portal: Wise(r)Net.
        </p>
      </Modal>
    )
  }

  return (
    <div className="course-listing">
      {renderModal()}
      {renderConfirmation()}
      {showConfetti && <Confetti />}

      {loading && (
        <>
          <p className="center">Loading...</p>
          <Skeleton />
        </>
      )}
      {!loading && <CourseSelector courses={courses} onSelectCourse={setRegisterCourse} />}
    </div>
  )
}

export default CoursesApp;
