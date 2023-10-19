// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { DatePicker, Form } from 'antd'
import { PickerProps } from 'antd/lib/date-picker/generatePicker'
import { lowerCase } from 'lodash'
import { Moment } from 'moment'
import React from 'react'

type Props = {
  name: string
  isRequired?: boolean
  label?: string
  wrapperCN?: string
} & PickerProps<Moment>

export const WrappedDatePicker = ({
  name,
  label,
  isRequired = true,
  wrapperCN,
  format = 'MMM Do YYYY',
  ...fieldProps
}: Props) => {
  return (
    <div className={wrapperCN}>
      <Form.Item
        name={name}
        label={label}
        rules={[{ required: isRequired, message: `Please select ${lowerCase(name)}` }]}
      >
        <DatePicker format={format} allowClear={false} {...fieldProps} />
      </Form.Item>
    </div>
  )
}
