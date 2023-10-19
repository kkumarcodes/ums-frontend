// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { DatePicker, Form } from 'antd'
import { RangePickerProps } from 'antd/lib/date-picker'
import styles from 'components/common/styles/FormItems.scss'
import React from 'react'

const dateFormat = 'MMM Do'

type Props = {
  name: string
  label?: string
  wrapperCN?: string
  inputReadOnly?: boolean
} & RangePickerProps

/**
 * Reusable RangePicker form item (localized to Monday as start of week)
 * @param name Item name
 */
export const WrappedRangePicker = ({
  name,
  label,
  wrapperCN = styles.wrapperRangePicker,
  inputReadOnly = true,
  ...fieldProps
}: Props) => (
  <div className={wrapperCN}>
    <Form.Item name={name} label={label} rules={[{ type: 'array', required: true, message: 'Selection required' }]}>
      <DatePicker.RangePicker className="rangePicker" format={dateFormat} inputReadOnly={true} {...fieldProps} />
    </Form.Item>
  </div>
)
