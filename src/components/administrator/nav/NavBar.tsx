// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { DownOutlined } from '@ant-design/icons'
import { Button, Dropdown, Menu } from 'antd'
import styles from 'components/administrator/styles/NavBar.scss'
import { kebabCase, startCase, values } from 'lodash'
import React, { useEffect } from 'react'
import { NavLink, useHistory } from 'react-router-dom'
import { TutoringType } from 'store/tutoring/tutoringTypes'
import { UsersType } from 'store/user/usersTypes'

const createMenuItem = (menuItem: string) => (
  <Menu.Item key={menuItem}>
    <NavLink to={`/user/platform/administrator/${kebabCase(menuItem)}/`}>{startCase(menuItem)}</NavLink>
  </Menu.Item>
)

const createDropdown = (title: string, overlay: JSX.Element, isActive: boolean) => (
  <Dropdown overlay={overlay}>
    <Button className={`${styles.navButton} ${isActive ? styles.activeNavBarItem : ''}`}>
      {title} <DownOutlined />
    </Button>
  </Dropdown>
)

const userMenu = <Menu className={styles.navMenu}>{values(UsersType).map(createMenuItem)}</Menu>
const tutoringMenu = <Menu className={styles.navMenu}>{values(TutoringType).map(createMenuItem)}</Menu>
const sessionMenu = (
  <Menu className={styles.navMenu}>{['studentTutoringSessions', 'groupTutoringSessions'].map(createMenuItem)}</Menu>
)
const diagnosticMenu = (
  <Menu className={styles.navMenu}>
    {createMenuItem('diagnosticsAndRecommendations')}
    {createMenuItem('diagnosticRegistrations')}
  </Menu>
)
const messageMenu = (
  <Menu className={styles.navMenu}>
    {createMenuItem('chatConversations')}
    {createMenuItem('announcements')}
  </Menu>
)
const calendarMenu = <Menu className={styles.navMenu}>{createMenuItem('calendar')}</Menu>
const reportsMenu = (
  <Menu className={styles.navMenu}>
    <Menu.Item key="tp">
      <NavLink to="/user/platform/administrator/report/tutoring-package-purchase/">Tutoring Packages</NavLink>
    </Menu.Item>
    <Menu.Item key="report-tutor">
      <NavLink to="/user/platform/administrator/report/tutor/">Tutors</NavLink>
    </Menu.Item>
    <Menu.Item key="report-system-logs">
      <NavLink to="/user/platform/administrator/report/system-logs/">System Logs</NavLink>
    </Menu.Item>
    <Menu.Item key="report-last-meeting">
      <NavLink to="/user/platform/administrator/report/last-meeting/">Last Meeting</NavLink>
    </Menu.Item>
  </Menu>
)
const CAPMenu = (
  <Menu className={styles.navMenu}>
    <Menu.Item key="time-entries">
      <NavLink to="/user/platform/administrator/counseling/time-entries/">CAP Time Tracking</NavLink>
    </Menu.Item>
    <Menu.Item key="counselor-time-cards">
      <NavLink to="/user/platform/administrator/counseling/counselor-time-cards/">CAP Time Cards</NavLink>
    </Menu.Item>
    <Menu.Item key="roadmaps">
      <NavLink to="/user/platform/administrator/counseling/roadmaps/">Roadmaps</NavLink>
    </Menu.Item>
    <Menu.Item key="counselor-meetings">
      <NavLink to="/user/platform/administrator/counseling/meeting-templates/">Counselor Meeting Templates</NavLink>
    </Menu.Item>
    <Menu.Item key="task-template">
      <NavLink to="/user/platform/administrator/counseling/task-templates/">Task Templates</NavLink>
    </Menu.Item>
  </Menu>
)

/**
 * Renders a horizontal dropdown navbar
 */
type Props = {
  showCASControls?: boolean
  showCAPControls?: boolean
}
export const NavBar = ({ showCAPControls = true, showCASControls = true }: Props) => {
  const history = useHistory()
  const pathname = history.location.pathname.slice(1, -1)

  useEffect(() => {}, [pathname])

  return (
    <nav className={styles.navBarMain}>
      {createDropdown('Users', userMenu, values(UsersType).includes(pathname as UsersType))}
      {showCASControls &&
        createDropdown(
          'Tutoring',
          tutoringMenu,
          values(TutoringType)
            .map(ele => kebabCase(ele))
            .concat(['courses/add'])
            .includes(pathname as TutoringType),
        )}
      {createDropdown(
        'Sessions',
        sessionMenu,
        ['student-tutoring-sessions', 'group-tutoring-sessions'].includes(pathname),
      )}
      {createDropdown('Diagnostics', diagnosticMenu, pathname === 'diagnostics-and-recommendations')}
      {createDropdown('Messages', messageMenu, pathname === 'chat-conversations')}
      {createDropdown('Calendar', calendarMenu, pathname === 'calendar')}
      {createDropdown('Reports', reportsMenu, pathname.includes('report'))}
      {showCAPControls && createDropdown('CAP', CAPMenu, pathname.includes('counseling/'))}
    </nav>
  )
}
