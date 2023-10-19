// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { QuestionCircleOutlined } from '@ant-design/icons'
import { Form, message, Modal, Radio, Select, Tooltip } from 'antd'
import { useForm } from 'antd/lib/form/Form'
import { WrappedSwitch, WrappedTextInput } from 'components/common/FormItems'
import { RichTextEditor } from 'components/common/RichTextEditor'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectAgendaItemTemplate } from 'store/counseling/counselingSelectors'
import { updateAgendaItemTemplate } from 'store/counseling/counselingThunks'
import { selectVisibleModal, selectVisibleModalProps } from 'store/display/displaySelectors'
import { closeModal } from 'store/display/displaySlice'
import { MODALS, TaskTemplateModalProps } from 'store/display/displayTypes'
import { selectResources } from 'store/resource/resourcesSelectors'
import { useReduxDispatch } from 'store/store'
import { selectTaskTemplate } from 'store/task/tasksSelectors'
import { createTaskTemplate, updateTaskTemplate } from 'store/task/tasksThunks'
import { TaskTemplate, TaskType } from 'store/task/tasksTypes'
import styles from './styles/TaskTemplateModal.scss'

enum SubmissionOptions {
  NotAllowed,
  Allowed,
  Required,
}

// All created tasks are of this type
const NEW_TASK_TYPE = TaskType.Other

const TaskTemplateModal = () => {
  const dispatch = useReduxDispatch()
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm();
  const [description, setDescription] = useState('')
  const visible = useSelector(selectVisibleModal(MODALS.TASK_TEMPLATE_MODAL))
  const props = useSelector(selectVisibleModalProps(MODALS.TASK_TEMPLATE_MODAL)) as TaskTemplateModalProps
  const resources = useSelector(selectResources)

  const [contentSubmissionOption, setContentSubmissionOption] = useState(SubmissionOptions.Allowed)
  const [fileSubmissionOption, setFileSubmissionOption] = useState(SubmissionOptions.Allowed)

  const editTaskTemplate = useSelector(selectTaskTemplate(props?.taskTemplateID))
  const agendaItemTemplate = useSelector(selectAgendaItemTemplate(props?.agendaItemTemplateID))

  const isStock = editTaskTemplate?.is_stock
  const isRoadmapTaskTemplate = !!editTaskTemplate?.roadmap_key
  const editPK = editTaskTemplate?.pk
  
  useEffect(() => {
    if (editTaskTemplate) {
      form.setFieldsValue(editTaskTemplate)
      setDescription(editTaskTemplate.description)
      if (editTaskTemplate.require_content_submission) setContentSubmissionOption(SubmissionOptions.Required)
      else if (editTaskTemplate.allow_content_submission) setContentSubmissionOption(SubmissionOptions.Allowed)
      else setContentSubmissionOption(SubmissionOptions.NotAllowed)

      if (editTaskTemplate.require_file_submission) setFileSubmissionOption(SubmissionOptions.Required)
      else if (editTaskTemplate.allow_file_submission) setFileSubmissionOption(SubmissionOptions.Allowed)
      else setFileSubmissionOption(SubmissionOptions.NotAllowed)
    } else {
      form.resetFields()
      setDescription('')
    }
  }, [editPK]) // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async () => {
    try {
      setSaving(true)
      form.validateFields()
    } catch {
      return
    }
    const taskTemplate: Partial<TaskTemplate> = form.getFieldsValue()
    if (!editTaskTemplate) taskTemplate.task_type = NEW_TASK_TYPE
    taskTemplate.require_content_submission = false
    taskTemplate.allow_content_submission = false
    taskTemplate.require_file_submission = false
    taskTemplate.allow_file_submission = false
    taskTemplate.description = description
    if (contentSubmissionOption === SubmissionOptions.Allowed) taskTemplate.allow_content_submission = true
    if (contentSubmissionOption === SubmissionOptions.Required) taskTemplate.require_content_submission = true
    if (fileSubmissionOption === SubmissionOptions.Allowed) taskTemplate.allow_file_submission = true
    if (fileSubmissionOption === SubmissionOptions.Required) taskTemplate.require_file_submission = true
    
    try {
      // Editing (editing counselor created custom task template)
      if (editPK && !isStock) {
        await dispatch(updateTaskTemplate({ ...editTaskTemplate, ...taskTemplate, pk: editPK }))
        // Editing a stock roadmap task template => Instead of updating, we create a new custom task template
      } else if (editPK && isStock && isRoadmapTaskTemplate) {
        const newTaskTemplate = await dispatch(
          createTaskTemplate({
            ...taskTemplate,
            derived_from_task_template: editPK,
            roadmap_key: editTaskTemplate?.roadmap_key,
          }),
        )
        if (props.agendaItemTemplateID) {
          const preMeetingTaskTemplateIDs = agendaItemTemplate?.pre_meeting_task_templates || []
          await dispatch(
            updateAgendaItemTemplate(props.agendaItemTemplateID, {
              pre_meeting_task_templates: [...preMeetingTaskTemplateIDs, newTaskTemplate.pk],
            }),
          )
        }
      } else if (props.agendaItemTemplateID && editPK) {
        await dispatch(updateTaskTemplate({ ...taskTemplate, pk: editPK }))
      } else if (editPK) {
        await dispatch(updateTaskTemplate({ ...taskTemplate, pk: editPK }))
      } else {
        // Default case: Not editing, we create a new custom task template for counselor
        const newTaskTemplate = await dispatch(createTaskTemplate(taskTemplate))
        if (props.agendaItemTemplateID) {
          const preMeetingTaskTemplateIDs = agendaItemTemplate?.pre_meeting_task_templates || []
          await dispatch(
            updateAgendaItemTemplate(props.agendaItemTemplateID, {
              pre_meeting_task_templates: [...preMeetingTaskTemplateIDs, newTaskTemplate.pk],
            }),
          )
        }
      }
      form.resetFields()
      setDescription('')
      dispatch(closeModal())
    } catch {
      message.warn('Failed to save task template')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      visible={visible}
      className={styles.taskTemplateModal}
      title={editTaskTemplate ? `Edit ${editTaskTemplate.title}` : 'Create Task Template'}
      okText={editPK ? 'Update' : 'Create'}
      onOk={onSubmit}
      okButtonProps={{ loading: saving }}
      onCancel={() => dispatch(closeModal())}
    >
      <Form form={form} layout="vertical">
        <WrappedTextInput name="title" label="Title" rules={[{ required: true }]} />
        <RichTextEditor value={description} onChange={setDescription} placeholder="Task description..." />
        <Form.Item name="resources" label="Resources">
          <Select
            mode="tags"
            allowClear
            optionFilterProp="label"
            options={resources.map(r => ({ label: r.title, value: r.pk }))}
          />
        </Form.Item>

        <div className="radio-container flex">
          <label>
            Text Submission&nbsp;
            <Tooltip title="Whether or not students should submit text when completing this task">
              <QuestionCircleOutlined />
            </Tooltip>
          </label>
          <Radio.Group onChange={e => setContentSubmissionOption(e.target.value)} value={contentSubmissionOption}>
            <Radio value={SubmissionOptions.NotAllowed}>Not Allowed</Radio>
            <Radio value={SubmissionOptions.Allowed}>Optional</Radio>
            <Radio value={SubmissionOptions.Required}>Required</Radio>
          </Radio.Group>
        </div>
        <div className="radio-container flex">
          <label>
            File Submission&nbsp;
            <Tooltip title="Whether or not students should submit file(s) when completing this task">
              <QuestionCircleOutlined />
            </Tooltip>
          </label>
          <Radio.Group onChange={e => setFileSubmissionOption(e.target.value)} value={fileSubmissionOption}>
            <Radio value={SubmissionOptions.NotAllowed}>Not Allowed</Radio>
            <Radio value={SubmissionOptions.Allowed}>Optional</Radio>
            <Radio value={SubmissionOptions.Required}>Required</Radio>
          </Radio.Group>
        </div>
        <hr />
        {editPK && (
          <div className="update-tasks-container">
            <WrappedSwitch label="Update existing tasks" name="update_tasks" />
          </div>
        )}
      </Form>
    </Modal>
  )
}
export default TaskTemplateModal
