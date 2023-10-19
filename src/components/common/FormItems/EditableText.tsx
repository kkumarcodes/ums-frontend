// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Form, Input, Button } from 'antd'
import { Rule } from 'antd/lib/form'
import { TextAreaProps } from 'antd/lib/input'
import styles from 'components/common/styles/FormItems.scss'
import { lowerCase, upperFirst } from 'lodash'
import React, { useState, useEffect } from 'react'
import { EditOutlined, SaveOutlined } from '@ant-design/icons'

type Props = {
  name: string
  label?: string
  rules?: Rule[]
  loading?: boolean
  placeholder?: string
  wrapperCN?: string
  noWhitespace?: boolean
  validateOnBlur?: boolean
  isTextArea?: false
  isFormItem?: boolean
  onUpdate: (val: string) => void // Just making this required, overriding InputProp version
} & TextAreaProps

export const EditableText = ({
  name,
  label,
  placeholder,
  onUpdate,
  wrapperCN = styles.wrapperTextInput,
  noWhitespace = true,
  validateOnBlur = false,
  isTextArea = false,
  isFormItem = true,
  loading = false,
  rules = [],
  readOnly = false,
  ...fieldProps
}: Props) => {
  const [editing, setEditing] = useState(false)
  // We keep track of our own state, in case this is not a controlled component. But in case it is, we tie our
  // local state to fieldProps.state
  const [innerValue, setInnerValue] = useState(fieldProps.value as string)

  useEffect(() => {
    setInnerValue(fieldProps.value as string)
  }, [fieldProps.value])

  const onBlur = () => {
    setEditing(false)
    onUpdate(innerValue)
  }

  const innerOnChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInnerValue(event.target.value)
    if (fieldProps.onChange) {
      fieldProps.onChange(event)
    }
  }

  if (!editing) {
    return (
      <div
        className={`${wrapperCN} editable-text-container ${styles.editableText}`}
        onClick={() => setEditing(!readOnly)}
      >
        {!fieldProps.value && placeholder && <span className="placeholder">{placeholder}</span>}
        {fieldProps.value}&nbsp;
        {!readOnly && (
          <Button type="link" loading={loading}>
            <EditOutlined />
          </Button>
        )}
      </div>
    )
  }

  const textArea = (
    <Input.TextArea
      placeholder={placeholder || upperFirst(lowerCase(name))}
      {...fieldProps}
      onChange={innerOnChange}
      value={innerValue}
    />
  )

  const button = (
    <Button type="primary" loading={loading} onClick={onBlur}>
      Save <SaveOutlined />
    </Button>
  )

  if (isFormItem) {
    return (
      <div className={`${wrapperCN} editable-text-container`}>
        <Form.Item
          name={name}
          label={label}
          rules={rules}
          validateTrigger={validateOnBlur ? 'onBlur' : 'onChange'}
          extra={!readOnly && button}
        >
          {textArea}
        </Form.Item>
      </div>
    )
  }

  // Return non form item textarea
  return (
    <div className={`${wrapperCN} editable-text-container non-form-item ${styles.editableText}`}>
      <div className="non-form-item">
        {textArea} {!readOnly && button}
      </div>
    </div>
  )
}
