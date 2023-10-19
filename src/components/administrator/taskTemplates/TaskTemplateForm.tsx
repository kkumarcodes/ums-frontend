// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { handleError, handleSuccess } from 'components/administrator'
import { selectCounselorMeetingTemplate, selectRoadmaps } from 'store/counseling/counselingSelectors'
import { createCounselorMeetingTemplate, updateCounselorMeetingTemplate } from 'store/counseling/counselingThunks'
import { useReduxDispatch } from 'store/store'
import { Store } from 'antd/lib/form/interface'
import { Checkbox, Col, Form, Row, Select } from 'antd'
import { WrappedFormControl, WrappedTextInput } from 'components/common/FormItems'
import { closeModal } from 'store/display/displaySlice'
import styles from './styles/CounselorMeetingTemplateExpandedRow.scss'

// eslint-disable-line react-hooks/exhaustive-deps

type Props = {
  meetingTemplateID?: number
}

export const TaskTemplateForm = ({ meetingTemplateID }: Props) => {
  const [form] = Form.useForm()
  const { setFieldsValue } = form
  const dispatch = useReduxDispatch()
  const counselorMeetings = useSelector(selectCounselorMeetingTemplate(meetingTemplateID))
  const roadmaps = useSelector(selectRoadmaps)

  const [loading, setLoading] = useState(false)
  const { Option } = Select

  const handleFinish = (values: Store) => {
    const addEditCounselorMeetings = values
    setLoading(true)
    dispatch(
      counselorMeetings
        ? updateCounselorMeetingTemplate(counselorMeetings.pk, addEditCounselorMeetings)
        : createCounselorMeetingTemplate(addEditCounselorMeetings),
    )
      .then(() => {
        handleSuccess(counselorMeetings ? 'Update successful!' : 'Counselor Meeting Template Created')
        dispatch(closeModal())
      })
      .catch(() => handleError(counselorMeetings ? 'Could not update' : 'Could not create'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (meetingTemplateID) {
      setFieldsValue({
        title: counselorMeetings?.title,
        roadmap: counselorMeetings?.roadmap,
        grade: counselorMeetings?.grade,
        semester: counselorMeetings?.semester,
        create_when_applying_roadmap: counselorMeetings?.create_when_applying_roadmap,
      })
    }
  }, [meetingTemplateID, setFieldsValue])

  return (
    <>
      <Form layout="vertical" form={form} onFinish={handleFinish}>
        <WrappedTextInput name="title" label="Title" rules={[{ required: true }]} />
        <div className="roadmapRow">
          <p>Roadmap: </p>
          <Form.Item name="roadmap">
            <Select defaultValue={counselorMeetings?.roadmap}>
              {roadmaps.map(roadmap => {
                return <Option key={roadmap.slug} value={roadmap.pk}>{roadmap?.title}</Option>
              })}
            </Select>
          </Form.Item>
        </div>
        <Row gutter={30}>
          <Col span={7}>
            <WrappedTextInput name="grade" label="Grade" />
          </Col>
          <Col span={7}>
            <WrappedTextInput name="semester" label="Semester" />
          </Col>
          <Col className={styles.checkboxCol} span={10}>
            <Form.Item className="checkbox-form-item" name="create_when_applying_roadmap" valuePropName="checked">
              <Checkbox /> Create with Roadmap?
            </Form.Item>
          </Col>
        </Row>
        <WrappedFormControl wrapperCN="right-buttons-container" loading={loading} />
      </Form>
    </>
  )
}
