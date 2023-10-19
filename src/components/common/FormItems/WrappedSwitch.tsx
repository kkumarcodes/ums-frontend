// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Form, Switch } from 'antd'
import { SwitchProps } from 'antd/lib/switch'
import styles from 'components/common/styles/FormItems.scss'
import React from 'react'

type Props = {
  name: string
  label?: string
  wrapperCN?: string
  help?: string
} & SwitchProps

/**
 * Reusable Switch form item
 */
export const WrappedSwitch = ({ name, label, help, wrapperCN = styles.wrapperSwitch, ...fieldProps }: Props) => {
  return (
    <div className={wrapperCN}>
      <Form.Item initialValue={fieldProps.defaultChecked} name={name} label={label} help={help} valuePropName="checked">
        <Switch {...fieldProps} />
      </Form.Item>
    </div>
  )
}
