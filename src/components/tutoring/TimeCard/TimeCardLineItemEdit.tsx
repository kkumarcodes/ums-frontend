// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { SaveOutlined, StopOutlined } from '@ant-design/icons'
import { Button, DatePicker, InputNumber, Row, Form } from 'antd'
import moment from 'moment'
import React from 'react'
import { TutorTimeCardLineItem } from 'store/tutoring/tutoringTypes'
import { closeModal } from 'store/display/displaySlice'
import { useReduxDispatch } from 'store/store'
import { WrappedTextInput, WrappedEntitySelect } from 'components/common/FormItems'
import { RootState } from 'store/rootReducer'
import { useSelector } from 'react-redux'
import LineItemCategories from './LineItemCategories'

// pk is TimeCardPK
type Props = {
  pk: number
  setIsEditing: React.Dispatch<React.SetStateAction<string>>
  handleUpdate: (timeCardLineItemPK: number, payload: Partial<TutorTimeCardLineItem>) => void
  entity: TutorTimeCardLineItem
}

/**
 * Component renders in-line lineItem edit form (used by TimeCardLineItemList)
 * @param setIsEditing Updates current editing slug; empty string if no items being editted
 * @param handleUpdate lineItem update event handler
 * @param entity lineItem being updated
 */
export const TimeCardLineItemEdit = ({ setIsEditing, handleUpdate, entity }: Props) => {
  const dispatch = useReduxDispatch()
  const [form] = Form.useForm()
  const { getFieldValue } = form

  const timeCard = useSelector((state: RootState) => state.tutoring.timeCards[entity.time_card])
  const start = moment(timeCard.start).startOf('d')
  const end = moment(timeCard.end).endOf('d')

  return (
    <Form
      form={form}
      onFinish={() => {
        dispatch(closeModal())
      }}
      className="formWrapper"
      initialValues={{
        date: moment(entity.date),
        hours: entity.hours,
        title: entity.title,
        category: entity.category,
      }}
    >
      <Row className="lineItemDetailsList">
        <Form.Item name="date" rules={[{ required: true }]}>
          <DatePicker
            disabledDate={d => !d.isBetween(start, end)}
            className="item itemDate"
            placeholder="Select date"
            format="MMM, Do YYYY"
          />
        </Form.Item>
        <WrappedTextInput name="title" isRequired={true} placeholder="Enter Title" className="item itemTitle" />
        <WrappedEntitySelect
          wrapperCN="lineItemSelect"
          name="category"
          entities={Object.keys(LineItemCategories)}
          isRequired={true}
        />
        <Form.Item name="hours" rules={[{ required: true }]}>
          <InputNumber precision={2} className="item itemHours" placeholder="Hours" />
        </Form.Item>

        <Row className="item itemActions buttonWrapperActions">
          <Button className="editButton" onClick={() => setIsEditing('')}>
            <StopOutlined />
          </Button>
          <Button
            onClick={() =>
              handleUpdate(entity.pk, {
                date: moment(getFieldValue('date')).hour(0).minutes(0).toISOString(),
                title: getFieldValue('title'),
                hours: getFieldValue('hours'),
                category: getFieldValue('category'),
                hourly_rate: LineItemCategories[getFieldValue('category')],
              })
            }
          >
            <SaveOutlined />
          </Button>
        </Row>
      </Row>
    </Form>
  )
}
