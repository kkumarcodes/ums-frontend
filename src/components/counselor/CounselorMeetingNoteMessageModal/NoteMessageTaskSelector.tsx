// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import React, { useEffect, useState } from 'react'
import _ from 'lodash'
import { useSelector, shallowEqual } from 'react-redux'
import { useReduxDispatch } from 'store/store'
import { RootState } from 'store/rootReducer'

import { updateCounselorMeeting } from 'store/counseling/counselingThunks'
import styles from './styles/NoteMessageTaskSelector.scss'

enum NoteMessageTaskType {
  Upcoming,
  Completed,
}

type Props = {
  counselorMeetingID: number
  taskType: NoteMessageTaskType
  // This is just a fancy input that allows selecting tasks, so we provide value and onChange
  value: number[]
  onChange: number[]
}

const NoteMessageTaskSelector = ({ counselorMeetingID, taskType, value, onChange }: Props) => {
  const [loading, setLoading] = useState(false)
  const dispatch = useReduxDispatch()

  const {} = useSelector((state: RootState) => {
    return {}
  }, shallowEqual)

  useEffect(() => {
    setLoading(true)
  }, [dispatch])
  return <div className={styles.noteMessageTaskSelector} />
}
export default NoteMessageTaskSelector
