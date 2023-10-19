// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Form, Select } from 'antd'
import { SelectProps } from 'antd/lib/select'
import { getFullName } from 'components/administrator'
import styles from 'components/common/styles/FormItems.scss'
import { lowerCase } from 'lodash'
import React, { useState } from 'react'

type Entity = {
  pk: number
  slug: string
  first_name: string
  last_name: string
}

type Props = {
  name: string
  entities: Entity[]
  label?: string
  wrapperCN?: string
  isRequired?: boolean
  placeholder?: string
  extra?: string
} & SelectProps<any>

/**
 * Reusable select person form item
 * @param name Item name
 * @param entities Item array to appear in Select
 */
export const WrappedPersonSelect = ({
  name,
  label,
  entities,
  placeholder,
  wrapperCN = styles.wrapperPersonSelect,
  isRequired = true,
  extra,
  ...fieldProps
}: Props) => {
  return (
    <div className={wrapperCN}>
      <Form.Item
        name={name}
        label={label}
        rules={[{ required: isRequired, message: `Please select a ${lowerCase(name)}` }]}
        extra={extra}
      >
        <Select
          showSearch
          filterOption
          className="select ant-select"
          placeholder={placeholder || `Select a ${lowerCase(name)}`}
          optionFilterProp="children"
          {...fieldProps}
        >
          {entities.map(entity => (
            <Select.Option key={entity.slug} value={entity.pk}>
              {getFullName(entity)}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
    </div>
  )
}
