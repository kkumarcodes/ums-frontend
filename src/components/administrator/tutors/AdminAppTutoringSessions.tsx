// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React from 'react'
import { TutoringSessionsFilter, TutoringSessionsTable } from 'components/tutoring/TutoringSessions'

export const AdminAppTutoringSessions = () => {
  return (
    <>
      <TutoringSessionsFilter tab="list" />
      <TutoringSessionsTable />
    </>
  )
}
