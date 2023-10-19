// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Form, TimePicker } from 'antd'
import { FormInstance } from 'antd/lib/form'
import { TimePickerProps } from 'antd/lib/time-picker'
import { lowerCase } from 'lodash'
import React from 'react'

type Props = {
  name: string
  isRequired?: boolean
  label?: string
  wrapperCN?: string
  form?: FormInstance
} & TimePickerProps

/**
 * Reusable TimePicker form item
 * @param name Item name
 */
export const WrappedTimePicker = ({
  name,
  label,
  wrapperCN,
  form,
  isRequired = true,
  minuteStep = 15,
  format = 'h:mm a',
  ...fieldProps
}: Props) => {
  return (
    <div className={wrapperCN}>
      <Form.Item
        name={name}
        label={label}
        rules={[{ required: isRequired, message: `Please select ${lowerCase(name)}` }]}
      >
        <TimePicker
          use12Hours
          inputReadOnly
          format={format}
          minuteStep={minuteStep}
          onSelect={value => {
            if (form && value) {
              form.setFieldsValue({ [name]: value })
            }
            if (fieldProps.onChange) {
              fieldProps.onChange(value, value.toISOString())
            }
          }}
          {...fieldProps}
        />
      </Form.Item>
    </div>
  )
}
