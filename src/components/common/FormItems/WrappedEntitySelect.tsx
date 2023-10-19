// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Form, Select } from 'antd'
import { SelectProps } from 'antd/lib/select'
import styles from 'components/common/styles/FormItems.scss'
import { lowerCase } from 'lodash'
import React from 'react'

type Entity = string | number

type Props = {
  name: string
  entities: Entity[]
  label?: string
  wrapperCN?: string
  isRequired?: boolean
  extra?: string
  placeholder?: string
} & SelectProps<any>

/**
 * Reusable select form item
 * @param name Item name
 * @param entities string or number array to appear in Select
 */
export const WrappedEntitySelect = ({
  name,
  label,
  entities,
  placeholder,
  wrapperCN = styles.wrapperGenericSelect,
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
          placeholder={placeholder || `Select a ${lowerCase(name)}`}
          optionFilterProp="children"
          filterOption
          {...fieldProps}
        >
          {entities.map(entity => (
            <Select.Option key={entity} value={entity}>
              {entity}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
    </div>
  )
}
