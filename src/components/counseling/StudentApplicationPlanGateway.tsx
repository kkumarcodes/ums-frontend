// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import StudentApplicationPlanPage from 'components/counseling/ApplicationPlan/StudentApplicationPlanPage'
import { VerticalRoadmap } from 'components/counseling/Roadmap/VerticalRoadmap'
import useActiveStudent from 'libs/useActiveStudent'
import React from 'react'

/**
 * A component that passes the butter.
 * It's sole purpose is to render a subcomponent
 * based on whether a student's school list is finalized or not.
 */
export const StudentApplicationPlanGateway = () => {
  const activeStudent = useActiveStudent()

  return activeStudent?.school_list_finalized ? <StudentApplicationPlanPage /> : <VerticalRoadmap />
}
