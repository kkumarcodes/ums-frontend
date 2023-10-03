// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { handleError, handleSuccess } from 'components/administrator'
import { selectAgendaItemTemplate, selectCounselorMeetingTemplate } from 'store/counseling/counselingSelectors'
import {
  fetchCounselorMeetingTemplates,
  fetchAgendaItemTemplates,
  createAgendaItemTemplate,
  updateAgendaItemTemplate,
} from 'store/counseling/counselingThunks'
import { useReduxDispatch } from 'store/store'
import { Store } from 'antd/lib/form/interface'
import { Form, Input } from 'antd'
import { WrappedFormControl, WrappedTextInput } from 'components/common/FormItems'
import { closeModal } from 'store/display/displaySlice'
import styles from './styles/AgendaItemTemplate.scss'

const { TextArea } = Input

type Props = {
  meetingTemplateID: number
  agendaItemTemplateID?: number
}

/**Form Component that gets called on AgendaItemTemplateModal */

export const AgendaItemTemplateForm = ({ meetingTemplateID, agendaItemTemplateID }: Props) => {
  const [form] = Form.useForm()
  const { setFieldsValue } = form
  const dispatch = useReduxDispatch()
  const counselorMeetings = useSelector(selectCounselorMeetingTemplate(meetingTemplateID))
  const agendaItemTemplate = useSelector(selectAgendaItemTemplate(agendaItemTemplateID))

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      dispatch(fetchCounselorMeetingTemplates()),
      dispatch(fetchAgendaItemTemplates({ counselor_meeting_template: meetingTemplateID })),
    ]).finally(() => setLoading(false))
  }, [dispatch, meetingTemplateID])

  /** Sends either a POST or PATCH call to the AIT endpoint. Shows user a pop up alert on completion.   */
  const handleFinish = (values: Store) => {
    const addEditAgendaItems = { ...values }
    if (!agendaItemTemplate) {
      addEditAgendaItems.counselor_meeting_template = meetingTemplateID
    }
    setLoading(true)
    dispatch(
      agendaItemTemplate
        ? updateAgendaItemTemplate(agendaItemTemplate.pk, addEditAgendaItems)
        : createAgendaItemTemplate(addEditAgendaItems),
    )
      .then(() => {
        handleSuccess(agendaItemTemplate ? 'Update successful!' : 'Agenda Item Template Created')
        dispatch(closeModal())
      })
      .catch(() => handleError(agendaItemTemplate ? 'Could not update' : 'Could not create'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (agendaItemTemplateID) {
      setFieldsValue({
        counselor_title: agendaItemTemplate?.counselor_title,
        student_title: agendaItemTemplate?.student_title,
        counselor_instructions: agendaItemTemplate?.counselor_instructions,
      })
    }
    // eslint-disable-line react-hooks/exhaustive-deps
  }, [agendaItemTemplateID, setFieldsValue])

  return (
    <div>
      <div className={styles.cmtHeader}>
        <div className="f-subtitle-1">Counselor Meeting Template: {counselorMeetings?.title}</div>
      </div>
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <WrappedTextInput name="counselor_title" label="Counselor Title" rules={[{ required: true }]} />
        <WrappedTextInput name="student_title" label="Student Title" />
        <div className={styles.counselorInstructions}>Counselor Instructions:</div>
        <div className="instruction-text-box">
          <Form.Item name="counselor_instructions">
            <TextArea rows={4} />
          </Form.Item>
        </div>
        <WrappedFormControl wrapperCN="right-buttons-container" loading={loading} />
      </Form>
    </div>
  )
}
