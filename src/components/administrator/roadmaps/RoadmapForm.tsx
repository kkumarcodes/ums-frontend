// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { handleError, handleSuccess } from 'components/administrator'
import { selectRoadmap } from 'store/counseling/counselingSelectors'
import { createRoadmap, updateRoadmap } from 'store/counseling/counselingThunks'
import { useReduxDispatch } from 'store/store'
import { Store } from 'antd/lib/form/interface'
import { Checkbox, Col, Form, Row, Space } from 'antd'
import { WrappedFormControl, WrappedTextInput } from 'components/common/FormItems'
import { closeModal } from 'store/display/displaySlice'

// eslint-disable-line react-hooks/exhaustive-deps

type Props = {
  roadmapID?: number
}

export const RoadmapForm = ({ roadmapID }: Props) => {
  const [form] = Form.useForm()
  const { setFieldsValue } = form
  const dispatch = useReduxDispatch()
  const roadmap = useSelector(selectRoadmap(roadmapID))

  const [loading, setLoading] = useState(false)

  const handleFinish = (values: Store) => {
    const addEditRoadmap = values
    setLoading(true)
    dispatch(roadmap ? updateRoadmap(roadmap.pk, addEditRoadmap) : createRoadmap(addEditRoadmap))
      .then(() => {
        handleSuccess(roadmap ? 'Update successful!' : 'Roadmap Created')
        dispatch(closeModal())
      })
      .catch(() => handleError(roadmap ? 'Could not update' : 'Could not create'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (roadmapID) {
      setFieldsValue({
        title: roadmap?.title,
        description: roadmap?.description,
        active: roadmap?.active,
        repeatable: roadmap?.repeatable,
      })
    }
  }, [roadmapID, setFieldsValue])

  return (
    <>
      <Form layout="vertical" form={form} onFinish={handleFinish}>
        <WrappedTextInput name="title" label="Title" rules={[{ required: true }]} />
        <WrappedTextInput name="description" label="Description" />
        <Row>
          <Col span={6}>
            <Form.Item name="active" valuePropName="checked">
              <Checkbox>Active</Checkbox>
            </Form.Item>
          </Col>
          <Col span={18}>
            <Form.Item name="repeatable" valuePropName="checked">
              <Checkbox>Repeatable</Checkbox>
            </Form.Item>
          </Col>
        </Row>
        <WrappedFormControl wrapperCN="right-buttons-container" loading={loading} />
      </Form>
    </>
  )
}
