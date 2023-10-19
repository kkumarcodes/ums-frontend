// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import React from 'react'
import styles from './styles/Roadmap.scss'

type Props = {
  grade: number
  idx?: number
}

const RoadmapGradeColumn = ({ grade, idx }: Props) => {
  const title = grade >= 9 ? `${grade}th Grade` : 'Pre - 9th Grade'
  return (
    <div className={`${styles.roadmapGradeColumn} roadmap-grade-column idx-${idx}`}>
      <div className={`grade-title center rokkit idx-${idx}`}>{title}</div>
      <div className="columns-container">
        <div className="semester">
          <div className={`semester-title idx-${idx}`}>First Semester</div>
        </div>
        <div className="semester">
          <div className={`semester-title idx-${idx}`}>Second Semester</div>
        </div>
        <div className="semester">
          <div className={`semester-title idx-${idx}`}>Summer</div>
        </div>
      </div>
    </div>
  )
}
export default RoadmapGradeColumn
