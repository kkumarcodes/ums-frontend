// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React from 'react'
import styles from 'components/common/styles/FormItems.scss'
import { Form, Checkbox } from 'antd'
import { CheckboxProps } from 'antd/lib/checkbox'

type Props = {
  name: string
  label: string
  wrapperCN?: string
} & CheckboxProps

/**
 * Reusable Checkbox form item
 */
export const WrappedCheckbox = ({ name, label, wrapperCN = styles.wrapperCheckbox, ...fieldProps }: Props) => {
  return (
    <div className={wrapperCN}>
      <Form.Item initialValue={fieldProps.defaultChecked} name={name}>
        <Checkbox {...fieldProps}>{label}</Checkbox>
      </Form.Item>
    </div>
  )
}
