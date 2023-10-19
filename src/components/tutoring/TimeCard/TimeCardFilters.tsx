// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { ConfigProvider, DatePicker, Input, Button } from 'antd'
import en_GB from 'antd/es/locale/en_GB'
import styles from 'components/tutoring/styles/TimeCard.scss'
import { TimeCardButtonCreate } from 'components/tutoring/TimeCard'
import moment from 'moment'
import React from 'react'
import DownloadCSVButton from 'components/common/DownloadCSVButton'
import { CSVDataTypes } from 'components/common/enums'
import { useTimeCardCtx } from './context'

const dateFormat = 'MMM Do'
const { RangePicker } = DatePicker
const { Search } = Input

/**
 * adminID and tutorID are used from context to conditionally render components based on active user
 * Render a set of time card filters; Used by TimeCardPage. Makes use of TimeCardContext
 * If tutorID is defined => TutorApp; otherwise AdminApp
 */
export const TimeCardFilters = () => {
  const { tutorID, adminID, search, setSearch, selectedStart, setStart, selectedEnd, setEnd } = useTimeCardCtx()

  const acctReportURL = () => {
    const base = 'tutoring/time-cards/?format=csv'
    const start = selectedStart.format('YYYY-MM-DD')
    const end = selectedEnd.format('YYYY-MM-DD')
    const flag = 'acct_report=true'

    return `/${base}&start=${start}&end=${end}&${flag}`
  }

  const lineItemReportURL = () => {
    return `/tutoring/time-card-line-item-accounting/?format=csv&start=${selectedStart.format(
      'YYYY-MM-DD',
    )}&end=${selectedEnd.format('YYYY-MM-DD')}`
  }

  return (
    <div className={styles.containerFilters}>
      {adminID && (
        <Search
          allowClear
          enterButton
          className="search"
          placeholder="Find a Tutor"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      )}
      <ConfigProvider locale={en_GB}>
        <div className="wrapperRangePicker">
          {tutorID && <label className="labelRangePicker">Dates:</label>}
          <RangePicker
            className="rangePicker"
            defaultValue={[selectedStart, selectedEnd]}
            format={dateFormat}
            onCalendarChange={dates => {
              if (dates !== null && dates[0] !== null) {
                setStart(dates[0])
              }
              if (dates !== null && dates[1] !== null) {
                setEnd(dates[1])
              }
            }}
          />
        </div>
      </ConfigProvider>
      {adminID && (
        <div className="containerButtonCreate">
          <Button disabled={!(selectedStart && selectedEnd)} type="primary" target="_blank" href={lineItemReportURL()}>
            Line Item Report
          </Button>
          <Button type="primary" target="_blank" href={acctReportURL()}>
            Accounting Report
          </Button>
          <DownloadCSVButton
            dataType={CSVDataTypes.TimeCard}
            queryParams={{ start: selectedStart.format('YYYY-MM-DD'), end: selectedEnd.format('YYYY-MM-DD') }}
          />
          <TimeCardButtonCreate />
        </div>
      )}
    </div>
  )
}
