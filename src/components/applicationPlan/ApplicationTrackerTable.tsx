// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { CaretDownOutlined, CaretUpOutlined, DownOutlined, UpOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { getFullName, renderHighlighter } from 'components/administrator'
import { ApplicationTrackerTableRow } from 'components/applicationPlan/ApplicationTrackerTableRow'
import { useShallowSelector } from 'libs'
import { extractDeadlineSortDate } from 'libs/ScheduleSelector/date-utils'
import { orderBy } from 'lodash'
import React, { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { selectTasksForStudent } from 'store/task/tasksSelectors'
import { selectUniversitiesObject } from 'store/university/universitySelectors'
import { Application, ApplicationIcons, StudentUniversityDecisionExtended } from 'store/university/universityTypes'
import { selectStudentsObject } from 'store/user/usersSelector'
import { useApplicationTrackerCtx } from './ApplicationTrackerContext'
import styles from './styles/ApplicationTrackerTable.scss'
import { HeaderLabel, HeaderLabelKeys, labelToSUDBatchKeyMap, SortBy } from './types'

const UNIFIED_TRACKER_ACTIVE_COLUMN_KEY = -1

const CHECKBOX_COLS = [HeaderLabel.Twin, HeaderLabel.Legacy, HeaderLabel.HonorsCollege]

/**
 * This helper function orders items by a date/datetime field in given sortOrder
 * If date/datetime field is not defined, items are placed at the end of the list
 */
const orderItemsByDateField = (key: string, items: any[], sortOrder: SortBy) => {
  return orderBy(items, i => extractDeadlineSortDate(i[key]).valueOf(), sortOrder)
}

/**
 * This helper function orders items alphanumerically by a string field in given sortOrder
 * If string field is falsy, items are placed at the end of the list
 */
const orderItemsByAlphanumericField = (key: string, items: any[], sortOrder: SortBy) => {
  return orderBy(items, key, sortOrder)
}

type Props = {
  sudBatch: StudentUniversityDecisionExtended[]
  studentID?: number // If we're displaying SUDs for a single student
  allowCollapse?: boolean
}

export const renderAppIcons = (applications: Application[]) => {
  const imgUrls = applications.map(app => ApplicationIcons[app]).filter(u => u)

  return (
    <div className="icons-container">
      {imgUrls.map(u => (
        <img className="single-icon" alt="Application" src={u} key={u} />
      ))}
    </div>
  )
}

export const ApplicationTrackerTable = ({ sudBatch, studentID, allowCollapse = true }: Props) => {
  const ctx = useApplicationTrackerCtx()
  const students = useSelector(selectStudentsObject)
  const tableStudent = studentID ? students[studentID] : null
  const tasks = useShallowSelector(selectTasksForStudent(sudBatch[0]?.student))
  const universitiesObject = useSelector(selectUniversitiesObject)

  const [isCollapsed, setIsCollapsed] = useState(allowCollapse)
  const [activeSort, setActiveSort] = useState<SortBy>(SortBy.Asc)
  const [activeColumn, setActiveColumn] = useState<HeaderLabel>()
  const prevActiveColumn = useRef<HeaderLabel>(null)

  const headerRef = useRef<HTMLDivElement>(null)

  // We check ctx.activeTrackerColumns to see if we should activate a column (and if so determine its initial sortOrder)
  // This is only necessary on initial mount
  useEffect(() => {
    // Check what type of table are we rendering separatedByStudent or unified table
    if (ctx.separateStudents) {
      if (sudBatch[0].pk) {
        const activeColumnState = ctx.activeTrackerColumns[sudBatch[0].pk]
        if (activeColumnState) {
          setActiveColumn(activeColumnState.activeColumn)
          setActiveSort(activeColumnState.sortBy)
        }
      }
    } else {
      // Unified tracker is assigned -1 as its key in activeTrackerColumns (since all pks > 1)
      const unifiedColumnState = ctx.activeTrackerColumns[UNIFIED_TRACKER_ACTIVE_COLUMN_KEY]
      if (unifiedColumnState) {
        setActiveColumn(unifiedColumnState.activeColumn)
        setActiveSort(unifiedColumnState.sortBy)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  /**
   * My Byzantine column sorter
   * If the column that was just clicked wasn't already active, then we make it active and sort by asc
   * If it was active, we check current sorting state and flip it.
   * Finally, we store knowledge of activeColumn (which will be prevActiveColumn on next render) in a ref
   */
  const handleHeaderLabelClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    let activeSortResult: SortBy
    if (activeColumn !== HeaderLabel[e.currentTarget.classList[1]]) {
      // New active column case
      setActiveSort(SortBy.Asc)
      activeSortResult = SortBy.Asc
    } else if (activeSort === SortBy.Asc) {
      // Same active column case that was asc
      setActiveSort(SortBy.Desc)
      activeSortResult = SortBy.Desc
    } else {
      // Same active column case that was desc
      setActiveSort(SortBy.Asc)
      activeSortResult = SortBy.Asc
    }
    prevActiveColumn.current = activeColumn
    setActiveColumn(HeaderLabel[e.currentTarget.classList[1]])
    if (ctx.separateStudents) {
      ctx.setActiveTrackerColumns({
        ...ctx.activeTrackerColumns,
        [sudBatch[0].pk]: { sortBy: activeSortResult, activeColumn: HeaderLabel[e.currentTarget.classList[1]] },
      })
    } else {
      ctx.setActiveTrackerColumns({
        ...ctx.activeTrackerColumns,
        [UNIFIED_TRACKER_ACTIVE_COLUMN_KEY]: {
          sortBy: activeSortResult,
          activeColumn: HeaderLabel[e.currentTarget.classList[1]],
        },
      })
    }
  }

  let sortedSUDBatch: StudentUniversityDecisionExtended[]

  // If we have a single table with all students, then we (regrettably) need to use some JS to make the header
  // sticky because Jordan couldn't figure out how to keep the header fixed, the rows vertically scrollable,
  // and the table as a whole horizontally scrollable. Seems it may not be possible with CSS alone but
  // seems like it should be???
  const onScroll = (e: React.UIEvent<HTMLDivElement, UIEvent>) => {
    if (!ctx.separateStudents && headerRef.current) {
      headerRef.current.style.top = `${document.querySelector('.h-fixed')?.scrollTop || 0}px`
    }
  }
  switch (activeColumn) {
    // No active column
    case undefined:
      if (ctx.separateStudents) {
        sortedSUDBatch = orderBy(sudBatch, sud => sud.university_name?.toLowerCase())
      } else {
        sortedSUDBatch = orderBy(sudBatch, sud => [
          students[sud.student]?.last_name?.toLowerCase(),
          sud.university_name?.toLowerCase(),
        ])
      }
      break
    case HeaderLabel.Student:
      sortedSUDBatch = orderBy(sudBatch, sud => students[sud.student]?.last_name?.toLowerCase(), activeSort)
      break
    case HeaderLabel.University:
      sortedSUDBatch = orderBy(sudBatch, sud => sud.university_name?.toLowerCase(), activeSort)
      break
    case HeaderLabel.ShortAnswerStatus:
      sortedSUDBatch = orderBy(
        sudBatch,
        sud => tasks.filter(t => t.student_university_decisions.includes(sud.pk) && t.completed).length,
        activeSort,
      )
      break
    case HeaderLabel.Deadline:
      sortedSUDBatch = orderItemsByDateField('deadline_date', sudBatch, activeSort)
      break
    case HeaderLabel.Submitted:
      sortedSUDBatch = orderItemsByDateField('submitted', sudBatch, activeSort)
      break
    case HeaderLabel.TargetDate:
      sortedSUDBatch = orderItemsByDateField('goal_date', sudBatch, activeSort)
      break
    case HeaderLabel.Scholarship:
      sortedSUDBatch = orderBy(sudBatch, sud => sud[labelToSUDBatchKeyMap[activeColumn]], activeSort)
      break
    // NOTE: Default case should only handle alphanumberic strings and boolean sorting
    default:
      // Handles checkbox sorting (ascending => true values first)
      if (CHECKBOX_COLS.includes(activeColumn)) {
        sortedSUDBatch = orderBy(
          sudBatch,
          labelToSUDBatchKeyMap[activeColumn],
          activeSort === SortBy.Asc ? SortBy.Desc : SortBy.Asc,
        )
      } else {
        sortedSUDBatch = orderItemsByAlphanumericField(labelToSUDBatchKeyMap[activeColumn], sudBatch, activeSort)
      }
  }

  return (
    <div className={styles.ApplicationTrackerTable}>
      {ctx.separateStudents && (
        <div className="table-fixed-column">
          <div className="header-fixed-column">
            {allowCollapse && (
              <Button
                className="slim-btn collapse-expand-icon"
                type="link"
                icon={isCollapsed ? <DownOutlined /> : <UpOutlined />}
                onClick={() => setIsCollapsed(prev => !prev)}
              />
            )}
            <Link to={`/profile/student/${sortedSUDBatch[0]?.student}/`} className="header-student-name">
              {tableStudent ? renderHighlighter(getFullName(tableStudent), ctx.search) : 'Students'}
            </Link>
          </div>
          {sortedSUDBatch.map(sud => {
            return (
              <div className={`content-fixed-column ${isCollapsed ? 'hide' : ''}`} key={sud.pk}>
                {renderAppIcons(universitiesObject[sud.university].accepted_applications)}
                {renderHighlighter(sud.university_name, ctx.search)}
              </div>
            )
          })}
        </div>
      )}
      <div
        onScroll={onScroll}
        style={{ overflowX: isCollapsed && ctx.separateStudents ? 'hidden' : 'auto' }}
        className={`table-scrollable-columns ${!ctx.separateStudents ? 'h-fixed' : ''}`}
      >
        <div className="scrollable-header-row" ref={headerRef}>
          {ctx.displayHeaders.map(header_label => (
            <button
              type="button"
              className={`header-item ${HeaderLabelKeys[header_label]}`}
              key={header_label}
              onClick={handleHeaderLabelClick}
            >
              <span className={`header-label ${activeColumn === header_label ? 'active-label' : ''}`}>
                {header_label}
              </span>
              <div className="sort-icons">
                <CaretUpOutlined
                  className={`asc-icon ${
                    activeColumn === header_label && activeSort === SortBy.Asc ? 'active-arrow' : ''
                  }`}
                />
                <CaretDownOutlined
                  className={`desc-icon ${
                    activeColumn === header_label && activeSort === SortBy.Desc ? 'active-arrow' : ''
                  }`}
                />
              </div>
            </button>
          ))}
        </div>
        <div className="table-rows-inner-container">
          {sortedSUDBatch.map(sud => (
            <div key={sud.pk} className={isCollapsed && ctx.separateStudents ? 'hide' : ''}>
              <ApplicationTrackerTableRow sud={sud} studentName={getFullName(students[sud.student])} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
