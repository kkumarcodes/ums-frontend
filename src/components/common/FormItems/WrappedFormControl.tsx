// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Button, Form } from 'antd'
import styles from 'components/common/styles/FormItems.scss'
import React from 'react'
import { closeModal } from 'store/display/displaySlice'
import { useReduxDispatch } from 'store/store'

type Props = {
  wrapperCN?: string
  loading?: boolean
  cancelText?: string
  okText?: string
  onCancel?: () => void
  onSubmit?: () => void
  disabled?: boolean
}

/**
 * Reusable form control buttons
 */
export const WrappedFormControl = ({
  loading,
  onCancel,
  onSubmit,
  wrapperCN = styles.wrapperFormControl,
  disabled,
  cancelText = 'Cancel',
  okText = 'Submit',
}: Props) => {
  const dispatch = useReduxDispatch()

  let handleCancel: () => void

  if (!onCancel) {
    handleCancel = () => dispatch(closeModal())
  } else {
    handleCancel = onCancel
  }

  return (
    <div className={wrapperCN}>
      <Form.Item>
        <Button className="buttonCancel" onClick={handleCancel}>
          {cancelText}
        </Button>
        <Button
          className="buttonSubmit"
          type="primary"
          htmlType="submit"
          loading={loading}
          disabled={disabled}
          onClick={onSubmit}
        >
          {okText}
        </Button>
      </Form.Item>
    </div>
  )
}
