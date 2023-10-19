// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Form, Input } from 'antd'
import { Rule } from 'antd/lib/form'
import { InputProps, TextAreaProps } from 'antd/lib/input'
import styles from 'components/common/styles/FormItems.scss'
import { lowerCase, upperFirst } from 'lodash'
import React, { ReactNode } from 'react'

type Props = {
  name: string
  label?: ReactNode
  rules?: Rule[]
  placeholder?: string
  initialValue?: string
  wrapperCN?: string
  isRequired?: boolean
  noWhitespace?: boolean
  validateOnBlur?: boolean
  isTextArea?: boolean
} & InputProps &
  TextAreaProps

/**
 * Reusable Input (text) form item
 */
export const WrappedTextInput = ({
  name,
  label,
  placeholder,
  wrapperCN = styles.wrapperTextInput,
  isRequired = false,
  noWhitespace = true,
  validateOnBlur = false,
  isTextArea = false,
  rules = [],
  ...fieldProps
}: Props) => {
  if (isTextArea) {
    return (
      <div className={wrapperCN}>
        <Form.Item
          name={name}
          label={label}
          required={false}
          rules={[
            // { required: isRequired, message: `Please input ${lowerCase(name)}`, whitespace: noWhitespace },
            ...rules,
          ]}
          validateTrigger={validateOnBlur ? 'onBlur' : 'onChange'}
        >
          <Input.TextArea required={false} placeholder={placeholder || upperFirst(lowerCase(name))} {...fieldProps} />
        </Form.Item>
      </div>
    )
  }

  return (
    <div className={wrapperCN}>
      <Form.Item
        name={name}
        label={label}
        rules={[
          // { required: isRequired, message: `Please input ${lowerCase(name)}`, whitespace: noWhitespace },
          ...rules,
        ]}
        validateTrigger={validateOnBlur ? 'onBlur' : 'onChange'}
      >
        <Input placeholder={placeholder || upperFirst(lowerCase(name))} {...fieldProps} />
      </Form.Item>
    </div>
  )
}
