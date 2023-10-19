// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React from 'react'
import { Student } from 'store/user/usersTypes'

export enum InsufficientHoursPromptViews {
  IndividualTestPrep,
  IndividualCurriculum,
  GroupTestPrep,
}

type OwnProps = {
  student?: Student
  activeView: InsufficientHoursPromptViews
  duration: number
}

export const InsufficientHoursPrompt = ({ student, duration, activeView }: OwnProps) => {
  if (!student) {
    return null
  }
  // Fancy array destructuring to prevent double comparison.
  let typeOfSession = 'Group Test Prep'
  let associatedHours = student.group_test_prep_hours
  if (activeView === InsufficientHoursPromptViews.IndividualTestPrep) {
    typeOfSession = 'Individual Test Prep'
    associatedHours = student.individual_test_prep_hours
  } else if (activeView === InsufficientHoursPromptViews.IndividualCurriculum) {
    typeOfSession = 'Individual Curriculum'
    associatedHours = student.individual_curriculum_hours
  }
  return (
    <section className="containerInsufficientHoursPrompt">
      <img className="credit-card-png" src="/static/cwcommon/creditCard.png" alt="credit card" />
      <div className="prompt">
        <p>
          Session duration (<strong>{`${duration} min`}</strong>) exceeds remaining amount (
          <strong>{`${associatedHours * 60} min`}</strong>)
          <br />
          <br />
          Please purchase additional{' '}
          <a to="#" className="purchase-a">
            {typeOfSession} hours
          </a>
        </p>
      </div>
    </section>
  )
}
