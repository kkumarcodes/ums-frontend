// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { SaveOutlined } from '@ant-design/icons'
import { Button, DatePicker, Form, InputNumber, Row, Select } from 'antd'
import { handleSuccess } from 'components/administrator'
import { Store } from 'antd/lib/form/interface'
import React from 'react'
import moment from 'moment'
import { useReduxDispatch } from 'store/store'
import { createTimeCardLineItem } from 'store/tutoring/tutoringThunks'
import { TutorTimeCardLineItem } from 'store/tutoring/tutoringTypes'
import { WrappedTextInput } from 'components/common/FormItems'
import { RootState } from 'store/rootReducer'
import { useSelector } from 'react-redux'
import LineItemCategories from './LineItemCategories'

// pk is TimeCardPK
type Props = {
  pk: number
}

/**
 * Component renders a lineItem create form (used by LineItemForm)
 */
export const TimeCardLineItemCreate = ({ pk }: Props) => {
  const dispatch = useReduxDispatch()
  const [form] = Form.useForm()

  const handleCreate = (payload: Partial<TutorTimeCardLineItem>) => {
    dispatch(createTimeCardLineItem(pk, payload)).then(() => {
      handleSuccess('line item created')
      form.resetFields()
    })
  }

  const timeCard = useSelector((state: RootState) => state.tutoring.timeCards[pk])
  const start = moment(timeCard.start).startOf('d')
  const end = moment(timeCard.end).endOf('d')

  const handleFinish = (values: Store) => {
    const data = {
      date: values.date.hours(0).minutes(0),
      hours: values.hours,
      category: values.category,
      title: values.title,
      time_card: pk,
    }
    if (LineItemCategories[values.category]) {
      data.hourly_rate = LineItemCategories[values.category]
    }
    handleCreate(data)
  }

  return (
    <div className="containerLineItemCreateForm">
      <Form className="formCreateLineItem" form={form} onFinish={handleFinish} layout="horizontal">
        <Row className="wrapperDateStart">
          <Form.Item name="date" label="Date" rules={[{ required: true }]}>
            <DatePicker
              disabledDate={d => !d.isBetween(start, end)}
              className="item itemDate"
              placeholder="Select date"
              format="MMM, Do YYYY"
            />
          </Form.Item>
          <Form.Item className="formItemCategory" rules={[{ required: true }]} name="category" label="Category">
            <Select>
              {Object.keys(LineItemCategories).map(k => (
                <Select.Option value={k} key={k}>
                  {k}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Row>
        <Row className="wrapperTitleHours">
          <WrappedTextInput
            name="title"
            label="Title"
            isRequired={true}
            placeholder="Enter line item title"
            className="item itemTitle"
            wrapperCN="ant-form-item"
          />
          <Form.Item name="hours" label="Hours" rules={[{ required: true }]}>
            <InputNumber precision={2} className="item itemHours" placeholder="Enter hours" />
          </Form.Item>
        </Row>
        <Row className="wrapperButton">
          <Button htmlType="submit" type="ghost">
            <SaveOutlined />
            CREATE
          </Button>
        </Row>
      </Form>
    </div>
  )
}
