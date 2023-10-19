import { invert } from 'lodash'

/**
 * NOTE:
 *  ApplicationTrackerTable column asc/desc sorter logic
 * might need to be tweaked if you add additional columns
 */

export enum HeaderLabel {
  // Student and University only used when we are displaying all students in the same table
  Student = 'Student',
  University = 'University',
  RTL = 'R/T/L',
  // Application = 'Application',
  Deadline = 'Deadline',
  ApplicationStatus = 'Application Status',
  TargetDate = 'Target Date',
  ShortAnswerStatus = 'Short Answer Status',
  Transcript = 'Transcript',
  TestScores = 'Test Scores',
  LOR1 = 'LOR-1 Status',
  LOR2 = 'LOR-2 Status',
  LOR3 = 'LOR-3 Status',
  LOR4 = 'LOR-4 Status',
  AdditionalRequirementDeadline = 'Addl Req',
  Major = 'Major',
  Scholarship = 'Scholarship',
  Submitted = 'Submitted',
  AcceptanceStatus = 'Acceptance Status',
  Twin = 'Twin',
  Legacy = 'Legacy',
  HonorsCollege = 'Honors College',
  SendTestScores = 'Send Test Scores',
  Applications = 'Applications',
}

export const HeaderLabelKeys = invert(HeaderLabel)
// Header labels that only exist when students aren't separated into separate tables
export const SingleTableHeaders = [HeaderLabel.Student, HeaderLabel.University]

export enum SortBy {
  Asc = 'asc',
  Desc = 'desc',
}

export const labelToSUDBatchKeyMap = {
  'R/T/L': 'target_reach_safety',
  Deadline: 'deadline_enddate',
  'Application Status': 'application_status',
  'Target Date': 'goal_date',
  'Short Answer Status': 'short_answer_status',
  Transcript: 'transcript_status',
  'Test Scores': 'test_scores_status',
  'LOR-1 Status': 'recommendation_one_status',
  'LOR-2 Status': 'recommendation_two_status',
  'LOR-3 Status': 'recommendation_three_status',
  'LOR-4 Status': 'recommendation_four_status',
  'Addl Req': 'additional_requirement_deadline',
  Major: 'major',
  Scholarship: 'scholarship',
  Submitted: 'submitted',
  'Acceptance Status': 'acceptance_status',
  Twin: 'twin',
  Legacy: 'legacy',
  'Honors College': 'honors_college',
}

export type ActiveColumnState = {
  activeColumn: HeaderLabel // empty string implies table has no active column
  sortBy: SortBy
}

export type ActiveTrackerColumns = {
  [sudPK: string]: ActiveColumnState
}
