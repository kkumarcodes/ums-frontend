import { UploadFile } from 'store/common/commonTypes'

export enum DiagnosticStates {
  PENDING_SCORE = 'ps',
  PENDING_RECOMMENDATION = 'pr',
  PENDING_RETURN = 'pe',
  VISIBLE_TO_STUDENT = 'v',
}

/** DiagnosticGroupTutoringSessionRegistration model on the backed */
export enum DiagnosticRegistrationType {
  ACT = 'act',
  SAT = 'sat',
  BOTH = 'both',
}
export interface DiagnosticRegistration {
  pk: number
  slug: string
  created: string
  group_tutoring_sessions: number[]
  student: number
  registration_type: DiagnosticRegistrationType
  registration_data: object // Free-Form Metadata associated with submission
  student_name: string
  student_email: string
  parent_name: string
  parent_email: string
  assigned_evaluators: string // Comma separated list of people assigned to review
  self_assigned_diagnostics: number[]
  program_advisor: string
}

export interface Diagnostic {
  pk: number
  diagnostic_type: string
  title: string
  description: string
  resources?: Array<number>
  created_by?: number // User PK
  updated_by?: number // User PK
  can_self_assign: boolean
}
export interface DiagnosticResult {
  pk: number
  diagnostic: number
  diagnostic_title: string
  state: DiagnosticStates
  task?: number // Deprecated, use assigned_to instead
  assigned_to?: number
  submission_note?: string
  student_name?: string
  student_accommodations?: string
  recommender_name?: string
  admin_note?: string
  submitted_by?: number // User PK
  score?: number
  student: number // User PK
  created: string
  updated?: string
  tasks?: number[]
  recommendation?: string // FileUpload slug
  file_uploads: Array<UploadFile>
  update_file_uploads: Array<string> // Array of FileUpload slugs
  student_has_multiple_unreturned: boolean
  registration_data: object // Free-Form Metadata associated with submission of DiagnosticRegistration

  // Read only fields
  program_advisor: string
  counselor: number
}

export interface TransitionDiagnosticResultPayload {
  recommendation_file_upload?: string
  score?: number
  return_to_student?: boolean
}

export enum TestType {
  'SAT' = 'SAT',
  'ACT' = 'ACT',
  'SAT Subject' = 'SAT Subject',
  'AP' = 'AP',
  'IB' = 'IB',
  'IELTS' = 'IELTS',
  'Practice ACT' = 'Practice ACT',
  'Practice SAT' = 'Practice SAT',
  'PSAT' = 'PSAT',
  'Pre ACT' = 'Pre ACT',
  'PSAE' = 'PSAE',
  'TOEFL' = 'TOEFL',
}

export type TestResult = {
  pk: number
  slug: string
  title: string
  test_date: string
  test_type: TestType
  student: number
  score: number
  file_uploads: UploadFile[]
  update_file_uploads: Array<string>
  reading: number
  reading_sub: number
  writing: number
  writing_sub: number
  math: number
  math_sub: number
  english: number
  science: number
  speaking: number
  listening: number
}

export type SubscoreFieldDescriptor = {
  name: string
  label: string
}

// Keys are test names. Values are lists of { 'name', 'label' } pairs for all of the subscore fields
// for the test type
export const DEFAULT_SUBSCORE_FIELDS = [{ name: 'score', label: 'Score' }]
export const SUBSCORE_FIELDS = {
  [TestType.SAT]: [
    { name: 'score', label: 'Composite' },
    { name: 'reading', label: 'Reading/Writing' },
    { name: 'math', label: 'Math' },
    { label: 'Reading (Sub)', name: 'reading_sub' },
    { name: 'writing_sub', label: 'Writing/Lang. (Sub)' },
    { name: 'math_sub', label: 'Math (Sub)' },
  ],
  [TestType.ACT]: [
    { name: 'score', label: 'Composite' },
    { name: 'reading', label: 'Reading' },
    { name: 'math', label: 'Math' },
    { name: 'english', label: 'English' },
    { name: 'science', label: 'Science' },
  ],
  [TestType.IELTS]: [
    { name: 'score', label: 'Composite' },
    { name: 'reading', label: 'Reading' },
    { name: 'speaking', label: 'Speaking' },
    { name: 'writing', label: 'Writing' },
    { name: 'listening', label: 'Listening' },
  ],
  [TestType.TOEFL]: [
    { name: 'score', label: 'Composite' },
    { name: 'reading', label: 'Reading' },
    { name: 'speaking', label: 'Speaking' },
    { name: 'writing', label: 'Writing' },
    { name: 'listening', label: 'Listening' },
  ],
  [TestType['Practice ACT']]: [
    { name: 'score', label: 'Composite' },
    { name: 'reading', label: 'Reading' },
    { name: 'math', label: 'Math' },
    { name: 'english', label: 'English' },
    { name: 'science', label: 'Science' },
  ],
  [TestType['Pre ACT']]: [
    { name: 'score', label: 'Composite' },
    { name: 'reading', label: 'Reading' },
    { name: 'math', label: 'Math' },
    { name: 'english', label: 'English' },
    { name: 'science', label: 'Science' },
  ],
  [TestType.PSAE]: [
    { name: 'score', label: 'Composite' },
    { name: 'reading', label: 'Reading' },
    { name: 'math', label: 'Math' },
    { name: 'english', label: 'English' },
    { name: 'science', label: 'Science' },
  ],
  [TestType['Practice SAT']]: [
    { name: 'score', label: 'Composite' },
    { name: 'reading', label: 'Reading/Writing' },
    { name: 'math', label: 'Math' },
    { label: 'Reading (Sub)', name: 'reading_sub' },
    { name: 'writing_sub', label: 'Writing/Lang. (Sub)' },
    { name: 'math_sub', label: 'Math (Sub)' },
  ],
  [TestType.PSAT]: [
    { name: 'score', label: 'Composite' },
    { name: 'reading', label: 'Reading/Writing' },
    { name: 'math', label: 'Math' },
    { label: 'Reading (Sub)', name: 'reading_sub' },
    { name: 'writing_sub', label: 'Writing/Lang. (Sub)' },
    { name: 'math_sub', label: 'Math (Sub)' },
  ],
}

export interface DiagnosticState {
  diagnostics: {
    [pk: number]: Diagnostic
  }
  diagnosticResults: {
    [pk: number]: DiagnosticResult
  }
  testResults: {
    [pk: number]: TestResult
  }
  diagnosticRegistrations: {
    [pk: number]: DiagnosticRegistration
  }
}
