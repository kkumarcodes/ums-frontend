// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { DatePicker, Input, Row } from 'antd'
import { useSearchCtx } from 'components/administrator'
import styles from 'components/administrator/styles/GroupTutoringSessionFilter.scss'
import { Moment } from 'moment'
import React, { ChangeEvent } from 'react'

const { Search } = Input

type Props = {
  children?: JSX.Element
  handleDateSelection: Function
  startDate: Moment | null
  endDate: Moment | null
}

const dateFormat = 'M/D/YY'
export const GroupTutoringSessionFilter = ({ handleDateSelection, startDate, endDate, children }: Props) => {
  const { setSearchText } = useSearchCtx()

  const handleReset = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.value === '') {
      setSearchText('')
    }
  }

  return (
    <Row className={styles.groupTutoringSessionsFilter}>
      <div className="search-range-picker-wrapper">
        <div className="search-wrapper">
          <label className="filterLabel" htmlFor="searchResource">
            Search:
          </label>
          <Search
            id="searchResource"
            placeholder="Enter search text"
            onSearch={setSearchText}
            onChange={handleReset}
            enterButton
            allowClear
          />
        </div>
        <DatePicker.RangePicker
          className="range-picker"
          allowEmpty={[true, true]}
          format={dateFormat}
          value={[startDate, endDate]}
          onCalendarChange={handleDateSelection}
          allowClear
        />
      </div>
      {children}
    </Row>
  )
}
