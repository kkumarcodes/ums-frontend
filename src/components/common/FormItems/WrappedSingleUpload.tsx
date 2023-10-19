// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { UploadOutlined } from '@ant-design/icons'
import { Button, Form, Upload } from 'antd'
import { Store } from 'antd/lib/form/interface'
import styles from 'components/common/styles/FormItems.scss'
import React from 'react'
import { RcFile, UploadChangeParam } from 'antd/lib/upload'
import { UploadFile } from 'antd/lib/upload/interface'

type Props = {
  action: string
  name: string
  setFieldsValue: (value: Store) => void
  label?: string
  wrapperCN?: string
  isRequired?: boolean
  setDisabled?: React.Dispatch<React.SetStateAction<boolean>>
}

/**
 *  Reusable Single Upload component (only most recently uploaded file will be uploaded)
 * @param name form item name prop
 * @param action file upload endpoint
 * @param setFieldsValue method from form controller instance (used to programatically assign values.name field)
 */
export const WrappedSingleUpload = ({
  name,
  action,
  setFieldsValue,
  label,
  setDisabled,
  wrapperCN = styles.wrapperSingleUpload,
  isRequired = false,
  ...fieldProps
}: Props) => {
  const uploadProps = {
    action,
    showUploadList: {
      showDownloadIcon: false,
    },
  }

  // Intercept default form upload behavior, so that only most recently selected file is uploaded
  const beforeUpload = (file: RcFile, fileList: RcFile[]) => {
    if (fileList.length) {
      setFieldsValue({ [name]: [file] })
    }
    return true
  }

  // Reset
  const onRemove = () => {
    setFieldsValue({ [name]: [] })
  }

  // I'm not 100% sure why this works
  // I got it from the docs.
  // It seems essential when using a Form managed Upload component
  const normFile = (e: any) => {
    // When will this be true? Seems to always be false
    if (Array.isArray(e)) {
      return e
    }
    return e && e.fileList
  }

  const handleChange = (info: UploadChangeParam<UploadFile<any>>) => {
    if (setDisabled) {
      if (info.file.status === 'uploading') {
        setDisabled(true)
      }
      if (info.file.status === 'done') {
        setDisabled(false)
      }
    }
  }

  return (
    <div className={wrapperCN}>
      <Form.Item
        name={name}
        label={label}
        getValueFromEvent={normFile}
        valuePropName="fileList"
        required={isRequired}
        rules={[{ required: isRequired, message: `File required` }]}
      >
        <Upload
          {...uploadProps}
          beforeUpload={beforeUpload}
          onRemove={onRemove}
          {...fieldProps}
          onChange={handleChange}
        >
          <Button>
            <UploadOutlined />
            Click to Upload
          </Button>
        </Upload>
      </Form.Item>
    </div>
  )
}
