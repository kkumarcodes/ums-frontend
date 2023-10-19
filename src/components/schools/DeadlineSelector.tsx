// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { EditOutlined } from '@ant-design/icons'
import { Button, DatePicker, Input, message, Popover, Spin } from 'antd'
import { sortBy, throttle } from 'lodash'
import moment, { Moment } from 'moment-timezone'
import React, { useState, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { useReduxDispatch } from 'store/store'
import { selectDeadlinesForUniversity } from 'store/university/universitySelectors'
import { updateStudentUniversityDecision } from 'store/university/universityThunks'
import { StudentUniversityDecision } from 'store/university/universityTypes'
import { selectIsCounselorOrAdmin } from 'store/user/usersSelector'
import styles from './styles/DeadlineSelector.scss'

type Props = {
  studentUniversityDecision: StudentUniversityDecision
}

const NAME_CHANGE_THROTTLE_TIMEOUT = 1500

const DeadlineSelector = ({ studentUniversityDecision }: Props) => {
  const [loading, setLoading] = useState(false)
  const [visible, setVisible] = useState(false)
  const [customDeadlineName, setCustomDeadlineName] = useState(
    studentUniversityDecision.custom_deadline_description || '',
  )

  const dispatch = useReduxDispatch()

  const isCounselorOrAdmin = useSelector(selectIsCounselorOrAdmin)
  const deadlines = sortBy(useSelector(selectDeadlinesForUniversity(studentUniversityDecision.university)), 'enddate')

  const selectedDeadline = studentUniversityDecision.deadline
    ? deadlines.find(d => d.pk === studentUniversityDecision.deadline)
    : null

  const onSelect = (deadline: number | null, customDeadline: Moment | null, customDeadlineName?: string) => {
    setLoading(true)
    dispatch(
      updateStudentUniversityDecision(studentUniversityDecision.pk, {
        deadline,
        custom_deadline_description: customDeadlineName,
        custom_deadline: customDeadline ? customDeadline.toISOString() : null,
      }),
    )
      .catch(e => message.error('Failed to update selected deadline'))
      .finally(() => {
        setLoading(false)
        setVisible(false)
      })
  }

  const saveDeadlineName = useCallback(
    throttle((name: string) => {
      dispatch(
        updateStudentUniversityDecision(studentUniversityDecision.pk, {
          custom_deadline_description: name,
        }),
      )
    }, NAME_CHANGE_THROTTLE_TIMEOUT),
    [],
  )

  const handleNameChange = (name: string) => {
    setCustomDeadlineName(name)
    saveDeadlineName(name)
  }

  // Render dropdown to choose a deadline, including option to choose custom deadline
  const popoverContent = (
    <div className={styles.popoverContent}>
      <h4>Deadlines</h4>
      <div className="deadlines-container">
        {deadlines.map(d => (
          <div className="deadline" key={d.pk}>
            <span className="deadline-type-of">{d.type_of_name}</span>
            <span className="deadline-date">{moment.utc(d.enddate).format('MM/D')}</span>
            <span className="select-deadline">
              <Button type="primary" size="small" onClick={() => onSelect(d.pk, null)}>
                Select
              </Button>
            </span>
          </div>
        ))}
      </div>
      <div className="custom-deadline">
        <h4>Set deadline name</h4>
        <div className="custom-deadline-name-input">
          <Input value={customDeadlineName} onChange={e => handleNameChange(e.target.value)} />
        </div>
        <h4>Set custom deadline</h4>
        <div className="datepicker center">
          <DatePicker
            showToday={false}
            value={
              studentUniversityDecision.custom_deadline ? moment.utc(studentUniversityDecision.custom_deadline) : null
            }
            onChange={d => onSelect(null, d, customDeadlineName)}
          />
        </div>
      </div>
      {(studentUniversityDecision.deadline || studentUniversityDecision.custom_deadline) && (
        <div className="right remove">
          <Button type="default" size="small" onClick={() => onSelect(null, null, '')}>
            Remove Deadline
          </Button>
        </div>
      )}
    </div>
  )

  let deadlineDisplay = isCounselorOrAdmin ? 'Set Deadline...' : ''
  if (selectedDeadline) {
    deadlineDisplay = `${moment.utc(selectedDeadline.enddate).format('MMM Do')} (${selectedDeadline.type_of_name})`
  } else if (studentUniversityDecision.custom_deadline) {
    deadlineDisplay = `${studentUniversityDecision?.custom_deadline_description} ${moment
      .utc(studentUniversityDecision.custom_deadline)
      .format('MMM Do')}`
  }

  return (
    <div className={styles.deadlineSelector}>
      <Popover
        content={popoverContent}
        trigger={['click']}
        visible={visible}
        onVisibleChange={v => setVisible(v && isCounselorOrAdmin)}
      >
        <span className="deadline-display">
          {loading && <Spin />}
          {deadlineDisplay}
          {isCounselorOrAdmin && <EditOutlined />}
        </span>
      </Popover>
    </div>
  )
}

export default DeadlineSelector
