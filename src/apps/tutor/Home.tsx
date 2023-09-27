// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Input } from 'antd'
import StudentList from 'components/common/CASStudentList'
import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { selectCWUserID } from 'store/user/usersSelector'

const TutorHome = () => {
  const [searchText, setSearchText] = useState('')
  const tutorID = useSelector(selectCWUserID)
  return (
    <div className="app-white-container">
      <div className="wisernet-toolbar">
        <Input.Search
          allowClear
          placeholder="Search by student or parent name, email"
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          width="400px"
        />
      </div>
      <StudentList tutor={tutorID} searchText={searchText} />
    </div>
  )
}

export default TutorHome
