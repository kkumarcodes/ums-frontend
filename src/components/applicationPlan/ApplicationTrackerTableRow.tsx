// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Checkbox, DatePicker, InputNumber, Select } from 'antd'
import ShortAnswerStatus from 'components/counseling/ApplicationPlan/ShortAnswerStatus'
import DeadlineSelector from 'components/schools/DeadlineSelector'
import { Majors } from 'copy/majors'
import { keys, startCase } from 'lodash'
import moment, { Moment } from 'moment'
import React from 'react'
import { useSelector } from 'react-redux'
import { useReduxDispatch } from 'store/store'
import { selectUniversitiesObject } from 'store/university/universitySelectors'
import { updateStudentUniversityDecision } from 'store/university/universityThunks'
import {
  AcceptanceStatus,
  ApplicationIcons,
  CounselorTrackerApplicationStatus,
  CounselorTrackerStatus,
  StudentUniversityDecisionExtended,
} from 'store/university/universityTypes'
import { useApplicationTrackerCtx } from './ApplicationTrackerContext'
import { renderAppIcons } from './ApplicationTrackerTable'
import { HeaderLabel } from './types'

type Props = {
  sud: StudentUniversityDecisionExtended
  studentName: string // Included as prop as convenience so we don't have to select it from the store in this component
}
const HL = HeaderLabel

// Series of columns that use application status. Used to render in loop
const APP_STATUS_COLS = [
  { key: 'transcript_status', className: 'transcript', label: HL.Transcript },
  { key: 'test_scores_status', className: 'test_scores', label: HL.TestScores },
  { key: 'recommendation_one_status', className: 'lor-1', label: HL.LOR1 },
  { key: 'recommendation_two_status', className: 'lor-2', label: HL.LOR2 },
  { key: 'recommendation_three_status', className: 'lor-3', label: HL.LOR3 },
  { key: 'recommendation_four_status', className: 'lor-4', label: HL.LOR4 },
]
// Checkbox columns. Used to render in loop
const CHECKBOX_COLS = [
  { key: 'send_test_scores', className: 'send-test-scores', label: HL.SendTestScores },
  { key: 'twin', className: 'twin', label: HL.Twin },
  { key: 'legacy', className: 'legacy', label: HL.Legacy },
  { key: 'honors_college', className: 'honors-college', label: HL.HonorsCollege },
]
const ADDL_REQUIREMENT_DEADLINE = {
  key: 'additional_requirement_deadline',
  className: 'additional-requirement-deadline',
  label: HL.AdditionalRequirementDeadline,
}

export const ApplicationTrackerTableRow = ({ sud, studentName }: Props) => {
  const dispatch = useReduxDispatch()
  const ctx = useApplicationTrackerCtx()
  const university = useSelector(selectUniversitiesObject)

  const handleSUDUpdate = (sudKey: string, value: any) => {
    dispatch(updateStudentUniversityDecision(sud.pk, { [sudKey]: value ?? '' }))
  }

  // Shortcut function that returns whether or not a column should be rendered, based on ctx.selectedHeaders
  const rdr = (lbl: HeaderLabel) => ctx.displayHeaders.includes(lbl)

  return (
    <div className="scrollable-content-row" key={sud.pk}>
      {rdr(HL.Student) && <div className="content-item student">{studentName}</div>}
      {rdr(HL.University) && (
        <div className="content-item university">
          {renderAppIcons(university[sud.university].accepted_applications)}
          {sud.university_name}
        </div>
      )}
      {rdr(HL.RTL) && <div className="content-item rtl">{startCase(sud.target_reach_safety)}</div>}
      {/* Hiding until data is available */}
      {/* <div className="content-item app">{startCase(sud.application) || 'N/A'}</div> */}
      {rdr(HL.Deadline) && (
        <div className="content-item deadline">
          <DeadlineSelector studentUniversityDecision={sud} />
        </div>
      )}
      {rdr(HL.ApplicationStatus) && (
        <div className="content-item  app-status">
          <Select
            defaultValue={sud.application_status}
            onSelect={value => handleSUDUpdate('application_status', value)}
            className="tracker-select"
          >
            {keys(CounselorTrackerApplicationStatus).map(key => (
              <Select.Option value={CounselorTrackerApplicationStatus[key]} key={key}>
                {startCase(key)}
              </Select.Option>
            ))}
          </Select>
        </div>
      )}
      {rdr(HL.TargetDate) && (
        <div className="content-item goal-date">
          <DatePicker
            defaultValue={sud.goal_date ? moment(sud.goal_date) : null}
            onChange={(value: Moment, dateString: string) =>
              handleSUDUpdate('goal_date', value ? value.toISOString() : null)
            }
            inputReadOnly
            format="M/D/YYYY"
          />
        </div>
      )}
      {rdr(HL.ShortAnswerStatus) && (
        <div className="content-item short-answer-status">
          <div className="short-answer-progress">
            <ShortAnswerStatus sud={sud.pk} />
          </div>
        </div>
      )}
      {APP_STATUS_COLS.filter(c => rdr(c.label)).map(c => (
        <div className={`content-item ${c.className}`} key={c.key}>
          <Select
            placeholder="Select..."
            defaultValue={sud[c.key] || undefined}
            onChange={v => handleSUDUpdate(c.key, v)}
            className="tracker-select"
          >
            <Select.OptGroup label="Planning">
              <Select.Option value="">(Blank)</Select.Option>
              <Select.Option value={CounselorTrackerStatus['Not Required']}>Not Required</Select.Option>
              <Select.Option value={CounselorTrackerStatus.Optional}>Optional</Select.Option>
              <Select.Option value={CounselorTrackerStatus.Required}>Required</Select.Option>
            </Select.OptGroup>
            <Select.OptGroup label="Assigning">
              <Select.Option value={CounselorTrackerStatus.Assigned}>Assigned</Select.Option>
            </Select.OptGroup>
            <Select.OptGroup label="Completed">
              <Select.Option value={CounselorTrackerStatus.Requested}>Requested</Select.Option>
              <Select.Option value={CounselorTrackerStatus.Received}>Received</Select.Option>
            </Select.OptGroup>
          </Select>
        </div>
      ))}
      {rdr(HL.AdditionalRequirementDeadline) && (
        <div className={`content-item content-checkbox-item ${ADDL_REQUIREMENT_DEADLINE.className}`}>
          <Checkbox
            checked={Boolean(sud[ADDL_REQUIREMENT_DEADLINE.key as keyof typeof sud])}
            onChange={e => handleSUDUpdate(ADDL_REQUIREMENT_DEADLINE.key, e.target.checked)}
          />
        </div>
      )}
      {rdr(HL.Major) && (
        <div className="content-item major">
          <Select
            defaultValue={sud.major}
            placeholder="Select major..."
            showSearch={true}
            allowClear={true}
            onChange={e => handleSUDUpdate('major', e)}
            options={Majors.map(m => ({ label: m, value: m }))}
            optionFilterProp="label"
          />
        </div>
      )}
      {rdr(HL.Scholarship) && (
        <div className="content-item scholarship">
          <InputNumber
            min={0}
            defaultValue={sud.scholarship}
            placeholder="###"
            onBlur={e => handleSUDUpdate('scholarship', e.target.value)}
            onPressEnter={e => handleSUDUpdate('scholarship', e.target.value)}
          />
        </div>
      )}
      {rdr(HL.Submitted) && (
        <div className="content-item submitted">
          <DatePicker
            defaultValue={sud.submitted ? moment(sud.submitted) : null}
            onChange={(value: Moment, dateString: string) =>
              handleSUDUpdate('submitted', value ? value.toISOString() : null)
            }
            inputReadOnly
            format="M/D/YYYY"
          />
        </div>
      )}
      {rdr(HL.AcceptanceStatus) && (
        <div className="content-item acceptance-status">
          <Select
            defaultValue={sud.acceptance_status}
            onSelect={value => handleSUDUpdate('acceptance_status', value)}
            className="tracker-select"
            showSearch={true}
            optionFilterProp="children"
          >
            {keys(AcceptanceStatus)
              .sort()
              .map(key => (
                <Select.Option value={AcceptanceStatus[key]} key={key}>
                  {startCase(key)}
                </Select.Option>
              ))}
          </Select>
        </div>
      )}
      {CHECKBOX_COLS.filter(c => rdr(c.label)).map(c => (
        <div className={`content-item content-checkbox-item ${c.className}`} key={c.key}>
          <Checkbox checked={Boolean(sud[c.key])} onChange={e => handleSUDUpdate(c.key, e.target.checked)} />
        </div>
      ))}
    </div>
  )
}
