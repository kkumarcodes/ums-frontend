export enum Application {
  COMMON_APP = 'common_app',
  UC_APP = 'uc',
  COALITION_APP = 'coalition',
  APPLY_TEXAS_APP = 'apply_texas',
  QUESTBRIDGE_APP = 'questbridge',
  UCAS_APP = 'ucas',
}

export const ApplicationIcons = {
  [Application.COMMON_APP]: '/static/cwcommon/common_app.png',
  [Application.UC_APP]: '/static/cwcommon/uc_app.png',
  [Application.COALITION_APP]: '/static/cwcommon/coalition_app.jpeg',
  [Application.APPLY_TEXAS_APP]: '/static/cwcommon/at_app.png',
  [Application.QUESTBRIDGE_APP]: '/static/cwcommon/questbridge.png',
  [Application.UCAS_APP]: '/static/cwcommon/ucas_app.jpeg',
}

export enum ApplicationLabel {
  COMMON_APP = 'Common App',
  UC_APP = 'UC App',
  COALITION_APP = 'Coalition App',
  APPLY_TEXAS_APP = 'ApplyTexas',
  QUESTBRIDGE_APP = 'Questbridge',
  UCAS_APP = 'UCAS',
}

export enum TargetReachSafety {
  'Far Reach' = 'far_reach',
  Reach = 'reach',
  'Target/Reach' = 'target_reach',
  Target = 'target',
  'Target/Likely' = 'target_likely',
  Likely = 'likely',
  'None' = '',
}

export enum AcceptanceStatus {
  'Waitlisted Then Accepted' = 'waitlisted_then_accepted',
  'Waitlisted Then Not Accepted' = 'waitlisted_then_not_accepted',
  'Withdrawn' = 'withdrawn',
  'Not Reported' = 'not_reported',
  'Accepted' = 'accepted',
  'Accepted (Spring Semester)' = 'accepted_spring',
  'Alternate Admission' = 'alternate',
  'Deferred' = 'deferred',
  'Deferred Then Accepted' = 'deferred_accepted',
  'Deferred Then Not Accepted' = 'deferred_then_not_accepted',
  'Deferred Then Waitlist' = 'deferred_then_waitlist',
  'Deferred Then Withdrew' = 'deferred_then_withdrew',
  'Guaranteed Transfer' = 'guaranteed_transfer',
  'Not Accepted' = 'not_accepted',
  'Waitlisted' = 'waitlisted',
}
export const SortedTargetReachSafety = ['far_reach', 'reach', 'target_reach', '', 'target', 'target_likely', 'likely']

export enum IsApplying {
  Yes = 'YES',
  No = 'NO',
  Maybe = 'MAYBE',
}

// Useful stats on University.scorecard_data
// May not reflect latest fields included in that metadata since the fields are likely to change
export type ScorecardData = {
  INSTNM: string // Institution name
  INSTURL: string // Institution website url
  NPCURL: string // Net Price calculator url
  UGDS: number // Undergraduate count
  TUITIONFEE_IN: number // In-state tuition
  TUITIONFEE_OUT: number // Out-of-state tuition
  ADM_RATE: number // Admission rate
  SATVR25: number | string // SAT Verbal 25th percentile
  SATVR75: number | string // SAT Verbal 75th percentile
  SATMT25: number | string // SAT Math 25th percentile
  SATMT75: number | string // SAT Math 75th percentile
  ACTCM25: number | string // ACT Cumulative 25th percentile
  ACTCM75: number | string // ACT Cumulative 75th percentile
  ACTMT25: number | string // ACT Math 25th percentile
  ACTMT75: number | string // ACT Math 75th percentile
  ACTEN25: number | string // ACT English 25th percentile
  ACTEN75: number | string // ACT English 75th percentile
  PCTPELL: number // Percentage of students receiving Pell Grant
  PCTFLOAN: number // Percentage of students receiving Federal Loan
}

export enum AdmissionDecision {
  Accepted = 'Accepted',
  NotAccepted = 'Not Accepted',
  Waitlisted = 'Waitlisted',
}

export enum UniversityTestDataKeys {
  ClassOf = 'Class of',
  AdmissionDecision = 'Admission Decision',
  GPA = 'GPA',
  SATSingle = 'SAT Single',
  ACT = 'ACT',
  Major = 'Major',
  AP_IB_Coll = 'AP/IB/Coll',
  Honors = 'Honors',
  AppDeadline = 'App Deadline',
  HomeState = 'Home State',
  AppliedTestOptional = 'Applied Test Optional',
}

export type UniversityTestData = {
  'Class of': string
  'Admission Decision': AdmissionDecision
  GPA: string
  'SAT Single': string
  ACT: string
  Major: string
  'AP/IB/Coll': string
  Honors: string
  'App Deadline': string
  'Home State': string
  'Applied Test Optional': boolean | null
}

export interface University {
  name: string
  long_name: string
  city: string
  state: string
  abbreviations: string // Comma separated list of abbreviations. Used for search
  url: string
  scid: string
  iped: string
  pk: number
  slug: string
  niche_url: string
  tpr_url: string
  unigo_url: string
  college_board_url: string
  scorecard_data: ScorecardData

  facebook_url: string
  twitter_url: string
  instagram_url: string
  youtube_url: string
  linkedin_url: string
  pinterest_url: string

  common_app_personal_statement_required: boolean
  transcript_requirements: string
  courses_and_grades: string
  common_app_portfolio: string
  testing_requirements: string
  common_app_test_policy: string
  counselor_recommendation_required: boolean
  mid_year_report: boolean
  international_tests: string
  required_teacher_recommendations: number
  optional_teacher_recommendations: number
  optional_other_recommendations: number
  interview_requirements: string
  need_status: string
  demonstrated_interest: string
  international_sat_act_subject_test_required: boolean
  resume_required: boolean
  accepted_applications: Application[]
}

// Analogous to application_tracker_status.APPLICATION_STATUS_CHOICES on backend
export enum CounselorTrackerApplicationStatus {
  None = '',
  // NotApplicable = 'n_a', // Deprecated
  ApplyOnOwn = 'n_a', // No this isn't a typo; We just want the label to change not the value sent to backend
  OnDeck = 'on_deck',
  Ready = 'ready',
  InProgress = 'in_progress',
  Submitted = 'submitted',
}

// Analogous to application_tracker_status.STATUS_CHOICES on backend
// Used for transcript, test score, and LOR fields on counselor tracker
export enum CounselorTrackerStatus {
  None = '',
  // NotApplicable = 'n_a', // Deprecated
  'Not Required' = 'n_a',
  Required = 'required',
  Optional = 'optional',
  Assigned = 'assigned',
  Requested = 'requested',
  Received = 'received',
}

// Base unit of student's official UMS school list. The schools they're potentially
// applying to
export interface StudentUniversityDecision {
  pk: number
  slug: string
  created: string
  updated: string
  student: number //pk
  university: number //pk
  university_name: string // READ_ONLY (for convenience on frontend)
  deadline: number | null //pk
  deadline_date: string
  custom_deadline: string | null
  custom_deadline_description: string
  goal_date: string
  note: string // Note counselor and student share on the university
  target_reach_safety: TargetReachSafety
  is_applying: IsApplying

  // The following fields are only visible to counselor/admin (NOT student/parent)
  // These fields primarily used on Application Tracker
  note_counselor_private?: string
  submitted?: string // datetime
  additional_requirement_deadline: boolean
  major?: string
  application?: string
  application_status?: CounselorTrackerApplicationStatus
  application_status_note?: string
  short_answer_note?: string
  transcript_status?: CounselorTrackerStatus
  transcript_note?: string
  test_scores_status?: CounselorTrackerStatus
  test_scores_note?: string
  recommendation_one_status?: CounselorTrackerStatus
  recommendation_one_note?: string
  recommendation_two_status?: CounselorTrackerStatus
  recommendation_two_note?: string
  recommendation_three_status?: CounselorTrackerStatus
  recommendation_four_status?: CounselorTrackerStatus
  standardized_testing?: string
  scholarship: number
  acceptance_status?: AcceptanceStatus
  twin: boolean
  honors_college: boolean
  additional_requirement_deadline_note: string
  send_test_scores: boolean
  short_answer_completion: number | null // Defined only for students whose counselor doesn't use Prompt
}

// ApplicationTracker uses an extended version of StudentUniversityDecision
export interface StudentUniversityDecisionExtended extends StudentUniversityDecision {
  deadline_type: string
  deadline_enddate: string
}

export enum DeadlineType {
  EarlyDecision = 'ED',
  EarlyDecision2 = 'EDII',
  EarlyAction = 'EA',
  EarlyAction2 = 'EAII',
  RegularEarlyAction = 'REA',
  Priority = 'Priority',
  RegularDecision = 'RD',
  Rolling = 'Rolling',
  Honors = 'Honors',
  Scholarship = 'Scholarship',
  RecommendedScholarship = 'Recommended Scholarship',
}

export interface Deadline {
  pk: number
  slug: string

  // type_of is the deadline type
  type_of_abbreviation: DeadlineType
  type_of_name: string
  category_name: string
  category_abbreviation: string

  startddate: string // Beginning of window student can apply
  enddate: string // This is the actual deadline
  university: number
}

export type UniversityState = {
  universities: {
    [pk: number]: University
  }
  studentUniversityDecisions: {
    [pk: number]: StudentUniversityDecision
  }
  deadlines: {
    [pk: number]: Deadline
  }
  // We track this so we don't load all universities all the time
  loadedAllUniversities: boolean
}
