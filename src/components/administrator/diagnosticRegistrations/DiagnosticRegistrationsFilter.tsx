// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React, { useEffect, useState } from 'react'
import _ from 'lodash'
import { useReduxDispatch } from 'store/store'

import { DatePicker, Input } from 'antd'
import styles from 'components/administrator/styles/DiagnosticRegistrations.scss'
import { useDiagnosticRegistrationContext } from './context'

const DiagnosticRegistrationsFilter = () => {
  const [loading, setLoading] = useState(false)
  const dispatch = useReduxDispatch()

  const {
    searchText,
    setSearchText,
    startRegistrationRange,
    setStartRegistrationRange,
    endRegistrationRange,
    setEndRegistrationRange,
    startGTSRange,
    setStartGTSRange,
    endGTSRange,
    setEndGTSRange,
  } = useDiagnosticRegistrationContext()

  // Setup context

  useEffect(() => {
    setLoading(true)
  }, [dispatch])

  const handleRegistrationRange = []

  return (
    <div className={styles.diagnosticRegistrationsFilter}>
      <div>
        <label>Registration Date: </label>
        <DatePicker.RangePicker
          value={[startRegistrationRange, endRegistrationRange]}
          onCalendarChange={d => {
            setStartRegistrationRange(d ? d[0] : null)
            setEndRegistrationRange(d ? d[1] : null)
          }}
        />
      </div>
      <div>
        <label>Diagnostic Date: </label>
        <DatePicker.RangePicker
          value={[startGTSRange, endGTSRange]}
          onCalendarChange={d => {
            setStartGTSRange(d ? d[0] : null)
            setEndGTSRange(d ? d[1] : null)
          }}
        />
      </div>
      <div>
        <label>Search:</label>
        <Input value={searchText} onChange={e => setSearchText(e.target.value)} />
      </div>
    </div>
  )
}

export default DiagnosticRegistrationsFilter
