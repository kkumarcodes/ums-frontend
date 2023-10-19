// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React, { useEffect, useState } from 'react'
import _ from 'lodash'

import { Input, Select } from 'antd'
import { TutoringSessionType } from 'store/tutoring/tutoringTypes'
import { useSelector } from 'react-redux'
import { selectTutoringServices } from 'store/tutoring/tutoringSelectors'
import { fetchTutoringServices } from 'store/tutoring/tutoringThunks'
import { useReduxDispatch } from 'store/store'
import styles from './styles/TutoringSessionNotesModal.scss'
import { useTutoringSessionNotesCtx } from './TutoringSessionNotesModalContext'

/** Component that allows selecting/confirm tutoring session details on the TutoringSessionNotes modal */
const TutoringSessionDetails = () => {
  const ctx = useTutoringSessionNotesCtx()
  const dispatch = useReduxDispatch()

  const tutoringServices = useSelector(selectTutoringServices)
  const filteredServices = tutoringServices.filter(
    s =>
      ((ctx.individualSession && s.applies_to_individual_sessions) ||
        (!ctx.individualSession && s.applies_to_group_sessions)) &&
      s.session_type === ctx.sessionDetails?.sessionType,
  )

  // Load tutoring services if we ain't got none
  useEffect(() => {
    if (tutoringServices.length === 0) {
      dispatch(fetchTutoringServices())
    }
  }, [dispatch, tutoringServices.length])

  if (!ctx.sessionDetails) return null
  return (
    <div className={styles.tutoringSessionDetails}>
      <div className="flex">
        <div className="form-group">
          <label>Session Type:</label>
          <Select
            size="small"
            value={ctx.sessionDetails.sessionType}
            onChange={v => ctx.setSessionDetails({ ...ctx.sessionDetails, sessionType: v })}
          >
            <Select.Option value={TutoringSessionType.Curriculum}>Curriculum</Select.Option>
            <Select.Option value={TutoringSessionType.TestPrep}>Test Prep</Select.Option>
          </Select>
        </div>
        <div className="form-group">
          <label>Subject:</label>
          <Select
            size="small"
            showSearch={true}
            optionFilterProp="children"
            value={ctx.sessionDetails.subject}
            onChange={v => ctx.setSessionDetails({ ...ctx.sessionDetails, subject: v })}
          >
            {filteredServices.map(s => (
              <Select.Option value={s.pk} key={s.pk}>
                {s.name}
              </Select.Option>
            ))}
          </Select>
        </div>
      </div>
      <div className="note-container">
        <label>
          Note <span className="help">visible to you and admins only</span>
        </label>
        <Input.TextArea
          value={ctx.sessionDetails.note}
          onChange={e => ctx.setSessionDetails({ ...ctx.sessionDetails, note: e.target.value })}
        />
      </div>
    </div>
  )
}
export default TutoringSessionDetails
