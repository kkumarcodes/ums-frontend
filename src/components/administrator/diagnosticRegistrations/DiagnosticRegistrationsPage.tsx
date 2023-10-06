// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React, { useEffect, useState } from 'react'
import _ from 'lodash'
import { useSelector } from 'react-redux'
import { useReduxDispatch } from 'store/store'
import { RootState } from 'store/rootReducer'

import styles from 'components/administrator/styles/DiagnosticRegistrations.scss'
import { fetchDiagnosticRegistrations } from 'store/diagnostic/diagnosticThunks'
import { Moment } from 'moment'
import { fetchGroupTutoringSessions } from 'store/tutoring/tutoringThunks'
import moment from 'moment'
import { Skeleton } from 'antd'
import DownloadCSVButton from 'components/common/DownloadCSVButton'
import { CSVDataTypes } from 'components/common/enums'
import { DiagnosticRegistrationContextProvider } from './context'
import DiagnosticRegistrationFilter from './DiagnosticRegistrationsFilter'
import DiagnosticRegistrationsTable from './DiagnosticRegistrationsTable'

export const DiagnosticRegistrationsPage = () => {
  const [loading, setLoading] = useState(true)
  const dispatch = useReduxDispatch()

  const [searchText, setSearchText] = useState('')
  const [startRegistrationRange, setStartRegistrationRange] = useState<Moment | null>(null)
  const [endRegistrationRange, setEndRegistrationRange] = useState<Moment | null>(null)
  const [startGTSRange, setStartGTSRange] = useState<Moment | null>(null)
  const [endGTSRange, setEndGTSRange] = useState<Moment | null>(null)

  const ctxValue = {
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
  }

  const registrations = useSelector((state: RootState) => Object.values(state.diagnostic.diagnosticRegistrations))

  useEffect(() => {
    setLoading(!registrations.length)
    dispatch(fetchDiagnosticRegistrations()).then(() => setLoading(false))
    dispatch(fetchGroupTutoringSessions({ diagnostic: true }))
  }, [dispatch, registrations.length])

  return (
    <div className={styles.diagnosticRegistrationsPage}>
      <div className="title">
        <h1>Diagnostic Registrations</h1>
        <DownloadCSVButton dataType={CSVDataTypes.DiagnosticRegistration} />
      </div>
      {loading && <Skeleton />}

      {!loading && (
        <DiagnosticRegistrationContextProvider value={ctxValue}>
          <DiagnosticRegistrationFilter />
          <DiagnosticRegistrationsTable />
        </DiagnosticRegistrationContextProvider>
      )}
    </div>
  )
}

export default DiagnosticRegistrationsPage
