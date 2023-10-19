// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { LoadingOutlined } from '@ant-design/icons'
import { Theme as AntDTheme } from '@rjsf/antd'
import { ISubmitEvent, UiSchema, withTheme } from '@rjsf/core'
import { Button, Space } from 'antd'
import moment from 'moment'
import { messageError, messageSuccess } from 'components/administrator'
import styles from 'components/task/styles/TaskForm.scss'
import { JSONSchema7 } from 'json-schema'
import { compact, map, snakeCase, throttle, zipObject } from 'lodash'
import React, { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { closeModal } from 'store/display/displaySlice'
import { useReduxDispatch } from 'store/store'
import { selectTask, selectTaskForm, selectTaskFormSubmissionForTask } from 'store/task/tasksSelectors'
import {
  createTaskFormSubmission,
  fetchTaskForm,
  fetchTaskFormSubmission,
  updateTask,
  updateTaskFormSubmission,
  fetchTask,
} from 'store/task/tasksThunks'
import { FieldType, FormField, FormFieldEntry, InputType } from 'store/task/tasksTypes'

const Form = withTheme(AntDTheme)

const SAVE_FORM_THROTTLE = 3000

type Props = {
  taskID?: number
  taskFormID: string | number
  readOnly?: boolean
}

/**
 * Renders a task form (can be readonly or submit via SubmitTaskModal)
 * @param taskID Required to submit task
 * @param taskFormID Identifies the form to render
 * @param readOnly Whether this form is readonly
 */
export const TaskFormDetail = ({ taskID, taskFormID, readOnly = false }: Props) => {
  const dispatch = useReduxDispatch()

  const taskForm = useSelector(selectTaskForm(taskFormID))
  const task = useSelector(selectTask(taskID))
  const taskFormSubmissionID = useSelector(selectTaskFormSubmissionForTask(task?.pk))?.pk ?? task?.form_submission_id

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  // This component is almost always updating.
  // If a formSubmission doesn't exist on load, we create it on initial form change.
  const [isUpdate, setIsUpdate] = useState(false)
  const [schema, setSchema] = useState<JSONSchema7>({})
  const [uiSchema, setUiSchema] = useState<UiSchema>({})
  const [formData, setFormData] = useState({})

  /**
   * Helper function that generates JSONSchema from form_fields
   */
  const shapeSchemaFromData = (form_fields: FormField[], readOnly: boolean) => {
    const schema: JSONSchema7 = {}
    if (readOnly) {
      schema.readOnly = readOnly
    }
    schema.$schema = 'http://json-schema.org/draft-07/schema#'
    schema.type = FieldType.Object
    schema.required = form_fields.filter(field => field.required).map(field => field.key)
    const field_properties = form_fields.map((field: FormField) => {
      const commonFields = {
        type: field.field_type,
        title: field.title,
      }
      // replaces field.default = "" (empty string) with undefined
      // so as to allow required field validation (little hackie ... for sure)
      // Note default files are strings so "0" will not be falsy
      const defaultValue = field.default ? field.default : undefined

      // Select field component that allows for single selection
      if (field.input_type === InputType.Select) {
        return {
          ...commonFields,
          default: defaultValue,
          enum: field.choices,
        }
      }
      // Select field component that allows for multiple selections
      if (field.input_type === InputType.Multi) {
        return {
          ...commonFields,
          items: {
            type: FieldType.String,
            enum: field.choices,
          },
          uniqueItems: true,
        }
      }
      if (field.input_type === InputType.Radio) {
        return {
          ...commonFields,
          default: defaultValue,
          enum: field.choices,
        }
      }
      // Note that since field.default is a string => "1" for true, "0" for false
      if (field.input_type === InputType.CheckBox) {
        return {
          ...commonFields,
          default: Boolean(Number(field.default)),
        }
      }
      // default case: field.input_type === 'textbox' or 'textarea
      return {
        ...commonFields,
        default: defaultValue,
      }
    })
    schema.properties = zipObject(map(form_fields, 'key'), field_properties)
    return schema
  }

  /**
   * Helper function that generates uiSchema from form title and form_fields
   * ref: https://react-jsonschema-form.readthedocs.io/en/latest/api-reference/uiSchema/
   */
  const shapeUiSchemaFromData = (formTitle: string, form_fields: FormField[]) => {
    let uiSchema: UiSchema = {}

    const uiSchema_props = form_fields.map((field: FormField) => {
      const classNames = `${snakeCase(formTitle)}-${field.key}`
      // FIXME: Note ui:help should be set to field.instructions, but antd doesn't support field descriptions out of the box (need custom widgets)
      const commonUiFields = {
        classNames,
        'ui:placeholder': field.placeholder,
        'ui:help': field.description,
      }
      if (field.input_type === InputType.TextArea) {
        return {
          'ui:widget': field.input_type,
          ...commonUiFields,
        }
      }
      if (field.input_type === InputType.Select) {
        return {
          'ui:widget': field.input_type,
          ...commonUiFields,
        }
      }
      if (field.input_type === InputType.Radio) {
        return {
          'ui:widget': field.input_type,
          'ui:options': {
            inline: field.inline,
          },
          ...commonUiFields,
        }
      }
      if (field.input_type === InputType.CheckBox) {
        return commonUiFields
      }
      // Default Case: field.input_type === 'textbox' (number)
      if (field.field_type === FieldType.Integer) {
        return {
          'ui:widget': InputType.UpDown,
          ...commonUiFields,
        }
      }
      // Default Case: field.input_type === 'textbox' (string)
      return commonUiFields
    })

    uiSchema = zipObject(map(form_fields, 'key'), uiSchema_props)

    // Assign form_field order
    const ui_order = []
    form_fields.forEach(field => {
      ui_order[field.order] = field.key
    })
    uiSchema['ui:order'] = compact(ui_order)

    return uiSchema
  }

  /**
   * Helper function that transforms formData into taskFormSubmission payload
   */
  const createTaskFormSubmissionPayload = (formData, taskForm) => {
    const payload: any = {}
    payload.form = taskFormID
    payload.task = taskID
    // Transform formData object into form_field_entries list
    payload.form_field_entries = Object.keys(formData).map(key => ({
      content: formData[key],
      form_field: taskForm.form_fields.find(field => field.key === key).pk,
    })) as FormFieldEntry[]
    return payload
  }

  /**
   * We load form data and form field entries if form submission exist
   */
  useEffect(() => {
    // We only want to show the form loading if taskForm is undefined, and thus need to fetch
    if (!taskForm && taskFormID) {
      setLoading(true)
    }
    const promises: Array<Promise<any>> = []
    if (taskFormID) {
      promises.push(dispatch(fetchTaskForm(taskFormID)))
    }
    if (taskFormSubmissionID) {
      // Form submission exist ... switch to update
      setIsUpdate(true)
      // Let's populate form with any existing form_field_entries
      promises.push(dispatch(fetchTaskFormSubmission(taskFormSubmissionID)))
    }
    Promise.all(promises)
      .then(results => {
        const { title, form_fields }: { title: string; form_fields: FormField[] } = results[0]
        let form_fields_with_default_entries: FormField[] = []
        if (isUpdate) {
          const form_field_entries: FormFieldEntry[] = results[1]?.form_field_entries
          // If we are updating the form submission, set current form field entries to default on form_fields
          form_fields_with_default_entries = form_fields.map(ff => {
            const clone_ff = { ...ff }
            // We may not have form_field_entry for the given form_field ... so in that case we return an empty string
            clone_ff.default = form_field_entries?.find(ffe => ffe.form_field === ff.pk)?.content ?? ''
            // Since content is always stored as a string on the backend, we need to check if content should in fact
            // be coerced into a number on the frontend in order to avoid form validation errors
            // NOTE: Currently the only field_type in use are either string or number but other types are possible
            // ref: cwtasks.models.FormField => INPUT_TYPE_CHOICES
            if (ff.field_type === 'number') {
              clone_ff.default = Number(clone_ff.default)
            }
            return clone_ff
          })
        }
        const formFieldPayload = isUpdate ? form_fields_with_default_entries : form_fields

        setSchema(shapeSchemaFromData(formFieldPayload, readOnly))
        setUiSchema(shapeUiSchemaFromData(title, formFieldPayload))
      })
      .catch(err => {
        console.log(err)
        messageError('Failed to load')
      })
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, isUpdate, readOnly, taskFormID, taskFormSubmissionID, taskID])

  /**
   * Autosave form in the background - every SAVE_FORM_THROTTLE milliseconds
   */
  const throttledAutosaveCB = useCallback(
    throttle((formData, taskForm) => {
      const payload = createTaskFormSubmissionPayload(formData, taskForm)
      dispatch(updateTaskFormSubmission(taskFormSubmissionID, payload))
    }, SAVE_FORM_THROTTLE),
    [taskFormSubmissionID],
  )

  /**
   * Manual save of form submission - doesn't complete task
   */
  const handleSaveAndExit = () => {
    const payload = createTaskFormSubmissionPayload(formData, taskForm)
    setSaving(true)
    dispatch(updateTaskFormSubmission(taskFormSubmissionID as number, payload))
      .then(taskFormSubmission => {
        // This fetch call updates the `form_submission_id` field on the task
        dispatch(fetchTask(taskID as number))
        messageSuccess('Form saved!')
        setSaving(false)
        dispatch(closeModal())
      })
      .catch(err => {
        setSaving(false)
        messageError('Save failed')
      })
  }

  /**
   * Sets formData to be controlled via local state
   * Creates form submission if it doesn't exist
   * Triggers form autosave
   */
  const handleChange = ({ formData: uncontrolledFormData }: ISubmitEvent<any>) => {
    // Let's clean form uncontrolledFormData of possible undefined entries
    // This happens when a student has cleared all input "empty input"
    const cleanedFormData: Record<string, any> = {}
    for (const key in uncontrolledFormData) {
      cleanedFormData[key] = uncontrolledFormData[key] === undefined ? '' : uncontrolledFormData[key]
    }
    // Create TaskFormSubmission in the background if it doesn't exist
    if (!isUpdate && task?.pk && !taskFormSubmissionID) {
      const payload = createTaskFormSubmissionPayload(cleanedFormData, taskForm)
      dispatch(createTaskFormSubmission(payload)).then(() => setIsUpdate(true))
    }

    // Throttled server update
    if (taskFormSubmissionID) {
      throttledAutosaveCB(cleanedFormData, taskForm)
    }
    // We update local formData onChange
    setFormData(cleanedFormData)
  }

  /**
   * Saves and completes form/task
   */
  const handleSubmit = ({ formData }: ISubmitEvent<any>) => {
    const payload = createTaskFormSubmissionPayload(formData, taskForm)
    setSaving(true)
    if (taskFormSubmissionID && taskID) {
      Promise.all([
        dispatch(updateTaskFormSubmission(taskFormSubmissionID, payload)),
        dispatch(updateTask({ pk: taskID, completed: moment().format() })),
      ])
        .then(responses => {
          setSaving(false)
          dispatch(closeModal())
        })
        .catch(err => {
          setSaving(false)
          messageError('Form submission failed')
        })
    } else {
      dispatch(closeModal())
    }
  }
  return (
    <div className={styles.taskFormDetailPage}>
      {loading && (
        <div className="loading-container">
          <LoadingOutlined spin />
        </div>
      )}
      {!loading && taskForm && (
        <div className={styles.taskFormContainer}>
          <div className="form-header">
            <h2 className="form-title center">{taskForm.title}</h2>
            <div
              className="form-description"
              /* eslint-disable-next-line react/no-danger */
              dangerouslySetInnerHTML={{ __html: taskForm.description }}
            />
          </div>
          <div className={styles.taskFormWrapper}>
            <Form
              schema={schema}
              uiSchema={uiSchema}
              formData={formData}
              onSubmit={handleSubmit}
              onChange={handleChange}
              showErrorList={false}
            >
              <Space className="btn-container">
                {taskID && (
                  <>
                    {!readOnly && (
                      <Button htmlType="button" size="large" type="default" onClick={handleSaveAndExit}>
                        Save and Close
                      </Button>
                    )}
                    {!readOnly && (
                      <Button type="primary" size="large" htmlType="submit" loading={saving}>
                        Submit Form
                      </Button>
                    )}
                  </>
                )}
              </Space>
            </Form>
          </div>
        </div>
      )}
    </div>
  )
}
