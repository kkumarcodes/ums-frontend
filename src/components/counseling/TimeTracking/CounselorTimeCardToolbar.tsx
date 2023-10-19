// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import React, { useEffect, useState } from 'react'
import { useSelector, shallowEqual, useDispatch } from 'react-redux'
import { useReduxDispatch } from 'store/store'
import { RootState } from 'store/rootReducer'

import { Moment } from 'moment'
import { Button, DatePicker, Select } from 'antd'
import { PlusCircleOutlined } from '@ant-design/icons'
import { selectCounselors, selectIsAdmin } from 'store/user/usersSelector'
import { getFullName } from 'components/administrator'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import DownloadCSVButton from 'components/common/DownloadCSVButton'
import { CSVDataTypes } from 'components/common/enums'
import { FetchCounselorTimeCardParams } from 'store/counseling/counselingThunks'
import styles from './styles/CounselorTimeCard.scss'

type Props = {
  showDate: boolean
  showCounselor: boolean
  start?: Moment
  setStart?: React.Dispatch<React.SetStateAction<Moment | undefined>>
  end?: Moment
  setEnd?: React.Dispatch<React.SetStateAction<Moment | undefined>>
  counselorID?: number
  setCounselorID?: React.Dispatch<React.SetStateAction<number | undefined>>
}

const CounselorTimeCardToolbar = ({
  showDate,
  showCounselor,
  start,
  end,
  counselorID,
  setStart,
  setEnd,
  setCounselorID,
}: Props) => {
  const isAdmin = useSelector(selectIsAdmin)
  const dispatch = useDispatch()

  const counselors = useSelector(selectCounselors).filter(c => c.part_time)

  const updateDateRange = (dates: [Moment | null, Moment | null] | null, dateStrings: [string, string]) => {
    if (setStart) setStart(dates?.[0] || undefined)
    if (setEnd) setEnd(dates?.[1] || undefined)
  }

  // query params for our download CSV buton
  const fetchFilter: FetchCounselorTimeCardParams = {}
  if (counselorID) {
    fetchFilter.counselor = counselorID
  } else if (start && end) {
    fetchFilter.start = start.toISOString()
    fetchFilter.end = end.toISOString()
  }

  return (
    <div className={`${styles.counselorTimeCardToolbar} wisernet-toolbar`}>
      {showDate && (
        <div className="wisernet-toolbar-group">
          <label>Dates:</label>
          <DatePicker.RangePicker onChange={updateDateRange} value={start && end ? [start, end] : undefined} />
        </div>
      )}
      {showCounselor && (
        <div className="wisernet-toolbar-group">
          <label>Counselor:</label>
          <Select value={counselorID} onChange={setCounselorID} showSearch={true} optionFilterProp="children">
            {counselors.map(c => (
              <Select.Option key={c.slug} value={c.pk}>
                {getFullName(c)}
              </Select.Option>
            ))}
          </Select>
        </div>
      )}
      {isAdmin && (
        <>
          <Button
            type="primary"
            onClick={() => dispatch(showModal({ modal: MODALS.CREATE_COUNSELOR_TIME_CARD, props: {} }))}
          >
            <PlusCircleOutlined />
            Create Time Card
          </Button>
          <DownloadCSVButton dataType={CSVDataTypes.CounselorTimeCard} queryParams={fetchFilter} />
          <DownloadCSVButton
            title="Pay Rate Breakdown"
            dataType={CSVDataTypes.CounselorTimeCardBreakdown}
            queryParams={fetchFilter}
          />
        </>
      )}
    </div>
  )
}
export default CounselorTimeCardToolbar
