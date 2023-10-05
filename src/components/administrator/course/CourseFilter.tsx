// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Input } from 'antd'
import { useSearchCtx } from 'components/administrator/'
import React from 'react'
import styles from './Course.scss'

export const CourseFilter = () => {
  const { searchText, setSearchText } = useSearchCtx()

  return (
    <div className={styles.courseFilter}>
      <Input.Search
        allowClear
        enterButton
        className="search"
        placeholder="Search course or tutor"
        value={searchText}
        onChange={e => setSearchText(e.target.value)}
      />
    </div>
  )
}
