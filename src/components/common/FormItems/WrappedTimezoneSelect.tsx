// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React, { ReactNode } from 'react'
import { Select, Form } from 'antd'
import { COMMON_TIMEZONES, ALL_TIMEZONES, INTERNATIONAL_TIMEZONES } from 'store/common/commonTypes'
import { SelectProps } from 'antd/lib/select'
import { Rule } from 'antd/lib/form'

const COMMON_TIMEZONE_LABELS = {
  'America/New_York': 'East (New York)',
  'America/Chicago': 'Central (Chicago)',
  'America/Denver': 'Mountain (Denver)',
  'America/Los_Angeles': 'West (Los Angeles)',
}

type Prop = {
  name: string
  extra?: string
  label?: ReactNode
  isRequired?: boolean
  isFormItem?: boolean
  wrapperCN?: string
  rules?: Rule[]
} & SelectProps<any>
/**
 * Reusable Timezone Select form item
 * @param name Form item name
 * @param extra Form item extra
 * @param isFormItem Whether or not to even render this select as a form item or as a standalone select
 * @param label Form item label
 * @param wrapperCN className of wrapping div
 */
export const WrappedTimezoneSelect = ({
  name,
  label,
  extra,
  isRequired = false,
  isFormItem = true,
  rules = [],
  wrapperCN,
  ...fieldProps
}: Prop) => {
  const select = (
    <Select {...fieldProps} showSearch={true} optionFilterProp="children">
      <Select.OptGroup label="Common">
        {COMMON_TIMEZONES.map(t => (
          <Select.Option key={t} value={t}>
            {COMMON_TIMEZONE_LABELS[t]}
          </Select.Option>
        ))}
      </Select.OptGroup>
      <Select.OptGroup label="All">
        {ALL_TIMEZONES.map(t => (
          <Select.Option key={t} value={t}>
            {t}
          </Select.Option>
        ))}
      </Select.OptGroup>
      <Select.OptGroup label="All">
        {INTERNATIONAL_TIMEZONES.map(t => (
          <Select.Option key={t} value={t}>
            {t}
          </Select.Option>
        ))}
      </Select.OptGroup>
    </Select>
  )
  if (!isFormItem) return select
  return (
    <div className={wrapperCN}>
      <Form.Item label={label} name={name} extra={extra} rules={[{ required: isRequired }, ...rules]}>
        {select}
      </Form.Item>
    </div>
  )
}
