// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import React, { useEffect, useState } from 'react'
import moment, { Moment } from 'moment'
import { sortBy } from 'lodash'
import { useSelector } from 'react-redux'
import { useReduxDispatch } from 'store/store'

import { FetchCounselorTimeCardParams, fetchCounselorTimeCards } from 'store/counseling/counselingThunks'
import { selectIsAdmin } from 'store/user/usersSelector'
import { selectCounselorTimeCards } from 'store/counseling/counselingSelectors'
import Loading from 'components/common/Loading'
import styles from './styles/CounselorTimeCard.scss'
import CounselorTimeCardToolbar from './CounselorTimeCardToolbar'
import CounselorTimeCardTable from './CounselorTimeCardTable'

type Props = {
  counselorIDProp?: number
}

const CounselorTimeCardPage = ({ counselorIDProp }: Props) => {
  // We default to time cards with an end date in the past two weeks
  const [start, setStart] = useState<Moment | undefined>(moment().subtract(14, 'd'))
  const [end, setEnd] = useState<Moment | undefined>(moment())
  const [counselorID, setCounselorID] = useState(counselorIDProp)
  const [loading, setLoading] = useState(false)
  const dispatch = useReduxDispatch()
  const isAdmin = useSelector(selectIsAdmin)

  const timeCards = sortBy(
    useSelector(selectCounselorTimeCards).filter(t => {
      if (counselorID && t.counselor !== counselorID) return false
      if (start && moment(t.end).isBefore(start)) return false
      if (end && moment(t.end).subtract(1, 'd').isAfter(end)) return false
      return true
    }),
    'start',
  )

  useEffect(() => {
    setCounselorID(counselorIDProp)
  }, [counselorIDProp])

  // Fetch time cards when our start/end our counselorID change (including on moount)
  useEffect(() => {
    setLoading(true)

    const fetchFilter: FetchCounselorTimeCardParams = {}
    if (counselorID) {
      fetchFilter.counselor = counselorID
    } else if (start && end) {
      fetchFilter.start = start.toISOString()
      fetchFilter.end = end.toISOString()
    }
    dispatch(fetchCounselorTimeCards(fetchFilter)).then(() => setLoading(false))
  }, [counselorID, dispatch, end, start])
  return (
    <div className={styles.counselorTimeCardPage}>
      <h3>CAP Time Cards</h3>
      {loading && <Loading message="Loading time cards..." />}
      {!loading && (
        <>
          <CounselorTimeCardToolbar
            {...{ start, setStart, end, setEnd, counselorID, setCounselorID }}
            showCounselor={isAdmin}
            showDate={true}
          />
          <CounselorTimeCardTable timeCards={timeCards} />
        </>
      )}
    </div>
  )
}
export default CounselorTimeCardPage
