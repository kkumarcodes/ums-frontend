// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { CaretDownOutlined, CaretUpOutlined, CheckOutlined } from '@ant-design/icons'
import { Button, Checkbox, Dropdown, Input, Menu } from 'antd'
import { useOnClickOutside } from 'hooks'
import { invert, map, startCase, values } from 'lodash'
import React, { useRef, useState } from 'react'
import { CounselorTrackerApplicationStatus } from 'store/university/universityTypes'
import { useApplicationTrackerCtx } from './ApplicationTrackerContext'
import styles from './styles/CounselorAppPlanPage.scss'
import { HeaderLabel, SingleTableHeaders } from './types'

const NONE_STATUS_KEY = 'None'
const ApplicationTrackerToolbar = () => {
  const ctx = useApplicationTrackerCtx()

  const [headersVisible, setHeadersVisible] = useState(false)
  const [appStatusVisible, setAppStatusVisible] = useState(false)
  const [gradYearVisible, setGradYearVisible] = useState(false)

  const headersRef = useRef<HTMLDivElement>(null)
  const appPlanRef = useRef<HTMLDivElement>(null)
  const gradYearRef = useRef<HTMLDivElement>(null)

  useOnClickOutside(headersRef, () => setHeadersVisible(false))
  useOnClickOutside(appPlanRef, () => setAppStatusVisible(false))
  useOnClickOutside(gradYearRef, () => setGradYearVisible(false))

  const handleHeaderSelection = (label: HeaderLabel) => {
    const idx = ctx.selectedHeaders.indexOf(label)
    if (idx > -1) ctx.setSelectedHeaders(ctx.selectedHeaders.filter(i => i !== label))
    // Order really matters, so we respect the original order or items in HeaderLabel
    else ctx.setSelectedHeaders(values(HeaderLabel).filter(v => ctx.selectedHeaders.includes(v) || v === label))
  }

  const handleAppStatusSelection = (label: CounselorTrackerApplicationStatus) => {
    label = label === NONE_STATUS_KEY ? CounselorTrackerApplicationStatus.None : label
    const idx = ctx.selectedAppStatus.indexOf(label)
    if (idx > -1) ctx.setSelectedAppStatus(ctx.selectedAppStatus.filter(i => i !== label))
    else
      ctx.setSelectedAppStatus(
        values(CounselorTrackerApplicationStatus).filter(v => ctx.selectedAppStatus.includes(v) || v === label),
      )
  }

  const handleGradYearSelection = (label: { key: string }) => {
    const year = Number(label.key)
    const idx = ctx.selectedGradYears.indexOf(year)
    if (idx > -1) ctx.setSelectedGradYears(ctx.selectedGradYears.filter(i => i !== year))
    else ctx.setSelectedGradYears(ctx.allUniqGradYears.filter(v => ctx.selectedGradYears.includes(v) || v === year))
  }

  const labelKeys = values(HeaderLabel).filter(k => !SingleTableHeaders.includes(k))
  const headersMenu = (
    <Menu
      selectable
      multiple={true}
      onSelect={p => handleHeaderSelection(p.key as HeaderLabel)}
      onDeselect={p => handleHeaderSelection(p.key as HeaderLabel)}
      selectedKeys={ctx.selectedHeaders}
    >
      {map(labelKeys, k => (
        <Menu.Item key={k} className="wisernet-ddown-item">
          <span>
            {ctx.selectedHeaders.includes(k) ? <CheckOutlined /> : <span className="spacer" />}
            {k}
          </span>
        </Menu.Item>
      ))}
    </Menu>
  )

  const appStatusLabels = invert(CounselorTrackerApplicationStatus)
  const appStatusMenu = (
    <Menu
      selectable
      multiple={true}
      onSelect={p => handleAppStatusSelection(p.key as CounselorTrackerApplicationStatus)}
      onDeselect={p => handleAppStatusSelection(p.key as CounselorTrackerApplicationStatus)}
      selectedKeys={ctx.selectedHeaders}
    >
      {map(values(CounselorTrackerApplicationStatus), k => (
        <Menu.Item key={k || NONE_STATUS_KEY} className="wisernet-ddown-item">
          <span>
            {ctx.selectedAppStatus.includes(k) ? <CheckOutlined /> : <span className="spacer" />}
            {startCase(appStatusLabels[k])}
          </span>
        </Menu.Item>
      ))}
    </Menu>
  )

  const gradYearMenu = (
    <Menu
      selectable
      multiple={true}
      onSelect={year => handleGradYearSelection(year)}
      onDeselect={year => handleGradYearSelection(year)}
      selectedKeys={ctx.selectedGradYears}
    >
      {ctx.allUniqGradYears.map(year => (
        <Menu.Item key={year} className="wisernet-ddown-item">
          <span>
            {ctx.selectedGradYears.includes(year) ? <CheckOutlined /> : <span className="spacer" />}
            {year}
          </span>
        </Menu.Item>
      ))}
    </Menu>
  )

  return (
    <div className={styles.counselorAppPlanToolbar}>
      <h2 className="title">App Tracker</h2>
      <div className="actions">
        <div className="action-group">
          <Checkbox checked={ctx.separateStudents} onChange={e => ctx.setSeparateStudents(e.target.checked)}>
            Separate Students
          </Checkbox>
        </div>
        <div className="action-group" ref={appPlanRef}>
          <Dropdown
            getPopupContainer={(trigger: HTMLElement) => trigger.parentNode as HTMLElement}
            visible={appStatusVisible}
            overlay={appStatusMenu}
            trigger={['click']}
          >
            <Button onClick={() => setAppStatusVisible(!appStatusVisible)}>
              Choose Application Status ({ctx.selectedAppStatus.length}){' '}
              {appStatusVisible ? <CaretUpOutlined /> : <CaretDownOutlined />}
            </Button>
          </Dropdown>
        </div>
        <div className="action-group" ref={headersRef}>
          <Dropdown
            getPopupContainer={(trigger: HTMLElement) => trigger.parentNode as HTMLElement}
            visible={headersVisible}
            overlay={headersMenu}
            trigger={['click']}
          >
            <Button onClick={() => setHeadersVisible(!headersVisible)}>
              Choose Visible Columns ({ctx.selectedHeaders.length}){' '}
              {headersVisible ? <CaretUpOutlined /> : <CaretDownOutlined />}
            </Button>
          </Dropdown>
        </div>
        <div className="action-group" ref={gradYearRef}>
          <Dropdown
            getPopupContainer={(trigger: HTMLElement) => trigger.parentNode as HTMLElement}
            visible={gradYearVisible}
            overlay={gradYearMenu}
            trigger={['click']}
          >
            <Button onClick={() => setGradYearVisible(!gradYearVisible)}>
              Choose Grad Years ({ctx.selectedGradYears?.length}){' '}
              {gradYearVisible ? <CaretUpOutlined /> : <CaretDownOutlined />}
            </Button>
          </Dropdown>
        </div>
        <div className="action-group search">
          <Input.Search
            placeholder="Search for student or university"
            value={ctx.search}
            onChange={e => ctx.setSearch(e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}
export default ApplicationTrackerToolbar
