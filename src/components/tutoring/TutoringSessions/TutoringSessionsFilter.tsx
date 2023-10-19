// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { CaretDownOutlined, CaretUpOutlined } from '@ant-design/icons'
import { Button, Checkbox, DatePicker, Dropdown, Input, Menu, Radio } from 'antd'
import { SelectParam } from 'antd/lib/menu'
import DownloadCSVButton from 'components/common/DownloadCSVButton'
import { CSVDataTypes } from 'components/common/enums'
import styles from 'components/tutoring/styles/TutoringSessionsFilter.scss'
import {
  NoteStatus,
  SessionStatus,
  SessionType,
  TimeRangeFilter,
  useTutoringSessionsCtx,
} from 'components/tutoring/TutoringSessions'
import { useOnClickOutside } from 'hooks'
import { isEmpty, keys, values } from 'lodash'
import { Moment } from 'moment'
import React, { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { useReduxDispatch } from 'store/store'
import { fetchStudentTutoringSessions } from 'store/tutoring/tutoringThunks'
import { selectIsAdmin, selectIsTutor, selectUserType } from 'store/user/usersSelector'
import { UserType } from 'store/user/usersTypes'

const dateFormat = 'M/D/YY'

interface Props {
  tab: 'list' | 'calendar'
  showTimeRangeFilter?: boolean
}

/**
 * Component renders set of filters for TutoringSessions Table (i.e List)/Calendar
 */
export const TutoringSessionsFilter = ({ tab, showTimeRangeFilter = false }: Props) => {
  const dispatch = useReduxDispatch()

  const isAdmin = useSelector(selectIsAdmin)
  const isTutor = useSelector(selectIsTutor)
  // Used to request past STS on Admin STS page (only once while mounted)
  const hasAdminFetchedPastSessions = useRef<boolean>(false)

  const sessionTypeRef = useRef<HTMLDivElement>(null)
  const sessionStatusRef = useRef<HTMLDivElement>(null)
  const noteStatusRef = useRef<HTMLDivElement>(null)

  const userType = useSelector(selectUserType)
  const {
    isAdminSTSPage,
    tutorID,
    studentID,
    setSearchText,
    setLoading,
    selectedTimeRange,
    setTimeRange,
    sessionType,
    setSessionType,
    sessionStatus,
    setSessionStatus,
    noteStatus,
    setNoteStatus,
    startRange,
    setStartRange,
    endRange,
    setEndRange,
  } = useTutoringSessionsCtx()

  const [visibleType, setVisibleType] = useState(false)
  const [visibleStatus, setVisibleStatus] = useState(false)
  const [visibleNoteStatus, setVisibleNoteStatus] = useState(false)

  // Sets default sessionStatus on each page
  useEffect(() => {
    // True on ExpandedStudentRow, ExpandedTutorRow, and Tutor Tutoring Sessions List View
    if (tab === 'list' && !isAdminSTSPage) {
      // Default filter settings for Admin app - ExpandedStudentRow, ExpandedTutorRow
      if (isAdmin) {
        setSessionStatus([
          SessionStatus.upcoming,
          SessionStatus.completed,
          SessionStatus.missed,
          SessionStatus.cancelled,
        ])
        setNoteStatus([NoteStatus.pending, NoteStatus.completed])
      }
      if (isTutor) {
        // Default filter settings for Tutor app - Tutoring Sessions List View
        setSessionStatus([SessionStatus.upcoming, SessionStatus.completed])
        setNoteStatus([NoteStatus.pending, NoteStatus.completed])
      }
    }
    // True on Admin Student Tutoring Sessions Page and Tutor Tutoring Sessions Calendar View
    if (tab === 'calendar' || isAdminSTSPage) {
      setSessionStatus([SessionStatus.upcoming])
      setNoteStatus([NoteStatus.pending, NoteStatus.completed])
    }
  }, [isAdmin, isAdminSTSPage, isTutor, setNoteStatus, setSessionStatus, studentID, tab, tutorID])

  const handleSelectType = (selectParam: SelectParam) => {
    setSessionType([...sessionType, selectParam.key as SessionType])
  }

  const handleDeselectType = (selectParam: SelectParam) => {
    setSessionType(sessionType.filter(x => x !== selectParam.key))
  }

  const handleSelectStatus = (status: SessionStatus) => {
    // Triggers request for past STS on initial check of Completed/Missed/Cancelled SessionStatus on Admin STS Page
    if (
      isAdminSTSPage &&
      !hasAdminFetchedPastSessions.current &&
      [SessionStatus.completed, SessionStatus.missed, SessionStatus.cancelled].includes(status)
    ) {
      // Ref used to remember that past sessions have already been requested (no need to fetch again until component un-mounts)
      hasAdminFetchedPastSessions.current = true
      // Triggers TutoringSessionTable loading animation
      setLoading(true)
      dispatch(fetchStudentTutoringSessions({ past: true, individual: true })).finally(() => setLoading(false))
    }
    setSessionStatus([...sessionStatus, status])
  }

  const handleDeselectStatus = (selectParam: SelectParam) => {
    setSessionStatus(sessionStatus.filter(x => x !== selectParam.key))
  }

  const handleSelectNoteStatus = (selectParam: SelectParam) => {
    setNoteStatus([...noteStatus, selectParam.key as NoteStatus])
  }

  const handleDeselectNoteStatus = (selectParam: SelectParam) => {
    setNoteStatus(noteStatus.filter(x => x !== selectParam.key))
  }

  const menuSessionType = (
    <Menu multiple selectable onSelect={handleSelectType} onDeselect={handleDeselectType} selectedKeys={sessionType}>
      <Menu.Item key={SessionType.individual}>
        <Checkbox
          checked={sessionType.includes(SessionType.individual)}
          onClick={(e: React.MouseEvent) => e.preventDefault()}
        />
        <span className="menu-checkbox-span">{SessionType.individual}</span>
      </Menu.Item>
      <Menu.Item key={SessionType.group}>
        <Checkbox
          checked={sessionType.includes(SessionType.group)}
          onClick={(e: React.MouseEvent) => e.preventDefault()}
        />
        <span className="menu-checkbox-span">{SessionType.group}</span>
      </Menu.Item>
    </Menu>
  )

  const menuSessionStatus = (
    <Menu
      selectable
      multiple
      onSelect={(p: SelectParam) => handleSelectStatus(p.key as SessionStatus)}
      onDeselect={handleDeselectStatus}
      selectedKeys={sessionStatus}
    >
      <Menu.Item key={SessionStatus.upcoming}>
        <Checkbox
          checked={sessionStatus.includes(SessionStatus.upcoming)}
          onClick={(e: React.MouseEvent) => e.preventDefault()}
        />
        <span className="menu-checkbox-span">{SessionStatus.upcoming}</span>
      </Menu.Item>
      <Menu.Item key={SessionStatus.completed}>
        <Checkbox
          checked={sessionStatus.includes(SessionStatus.completed)}
          onClick={(e: React.MouseEvent) => e.preventDefault()}
        />
        <span className="menu-checkbox-span">{SessionStatus.completed}</span>
      </Menu.Item>
      <Menu.Item key={SessionStatus.missed}>
        <Checkbox
          checked={sessionStatus.includes(SessionStatus.missed)}
          onClick={(e: React.MouseEvent) => e.preventDefault()}
        />
        <span className="menu-checkbox-span">{SessionStatus.missed}</span>
      </Menu.Item>
      <Menu.Item key={SessionStatus.cancelled}>
        <Checkbox
          checked={sessionStatus.includes(SessionStatus.cancelled)}
          onClick={(e: React.MouseEvent) => e.preventDefault()}
        />
        <span className="menu-checkbox-span">{SessionStatus.cancelled}</span>
      </Menu.Item>
    </Menu>
  )

  const menuNoteStatus = (
    <Menu
      selectable
      multiple
      onSelect={handleSelectNoteStatus}
      onDeselect={handleDeselectNoteStatus}
      selectedKeys={noteStatus}
    >
      <Menu.Item key={NoteStatus.pending}>
        <Checkbox
          checked={noteStatus.includes(NoteStatus.pending)}
          onClick={(e: React.MouseEvent) => e.preventDefault()}
        />
        <span className="menu-checkbox-span">{NoteStatus.pending}</span>
      </Menu.Item>
      <Menu.Item key={NoteStatus.completed}>
        <Checkbox
          checked={noteStatus.includes(NoteStatus.completed)}
          onClick={(e: React.MouseEvent) => e.preventDefault()}
        />
        <span className="menu-checkbox-span">{NoteStatus.completed}</span>
      </Menu.Item>
    </Menu>
  )

  const handleRangePicker = (dates: [Moment, Moment]) => {
    if (dates === null || !dates[0]) {
      setStartRange(null)
      setEndRange(null)
    }
    if (dates?.length >= 1) {
      setStartRange(dates[0])
      // If start was in the past, we need to show completed and pending sessions
      if (dates[0] && dates[0].isBefore() && !sessionStatus.includes(SessionStatus.completed)) {
        handleSelectStatus(SessionStatus.completed)
      }
    }
    if (dates?.length >= 2 && dates[1]) {
      setEndRange(dates[1])
    }
  }

  useOnClickOutside(sessionTypeRef, () => setVisibleType(false))
  useOnClickOutside(sessionStatusRef, () => setVisibleStatus(false))
  useOnClickOutside(noteStatusRef, () => setVisibleNoteStatus(false))

  // Filters visible only in ListView tab
  const renderListViewFilters = () => {
    if (tab === 'list') {
      return (
        <div ref={noteStatusRef} className="dropdown note-status-dropdown">
          <Dropdown
            overlay={menuNoteStatus}
            visible={visibleNoteStatus}
            trigger={['click']}
            getPopupContainer={(trigger: HTMLElement) => trigger.parentNode as HTMLElement}
          >
            <Button onClick={() => setVisibleNoteStatus(prev => !prev)}>
              Note Status {visibleNoteStatus ? <CaretUpOutlined /> : <CaretDownOutlined />}
            </Button>
          </Dropdown>
        </div>
      )
    }
    return null
  }

  const csvQueryParams = {}
  if (tutorID) csvQueryParams.tutor = tutorID
  if (studentID) csvQueryParams.student = studentID
  if (isEmpty(csvQueryParams)) csvQueryParams.all = true

  return (
    <div className={styles.tutoringSessionsFilter}>
      {isAdminSTSPage && (
        <div className="search-range-picker-wrapper">
          <div className="search-wrapper">
            <Input.Search
              className="search-bar"
              placeholder="Student, tutor or location"
              onChange={e => setSearchText(e.target.value)}
              enterButton
              allowClear
            />
          </div>
          <DatePicker.RangePicker
            className="range-picker"
            allowEmpty={[true, true]}
            format={dateFormat}
            value={[startRange, endRange]}
            onCalendarChange={handleRangePicker}
            allowClear
          />
        </div>
      )}
      {showTimeRangeFilter && (
        <div className="time-range-list-filters">
          <Radio.Group onChange={e => setTimeRange(e.target.value)} value={selectedTimeRange} buttonStyle="solid">
            {keys(TimeRangeFilter).map(key => (
              <Radio.Button key={key} value={TimeRangeFilter[key]}>
                {TimeRangeFilter[key]}
              </Radio.Button>
            ))}
          </Radio.Group>
        </div>
      )}
      <div ref={sessionTypeRef} className="dropdown session-type-dropdown">
        {!isAdminSTSPage && (
          <Dropdown
            overlay={menuSessionType}
            visible={visibleType}
            trigger={['click']}
            getPopupContainer={(trigger: HTMLElement) => trigger.parentNode as HTMLElement}
          >
            <Button>Session Type {visibleType ? <CaretUpOutlined /> : <CaretDownOutlined />}</Button>
          </Dropdown>
        )}
      </div>
      <div ref={sessionStatusRef} className="dropdown session-status-dropdown">
        <Dropdown
          overlay={menuSessionStatus}
          visible={visibleStatus}
          trigger={['click']}
          getPopupContainer={(trigger: HTMLElement) => trigger.parentNode as HTMLElement}
        >
          <Button onClick={() => setVisibleStatus(prev => !prev)}>
            Session Status {visibleStatus ? <CaretUpOutlined /> : <CaretDownOutlined />}
          </Button>
        </Dropdown>
      </div>
      {!isAdminSTSPage && renderListViewFilters()}
      {userType === UserType.Administrator && (
        <div className="buttonCSV">
          <DownloadCSVButton dataType={CSVDataTypes.IndividualTutoringSession} queryParams={csvQueryParams} />
        </div>
      )}
    </div>
  )
}
