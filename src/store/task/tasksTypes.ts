import { UploadFile } from 'store/common/commonTypes'
import { Application } from 'store/university/universityTypes'

export const TASK_LOAD = 'task/load'
export const TASK_UPDATE = 'task/update'

export enum TaskType {
  Essay = 'essay',
  Rec = 'rec',
  SchoolResearch = 'school_research',
  Survey = 'survey',
  Testing = 'testing',
  Transcripts = 'transcripts',
  Other = 'other',
}

export interface Task {
  pk: number
  slug: string
  task_type: TaskType
  title: string
  description: string
  due: string | null
  reminder: string | null
  completed: string | null
  created: string
  for_user: number
  for_student?: number
  diagnostic?: number
  diagnostic_id?: number
  application: Application
  form?: TaskForm
  form_id?: number
  student_university_decisions: number[]
  diagnostic_result: number | null
  allow_content_submission: boolean
  content_submission: string
  allow_file_submission: boolean
  file_uploads: Array<UploadFile>
  allow_form_submission: boolean
  require_form_submission: boolean
  require_file_submission: boolean
  require_content_submission: boolean
  resources: Array<number>
  archived: string | null
  visible_to_counseling_student: boolean // Visible to student/parent on counseling platform
  // Just frontend properties
  loading?: boolean
  // Write Only
  update_file_uploads?: Array<string>
  roadmap_task_key: string
  task_template?: number
  // Read Only
  repeatable: boolean
  is_cap_task: boolean
  is_prompt_task: boolean
  form_submission_id: number | null
  counselor_meeting_template_name: string
  counseling_parent_task: boolean
  affects_tracker: boolean
  last_reminder_sent: string //datetime
}

// Defines key-value pairs that we can use to filter StudentUniversityDecisions to determine which
// SUDs should be associated with tasks created from a TaskTemplate

export type TaskTemplate = {
  pk: number
  slug: string
  task_type: TaskType
  title: string
  description: string
  resources: Array<number>
  diagnostic: number | null
  form: number | null
  allow_content_submission: boolean
  require_content_submission: boolean
  allow_file_submission: boolean
  require_file_submission: boolean
  allow_form_submission: boolean
  require_form_submission: boolean
  roadmap?: number
  include_school_sud_values: Record<string, any>
  // Readonly; If True then task template created by CW/admin and is not editable by counselor
  is_stock: boolean
  counseling_parent_task: boolean
  // If task template is from a roadmap or overrides a roadmap task template
  roadmap_key: string
  // User ID of creator. Use this to determine whether or not task template is created by a counselor
  created_by: number | null
  created: string // datetime string
  derived_from_task_template: number | null // ID of another TaskTemplate that this was derived from
  roadmap_count: number
  pre_agenda_item_templates: Array<number>
  post_agenda_item_templates: Array<number>
}

export enum InputType {
  TextBox = 'textbox',
  TextArea = 'textarea',
  Select = 'select',
  Multi = 'multi',
  CheckBox = 'checkbox',
  CheckBoxes = 'checkboxes',
  Radio = 'radio',
  UpDown = 'updown',
  Range = 'range',
}

export enum FieldType {
  String = 'string',
  Number = 'number',
  Integer = 'integer',
  Boolean = 'boolean',
  Array = 'array',
  Object = 'object',
  Null = 'null',
}

export enum FieldFormat {
  Email = 'email',
  Uri = 'uri',
  DataUrl = 'data-url',
  Date = 'date',
  DateTime = 'date-time',
}

export type FormField = {
  pk: number
  slug: string
  form: number
  key: string
  title: string
  description: string
  instructions: string
  placeholder: string
  default: string
  input_type: InputType
  field_type: FieldType
  required: boolean
  min_length: number | null
  max_length: number | null
  min_num: number | null
  max_num: number | null
  field_format: FieldFormat
  field_pattern: string
  choices: (string | number)[]
  order: number
  hidden: boolean
  inline: boolean
  created_by: number
}

export type TaskForm = {
  pk: number
  slug: string
  title: string
  description: string
  university: number | null
  form_fields: FormField[]
  active: boolean
}

export type FormFieldEntry = {
  pk: number
  slug: string
  content: string
  form_field: number
}

export type TaskFormSubmission = {
  pk: number
  slug: string
  form: number
  task: number
  submitted_by: number
  submitted: string
  form_field_entries: FormFieldEntry[]
}

export type TaskState = {
  tasks: {
    [pk: number]: Task
  }
  taskTemplates: {
    [pk: number]: TaskTemplate
  }
  taskForms: {
    [pk: number]: TaskForm
  }
  taskFormSubmissions: {
    [pk: number]: TaskFormSubmission
  }
}
