// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { CloseCircleOutlined, UpCircleFilled } from '@ant-design/icons'
import { Button } from 'antd'
import { getFullName } from 'components/administrator'
import Search from 'components/counseling/Search'
import styles from 'components/counselor/styles/CounselorSidebar.scss'
import {history} from 'App'
import useActiveStudent from 'libs/useActiveStudent'
import _ from 'lodash'
import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { NavLink, useRouteMatch } from 'react-router-dom'
import { RootState } from 'store/rootReducer'

const CounselorSidebar = () => {
  const [expanded, setExpanded] = useState(true)
  const activeStudent = useActiveStudent()
  const recentStudents = _.filter(
    useSelector((s: RootState) => s.user.recentStudents.map(pk => s.user.students[Number(pk)])),
  )
  const match = useRouteMatch()
  let basePath = match.path.split(':')[0]

  // Stay on the current page, but swap out the active student
  const switchActiveStudent = (newStudent: number) => {
    if (!basePath.includes('student')) {
      basePath = '/profile/student/'
    }
    // Matched path minus :studentID slug if exists
    History.push(`${basePath}${newStudent}/`)
    return false
  }

  return (
    <div className={styles.counselorSidebar}>
      {/* Expanded Sidebar */}
      <div className={`counselor-sidebar-expanded ${expanded ? 'show-expanded' : 'hide'}`}>
        <Button
          className="close-button"
          onClick={() => setExpanded(false)}
          type="link"
          shape="circle"
          icon={<CloseCircleOutlined />}
        />
        <img src="/static/cwcommon/sidebar_graphic.png" className="sidebar-graphic" alt="" />
        <div className="inner-content">
          <div className="switch-active-student">
            <label>Search:</label>
            <br />
            <Search />
          </div>
          {activeStudent && (
            <div className="active-student">
              <h3>{getFullName(activeStudent)}</h3>
              <NavLink className="sidebar-nav-link" to={`/profile/student/${activeStudent.pk}/`}>
                Dashboard
              </NavLink>
              <NavLink className="sidebar-nav-link" to={`/application-plan/student/${activeStudent.pk}/`}>
                Application Plan
              </NavLink>
              <NavLink className="sidebar-nav-link" to={`/tasks/student/${activeStudent.pk}/`}>
                Tasks
              </NavLink>
              <NavLink className="sidebar-nav-link" to={`/academics/student/${activeStudent.pk}/`}>
                Academics
              </NavLink>
              <NavLink className="sidebar-nav-link" to={`/school-list/student/${activeStudent.pk}/`}>
                Colleges
              </NavLink>
              <NavLink className="sidebar-nav-link" to={`/activities/student/${activeStudent.pk}/`}>
                Activities
              </NavLink>
              <NavLink className="sidebar-nav-link" to={`/notes-and-files/student/${activeStudent.pk}/`}>
                Notes and Files
              </NavLink>
            </div>
          )}
          <div className="recent-students">
            <h4>Recent Students</h4>
            {recentStudents.map(s => (
              <a key={s.pk} href={`#/profile/student/${s.pk}/`} className="recent-student">
                {getFullName(s)}
                <br />
              </a>
            ))}
          </div>
        </div>
      </div>
      {/* Collapsed Sidebar */}
      <div className={`counselor-sidebar-collapsed ${expanded ? 'hide' : 'show-collapse'}`}>
        <Button size="large" type="primary" className="students-tab" onClick={_ => setExpanded(true)}>
          <UpCircleFilled /> Students <UpCircleFilled />
        </Button>
      </div>
    </div>
  )
}

export default CounselorSidebar
