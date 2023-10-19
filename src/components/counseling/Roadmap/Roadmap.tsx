// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { ArrowRightOutlined } from '@ant-design/icons'
import { Empty, Skeleton, Switch } from 'antd'
import { useRoadmap } from 'components/counseling/Roadmap/useRoadmap'
import { groupBy, map, orderBy, range, values, zip } from 'lodash'
import React from 'react'
import { CounselorMeeting } from 'store/counseling/counselingTypes'
import RoadmapGradeColumn from './RoadmapGradeColumn'
import RoadmapMeetingsRow from './RoadmapMeetingsRow'
import styles from './styles/Roadmap.scss'

type Props = {
  studentID?: number
}

const SEMESTER_WIDTH = 300
const ROW_HEIGHT = 260
const MIN_GRADE = 8
const MAX_GRADE = 12

const Roadmap = ({ studentID }: Props) => {
  const { loading, showPast, setShowPast, meetings } = useRoadmap(studentID)
  // Keeps JSX a little cleaner if we just return upon loading here
  if (loading) {
    return (
      <div className={styles.roadmap}>
        <Skeleton loading={true} />
      </div>
    )
  }
  if (!meetings.length) {
    return (
      <div className={styles.roadmap}>
        <Empty description="No roadmap has been created yet" />
      </div>
    )
  }
  // The earliest grade, or 8th
  const meetingGrades = map(meetings, 'grade').filter(d => d)
  const earliestGrade = Math.max(Math.min(...meetingGrades), MIN_GRADE)
  const grades = range(earliestGrade, MAX_GRADE)

  // We use fixed width/absolute positioning for everything
  const totalWidth = 3 * SEMESTER_WIDTH * (MAX_GRADE - earliestGrade)

  // We build up sets of the meetings that we need. Basically we build arrays of meetings for each
  // grade (sorted by semester then order). Then we create arrays of all meetings with the same index across
  // all grades (i.e. one row with all meetings of idx 0, another of all with idx 1). These arrays become the
  // sets of meetings to display in each row on the roadmap.
  const meetingsByGrade = values(
    groupBy(orderBy(meetings, ['start', 'order'], ['asc', 'asc']), m => Math.round(m.grade)),
  )

  const meetingRows = zip(...meetingsByGrade).map(arr =>
    arr.filter(a => a && a.semester && a.grade),
  ) as CounselorMeeting[][]

  // Fixed height based on number of rows
  const totalHeight = ROW_HEIGHT * meetingRows.length

  return (
    <div className={styles.roadmap}>
      <div className="wisernet-toolbar">
        <div>
          <Switch checked={showPast} onChange={setShowPast} />
          &nbsp; Show Past Meetings
        </div>

        {totalWidth > (document.querySelector('body')?.clientWidth || 1200) && (
          <div className="help">
            Scroll for more <ArrowRightOutlined />
          </div>
        )}
      </div>
      <div className="scroll-container">
        <div className="content-container" style={{ width: `${totalWidth}px`, height: `${totalHeight}px` }}>
          <div className="roadmap-columns">
            {grades.map((grade, idx) => (
              <RoadmapGradeColumn idx={idx} key={grade} grade={grade} />
            ))}
          </div>
          <div className="roadmap-rows">
            {meetingRows.map((meetings, idx) => (
              <RoadmapMeetingsRow
                startGrade={earliestGrade}
                key={idx}
                meetings={meetings}
                semesterWidth={SEMESTER_WIDTH}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
export default Roadmap
