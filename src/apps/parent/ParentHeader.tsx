// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { SettingOutlined } from '@ant-design/icons'
import { Menu, Select } from 'antd'
import { getFullName } from 'components/administrator'
import Header from 'components/common/Header'
import { useShallowSelector } from 'libs'
import {history} from 'App'
import { values } from 'lodash'
import React from 'react'
import { useSelector } from 'react-redux'
import { RootState } from 'store/rootReducer'
import { useReduxDispatch } from 'store/store'
import { selectStudents } from 'store/user/usersSelector'
import { setSelectedStudent } from 'store/user/usersSlice'
import styles from './styles/ParentHeader.scss'

const ParentHeader = () => {
  const dispatch = useReduxDispatch()

  // We assume students are already loaded/loading
  const students = values(useShallowSelector(selectStudents))
  const selectedStudent = useSelector((state: RootState) => state.user.selectedStudent)

  // Items that appear in primary header menu
  const primaryMenuItems = <Menu.Item key="message">Messages</Menu.Item>

  // Items that appear in account drop down menu, above logout
  const accountMenuItems = (
    <Menu.Item key="account">
      <SettingOutlined />
      Account
    </Menu.Item>
  )

  const clickMenu = (menuItem: ClickParam) => {
    if (menuItem.key === 'logout') {
      window.location.href = '/user/logout'
    }
    History.push(`/${menuItem.key}`)
  }

  // We change our selected student. Note that if we're switching from counseling to tutoring or vice versa,
  // we will need to change pages
  const updateSelectedStudent = (pk: number) => {
    const newStudent = students.find(s => s.pk === pk)
    if (!newStudent) {
      return
    }
    dispatch(setSelectedStudent(newStudent))
  }

  return (
    <Header accountMenuItems={accountMenuItems} menuItems={primaryMenuItems} menuClick={clickMenu}>
      <>
        {selectedStudent && students.length > 1 && (
          <div className={styles.ParentHeader}>
            <label className="f-subtitle-1">Select Student:&nbsp;</label>
            <Select
              dropdownClassName="selectStudentDropdown"
              value={selectedStudent?.pk}
              placeholder="Select a Student to View"
              onChange={updateSelectedStudent}
            >
              {students.map(ele => (
                <Select.Option key={ele.pk} value={ele.pk}>
                  {getFullName(ele)}
                </Select.Option>
              ))}
            </Select>
          </div>
        )}
        {selectedStudent && students.length === 1 && (
          <div className={styles.ParentHeader}>
            <label className="f-subtitle-1">Student: {getFullName(selectedStudent)}</label>
          </div>
        )}
      </>
    </Header>
  )
}
export default ParentHeader
