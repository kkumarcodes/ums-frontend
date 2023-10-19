// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React from 'react'
import { TutoringSessionsFilter, TutoringSessionsTable } from 'components/tutoring/TutoringSessions'

export const StudentTutoringSessionPage = () => {
  return (
    <div>
      <h1>Student Tutoring Sessions</h1>
      <TutoringSessionsFilter tab="list" />
      <TutoringSessionsTable />
    </div>
  )
}

export default StudentTutoringSessionPage
