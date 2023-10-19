// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { EditOutlined, SaveOutlined, StopOutlined } from '@ant-design/icons'
import { Button, InputNumber, message } from 'antd'
import { values } from 'lodash'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from 'store/rootReducer'
import { useReduxDispatch } from 'store/store'
import { selectSUD } from 'store/university/universitySelectors'
import { updateStudentUniversityDecision } from 'store/university/universityThunks'
import { getActiveCounselor, selectIsCounselorOrAdmin } from 'store/user/usersSelector'
import styles from './styles/ShortAnswerStatus.scss'

type Props = {
  sud?: number
  student?: number
}

const ShortAnswerStatus = ({ sud, student }: Props) => {
  const dispatch = useReduxDispatch()
  const sudObject = useSelector(selectSUD(sud))
  const activeCounselor = useSelector(getActiveCounselor)
  const isCounselorOrAdmin = useSelector(selectIsCounselorOrAdmin)

  const tasks = useSelector((state: RootState) => {
    if (sud) {
      return values(state.task.tasks).filter(t => t.student_university_decisions.includes(sud) && t.is_prompt_task)
    }
    if (student) {
      return values(state.task.tasks).filter(t => t.for_student === student && t.is_prompt_task)
    }
    return []
  })

  const [isEditing, setIsEditing] = useState(false)
  const [shortAnswerCompletion, setShortAnswerCompletion] = useState<number | undefined>()
  const [saving, setSaving] = useState(false)

  const short_answer_completion = sudObject?.short_answer_completion
  const countCompleted = tasks.filter(t => t.completed).length
  const countTotal = tasks.length
  const countStarted = countTotal - countCompleted

  useEffect(() => {
    if (short_answer_completion) {
      setShortAnswerCompletion(short_answer_completion)
    }
  }, [short_answer_completion, isEditing])

  const handleSave = async e => {
    setSaving(true)
    try {
      await dispatch(updateStudentUniversityDecision(sud, { short_answer_completion: shortAnswerCompletion }))
    } catch (error) {
      message.error('Failed to update; Value must be a number (0-100)')
    }
    setSaving(false)
    setIsEditing(false)
  }

  // Manual case: Counselor's that don't use Prompt will manually set sud.short_answer_completion percentage
  if (isCounselorOrAdmin && !activeCounselor?.prompt) {
    return (
      <div className={`progress-bar-wrapper ${styles.shortAnswerStatus}`}>
        {isEditing ? (
          <InputNumber
            className="short-answer-completion-input"
            value={shortAnswerCompletion}
            onChange={setShortAnswerCompletion}
            onPressEnter={handleSave}
            min={0}
            max={100}
            precision={0}
          />
        ) : (
          <div className="chart">
            <div className="short-answer-completion-value">{` ${short_answer_completion ?? 0} %`}</div>
            <div className="chart-fill" style={{ width: ((short_answer_completion ?? 0) / 100) * 150 }}>
              &nbsp;
            </div>
            &nbsp;
          </div>
        )}
        <Button
          type="link"
          icon={isEditing ? <StopOutlined /> : <EditOutlined />}
          onClick={() => setIsEditing(prev => !prev)}
          disabled={saving}
        />
        {isEditing && <Button type="link" icon={<SaveOutlined />} onClick={handleSave} loading={saving} />}
      </div>
    )
  }

  // Placeholder value (No Task Started)
  if (!countTotal) {
    return (
      <div className={`progress-bar-wrapper ${styles.shortAnswerStatus}`}>
        <div className="summary">{!countTotal && 'Not started'}</div>
        <div className="chart">&nbsp;</div>
      </div>
    )
  }

  // Default case: Calculate short answer status for counselor's that use Prompt
  return (
    <div className={`progress-bar-wrapper ${styles.shortAnswerStatus}`}>
      <div className="summary">
        {countTotal && countCompleted === countTotal
          ? 'Done'
          : `${countStarted}/${countTotal} started; ${countCompleted} complete`}
      </div>
      <div className="chart">
        <div className="chart-fill" style={{ width: (countCompleted / countTotal) * 150 }}>
          &nbsp;
        </div>
        &nbsp;
      </div>
    </div>
  )
}
export default ShortAnswerStatus
