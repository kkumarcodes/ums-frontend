// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { QuestionCircleOutlined } from '@ant-design/icons'
import { Form, Select, Tooltip } from 'antd'
import { SelectProps } from 'antd/lib/select'
import styles from 'components/common/styles/FormItems.scss'
import { lowerCase } from 'lodash'
import React, { ReactNode } from 'react'

type Entity = {
  pk: number
  slug?: string
}

type Props = {
  name: string
  entities: Entity[]
  propToDisplay: string
  label?: string
  wrapperCN?: string
  isRequired?: boolean
  placeholder?: string
  extra?: ReactNode
  tooltip?: string
} & SelectProps<any>

/**
 * Reusable select form item
 * @param name Item name
 * @param entities Item array to appear in Select
 * @param propToDisplay Entity property to display in Select dropdown
 */
export const WrappedGenericSelect = ({
  name,
  label,
  entities,
  propToDisplay,
  placeholder,
  wrapperCN = styles.wrapperGenericSelect,
  isRequired = true,
  extra,
  tooltip = '',
  ...fieldProps
}: Props) => {
  const labelElt = (
    <span>
      {label}
      {tooltip && (
        <>
          &nbsp;
          <Tooltip title={tooltip}>
            <QuestionCircleOutlined />
          </Tooltip>
        </>
      )}
    </span>
  )
  return (
    <div className={wrapperCN}>
      <Form.Item
        name={name}
        label={labelElt}
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
          {/* TODO: Improve type safety 🤷‍♂️ */}
          {entities.map(entity => (
            <Select.Option key={entity.pk} value={entity.pk}>
              {entity[propToDisplay]}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
    </div>
  )
}
