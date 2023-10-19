// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React, { useEffect, useState } from 'react'
import _, { sortBy } from 'lodash'

import { Card, Select } from 'antd'
import moment from 'moment'
import { Course, GroupTutoringSession } from 'store/tutoring/tutoringTypes'
import styles from './styles/CourseSelector.scss'

export interface CompleteCourse extends Omit<Course, 'group_tutoring_sessions'> {
  group_tutoring_sessions: GroupTutoringSession[]
}
type Props = {
  courses: CompleteCourse[]
  showAllSessions?: boolean
  onSelectCourse: (courseID: number) => void
}

const CourseSelector = ({ courses, onSelectCourse, showAllSessions = false }: Props) => {
  const [filterCategory, setFilterCategory] = useState('')
  const categories = _.uniq(_.map(courses, 'category')).sort()

  const firstCourseCategory = categories ? categories[0] : undefined
  useEffect(() => {
    if (firstCourseCategory) {
      setFilterCategory(firstCourseCategory)
    }
  }, [firstCourseCategory])

  const renderCourse = (course: CompleteCourse) => {
    let timeDescription = ''
    const sortedSessions = sortBy(course.group_tutoring_sessions, 'start')
    if (!sortedSessions.length) return ''
    if (course.group_tutoring_sessions.length) {
      const start = moment(sortedSessions[0].start).tz(moment.tz.guess())
      timeDescription = `${course.group_tutoring_sessions.length} session${
        course.group_tutoring_sessions.length !== 1 ? 's' : ''
      } starting on ${start.format('dddd MMM Do')} at ${start.format('h:mma z')}`
    }
    return (
      <Card key={course.pk} className="course" size="small">
        <div className="flex">
          <div className="description-container">
            <p className="title">
              {course.name} (${course.price})
            </p>
            <p className="time-description">{timeDescription}</p>
            {showAllSessions && (
              <ul className="session-list">
                {sortedSessions.map(s => (
                  <li key={s.pk}>{moment(s.start).format('ddd MM Do h:mma z')}</li>
                ))}
              </ul>
            )}
            <p className="description">{course.description}</p>
            {course.primary_tutor_name && <p className="description">Led by {course.primary_tutor_name}</p>}
          </div>
          <div className="enroll-container">
            <a href="#" className="action-button primary" onClick={() => onSelectCourse(course.pk)}>
              Enroll
            </a>
          </div>
        </div>
      </Card>
    )
  }

  const renderCourses = () => {
    const filteredCourses = courses.filter(c => c.category === filterCategory)
    return (
      <div className={`course-selector ${styles.courseSelector}`}>
        <div className="select-container">
          <label>Course category:</label>
          <Select value={filterCategory} onChange={setFilterCategory} showSearch={true} optionFilterProp="children">
            {categories.map(c => (
              <Select.Option value={c} key={c}>
                {c}
              </Select.Option>
            ))}
          </Select>
        </div>
        {filteredCourses.map(renderCourse)}
      </div>
    )
  }

  return <div className="course-selector">{renderCourses()}</div>
}
export default CourseSelector
