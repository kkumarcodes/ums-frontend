// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React, { useEffect, useState } from 'react'
import _ from 'lodash'
import API from 'store/api'
import { Checkbox, message, Skeleton } from 'antd'
import { Diagnostic } from 'store/diagnostic/diagnosticTypes'
import styles from './Diagnostic.scss'

const DIAGNOSTIC_ENDPOINT = '/tutoring/diagnostics/'

type Props = {
  // Array of PKs of
  onChange: () => number[]
  value: number[]
}

const SelfAssignDiagnostic = ({ onChange, value }: Props) => {
  const [loading, setLoading] = useState(false)
  const [availableDiagnostics, setAvailableDiagnostics] = useState<Diagnostic[]>([])

  // We load and hold self-assignable diagnostics in local state

  useEffect(() => {
    if (!availableDiagnostics.length) {
      setLoading(true)
      API.get(DIAGNOSTIC_ENDPOINT)
        .then(result => {
          setAvailableDiagnostics(result.data)
        })
        .catch(() => message.error('Could not load self-assignable diagnostics'))
        .finally(() => setLoading(false))
    }
  }, [availableDiagnostics.length])

  const options = availableDiagnostics.map(d => ({ value: d.pk, label: d.title }))
  return (
    <div className={styles.selfAssignDiagnostic}>
      <p>Select the diagnostic(s) you would like to self-administer:</p>
      <div className="diag-options-container">
        {loading && <Skeleton />}
        {!loading && <Checkbox.Group options={options} defaultValue={[]} value={value} onChange={onChange} />}
      </div>
    </div>
  )
}
export default SelfAssignDiagnostic
