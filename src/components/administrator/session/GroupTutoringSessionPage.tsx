// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { PlusCircleOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { GroupTutoringSessionFilter, GroupTutoringSessionTable, SearchProvider } from 'components/administrator/'
import DownloadCSVButton from 'components/common/DownloadCSVButton'
import { CSVDataTypes } from 'components/common/enums'
import { Moment } from 'moment'
import React, { useState } from 'react'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import { useReduxDispatch } from 'store/store'

/**
 * Renders a layout component for managing GroupTutoringSessions and provides FilterContext
 */
export const GroupTutoringSessionPage = () => {
  const dispatch = useReduxDispatch()

  const [searchText, setSearchText] = useState('')

  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)

  const handleRangePicker = (dates: [Moment, Moment]) => {
    if (dates === null) {
      setStartDate(null)
      setEndDate(null)
    }
    if (dates?.length >= 1) {
      setStartDate(dates[0])
    }
    if (dates?.length >= 2) {
      setEndDate(dates[1])
    }
  }

  return (
    <section className="pageContainer">
      <h1>Group Tutoring Sessions</h1>
      <SearchProvider value={{ searchText, setSearchText }}>
        <GroupTutoringSessionFilter handleDateSelection={handleRangePicker} startDate={startDate} endDate={endDate}>
          <div className="actionsContainer right">
            <DownloadCSVButton dataType={CSVDataTypes.GroupTutoringSession} />
            <Button
              className="buttonCreate"
              type="primary"
              onClick={() => dispatch(showModal({ props: {}, modal: MODALS.GROUP_TUTORING_SESSION }))}
            >
              <PlusCircleOutlined />
              Add Group Tutoring Session
            </Button>
          </div>
        </GroupTutoringSessionFilter>
        <GroupTutoringSessionTable startDate={startDate} endDate={endDate} />
      </SearchProvider>
    </section>
  )
}

export default GroupTutoringSessionPage
