// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Tag } from 'antd'
import { range, sortBy } from 'lodash'
import moment from 'moment'
import React, { useEffect, useState } from 'react'
import { Colors } from 'store/common/commonTypes'
import { useReduxDispatch } from 'store/store'
import { fetchDeadlines } from 'store/university/universityThunks'
import { Deadline, University } from 'store/university/universityTypes'
import styles from './styles/SchoolRequirementsTab.scss'

type Props = {
  university: University
}
// Map of field names on university to the label we should use for their application requirement
type ApplicationRequirementLabels = {
  [prop in keyof University]?: string
}

enum AppRequirementParams {
  OfficalReq = 'Official Required',
  SelfReported = 'Self-Reported',
  Required = 'Required',
  Optional = 'Optional',
  Considered = 'Considered',
}
enum DisplayStrings {
  PersonalEssay = 'Personal Essay',
  OfficalTrans = 'Offical Transcript',
  SelfReportedTrans = 'Self-Reported Transcript',
  TestScores = 'Test Scores',
  CounselorRec = 'Counselor Recommendation',
  International = 'International',
  TeacherRec = 'Teacher Recommendation',
  Interviews = 'Interviews',
  Resume = 'Resume',
  MidYear = 'Mid Year Report',
  TestScoresOpt = 'Test Scores Optional',
  OptionalTeacherRec = 'Optional Teacher Recommendation',
  OtherRec = 'Other Recommendation',
  DemonstratedInt = 'Demonstrated Interest',
  USStudents = 'for US Students',
  SATACTReq = 'SAT/ACT Required for International',
  NeedStatus = 'Need Status',
}

// Potentially use this to negate magic strings after CW finalizes requirement types
const APP_REQUIREMENT_LABELS: ApplicationRequirementLabels = {
  transcript_requirements: 'Transcript',
  mid_year_report: 'Mid-Year Report',
  common_app_personal_statement_required: 'CAPS',
  courses_and_grades: 'Courses and Grades',
  common_app_portfolio: 'Portfolio (CA)',
  testing_requirements: 'Testing',
  common_app_test_policy: 'Testing (CA)',
  counselor_recommendation_required: 'Required Counselor Recommendations',
}

const SchoolRequirementsTab = ({ university }: Props) => {
  const dispatch = useReduxDispatch()
  const [deadlines, setDeadlines] = useState<Deadline[]>()

  const additional: string[] = []
  const optional: string[] = []
  const appRequired: string[] = []

  useEffect(() => {
    dispatch(fetchDeadlines({ university: university.pk })).then(deadLines => {
      setDeadlines(sortBy(deadLines, d => moment(d.enddate, 'YYYY-MM-DD').valueOf()))
    })
  }, [dispatch, university])

  const renderAppRequirements = () => {
    if (university.common_app_personal_statement_required) {
      appRequired.push(DisplayStrings.PersonalEssay)
    }
    if (university.transcript_requirements === AppRequirementParams.OfficalReq) {
      appRequired.push(DisplayStrings.OfficalTrans)
    }
    if (university.transcript_requirements === AppRequirementParams.SelfReported) {
      appRequired.push(DisplayStrings.SelfReportedTrans)
    }
    if (university.testing_requirements.includes(AppRequirementParams.Required)) {
      appRequired.push(`${university.testing_requirements} ${DisplayStrings.TestScores}`)
    }
    if (university.counselor_recommendation_required) {
      appRequired.push(DisplayStrings.CounselorRec)
    }
    if (university.international_sat_act_subject_test_required && university.international_tests) {
      appRequired.push(`${DisplayStrings.International}: ${university.international_tests}`)
    }
    if (university.required_teacher_recommendations > 0) {
      range(university.required_teacher_recommendations).forEach((_, i) =>
        appRequired.push(`${DisplayStrings.TeacherRec} #${i + 1}`),
      )
    }
    if (university.interview_requirements.includes(AppRequirementParams.Required)) {
      appRequired.push(DisplayStrings.Interviews)
    }
    if (university.resume_required) {
      appRequired.push(DisplayStrings.Resume)
    }
    if (university.mid_year_report) {
      appRequired.push(DisplayStrings.MidYear)
    }
  }

  const renderOptionalRequirements = () => {
    if (university.testing_requirements.includes(AppRequirementParams.Optional)) {
      optional.push(DisplayStrings.TestScoresOpt)
    }
    if (university.optional_teacher_recommendations > 0) {
      range(university.optional_teacher_recommendations).forEach((_, i) =>
        optional.push(`${DisplayStrings.OptionalTeacherRec} #${i + 1}`),
      )
    }
    if (university.optional_other_recommendations > 0) {
      range(university.optional_other_recommendations).forEach((_, i) =>
        optional.push(`${DisplayStrings.OtherRec} #${i + 1}`),
      )
    }
    if (university.interview_requirements.includes(AppRequirementParams.Optional)) {
      optional.push(DisplayStrings.Interviews)
    }
    if (university.demonstrated_interest === AppRequirementParams.Considered) {
      optional.push(`${DisplayStrings.DemonstratedInt} (${AppRequirementParams.Considered})`)
    }
  }

  const renderAdditionalInfo = () => {
    if (university.testing_requirements) {
      additional.push(`${university.testing_requirements} ${DisplayStrings.USStudents}`)
    }
    if (university.international_sat_act_subject_test_required === true) {
      additional.push(DisplayStrings.SATACTReq)
    }
    if (university.interview_requirements) {
      additional.push(`${DisplayStrings.Interviews} ${university.interview_requirements}`)
    }
    if (university.need_status) {
      additional.push(`${DisplayStrings.NeedStatus}: ${university.need_status}`)
    }
    if (university.demonstrated_interest) {
      additional.push(`${DisplayStrings.DemonstratedInt} (${university.demonstrated_interest})`)
    }
  }

  renderAppRequirements()
  renderOptionalRequirements()
  renderAdditionalInfo()

  return (
    <section className={styles.requirementContent}>
      <div>
        <h2>Deadline:</h2>
        <div className="box">
          {deadlines?.map(dead => {
            return (
              <Tag className="tag" color="blue" key={dead.pk}>
                <strong>{dead?.type_of_name}:</strong> {moment(dead.enddate).format('MMM Do')}
              </Tag>
            )
          })}
        </div>
        <h2>Application Requirements: </h2>
        <div className="box">
          {appRequired.map(req => {
            return (
              <Tag className="tag" color="#06cfc3" key={req}>
                {req}
              </Tag>
            )
          })}
        </div>
        <div>
          <h2>Optional: </h2>
          {optional.map(req => {
            return (
              <Tag className="tag" color="#ff8d47" key={req}>
                {req}
              </Tag>
            )
          })}
        </div>
        <div>
          <h2>Additional Information: </h2>
          {additional.map(req => {
            return (
              <Tag className="tag" color={Colors.gray} key={req}>
                {req}
              </Tag>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default SchoolRequirementsTab
