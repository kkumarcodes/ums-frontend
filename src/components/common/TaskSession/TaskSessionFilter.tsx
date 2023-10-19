// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Select } from 'antd'
import styles from 'components/common/styles/TaskSession.scss'
import { EventTypes, useTaskSessionCtx } from 'components/common/TaskSession'
import { values } from 'lodash'
import React from 'react'
import { useDispatch } from 'react-redux'

const { Option } = Select

export const TaskSessionFilter = () => {
  const { eventType, setEventType } = useTaskSessionCtx()

  return (
    <div className={styles.filterTaskSession}>
      <Select
        defaultValue={EventTypes.all}
        value={eventType}
        className="selectEventType"
        dropdownClassName="dropdownEventType"
        onChange={setEventType}
      >
        {values(EventTypes).map(ele => (
          <Option value={ele} key={ele} className="optionEventType">
            {ele}
          </Option>
        ))}
      </Select>
    </div>
  )
}
