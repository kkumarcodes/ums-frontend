// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import Icon, {
  BankFilled,
  BuildFilled,
  CheckSquareFilled,
  ExperimentFilled,
  HomeFilled,
  KeyOutlined,
  SettingFilled,
  SnippetsFilled,
} from '@ant-design/icons'
import { Button, Tooltip } from 'antd'
import { getFullName } from 'components/administrator'
import styles from 'components/counselor/styles/CounselorStudentSubNav.scss'
import { activitiesSVG } from 'img/ActivitiesSVG'
import useActiveStudent from 'libs/useActiveStudent'
import React from 'react'
import { useSelector } from 'react-redux'
import { NavLink } from 'react-router-dom'
import { selectParent } from 'store/user/usersSelector'

export const CounselorStudentSubNav = () => {
  const activeStudent = useActiveStudent()
  const parent = useSelector(selectParent(activeStudent?.parent))

  if (!activeStudent) {
    return <section className={styles.CounselorStudentSubNav} />
  }

  return (
    <section className={styles.CounselorStudentSubNav}>
      <div className={`${!activeStudent ? 'hide' : ''}`}>
        <header className="subnav-header">
          <h2 className="subnav-heading">{getFullName(activeStudent)}</h2>
          <Tooltip title="You can log in as one student or parent at a time (in addition to being logged in to your counselor account)">
            <div className="login-container">
              <Button type="link" href={`/user/obtain-login-link/student/${activeStudent.slug}/`} target="blank">
                <KeyOutlined />
                Login as {getFullName(activeStudent)}
              </Button>
              {parent && (
                <Button type="link" href={`/user/obtain-login-link/parent/${parent.slug}/`} target="blank">
                  <KeyOutlined />
                  Login as parent {getFullName(parent)}
                </Button>
              )}
            </div>
          </Tooltip>
        </header>
        <div className="subheader help">
          <span>{activeStudent.email}</span>
          <span>{activeStudent.phone}</span>
          {parent && (
            <div className="parent">
              <span>
                <strong>Parent:</strong> {getFullName(parent)}
              </span>
              <span>{parent.email}</span>
              <span>{parent.phone}</span>
            </div>
          )}
          <span className="year">
            <strong>Year:</strong>&nbsp;{activeStudent.graduation_year}
          </span>
          <span>
            <strong>High School:</strong>&nbsp;{activeStudent.high_school}
          </span>
          <span>
            <strong>Package:</strong>&nbsp;{activeStudent.counseling_student_types_list.join(',')}
          </span>
        </div>
        <nav className="subnav-list">
          <NavLink className="subnav-item-link" to={`/profile/student/${activeStudent?.pk}/`}>
            <Tooltip title="Dashboard">
              <HomeFilled />
            </Tooltip>
          </NavLink>
          <NavLink className="subnav-item-link" to={`/tasks/student/${activeStudent?.pk}/`}>
            <Tooltip title="Tasks">
              <CheckSquareFilled />
            </Tooltip>
          </NavLink>
          <NavLink className="subnav-item-link" to={`/application-plan/student/${activeStudent?.pk}/`}>
            <Tooltip title="Application Plan">
              <BuildFilled />
            </Tooltip>
          </NavLink>
          <NavLink className="subnav-item-link" to={`/academics/student/${activeStudent?.pk}/`}>
            <Tooltip title="Academics">
              <ExperimentFilled />
            </Tooltip>
          </NavLink>
          <NavLink className="subnav-item-link" to={`/school-list/student/${activeStudent?.pk}/`}>
            <Tooltip title="Colleges">
              <BankFilled />
            </Tooltip>
          </NavLink>
          <NavLink className="subnav-item-link" to={`/activities/student/${activeStudent?.pk}/`}>
            <Tooltip title="Activities">
              <Icon className="activities-icon" component={activitiesSVG} />
            </Tooltip>
          </NavLink>

          <NavLink className="subnav-item-link" to={`/notes-and-files/student/${activeStudent?.pk}/`}>
            <Tooltip title="Notes and Files">
              <SnippetsFilled />
            </Tooltip>
          </NavLink>
          <NavLink className="subnav-item-link" to={`/settings/student/${activeStudent?.pk}/`}>
            <SettingFilled />
          </NavLink>
        </nav>
      </div>
    </section>
  )
}
