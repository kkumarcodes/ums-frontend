// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { FileAddOutlined, GoogleOutlined, LinkOutlined } from '@ant-design/icons'
import { Button, Input, Row, Space, Tag, Upload, Col } from 'antd'
import { UploadChangeParam } from 'antd/lib/upload'
import { UploadFile } from 'antd/lib/upload/interface'
import React, { useEffect, useState } from 'react'
import API from 'store/api'
import { FileUpload } from 'store/common/commonTypes'
import styles from './styles/MultiFileUpload.scss'

const UPLOAD_ACTION = '/cw/upload/'

type Props = {
  value: FileUpload[]
  onChange: (fileUploads: FileUpload[]) => void
  // We call this method when a file upload that was in fileUploads gets removed
  // onRemove?: (removedUpload: FileUpload) => void
  allowRemove?: boolean
  mode?: MultiFileUploadMode
  // Props that flow through to Upload component
  action?: string
  data?: object // Additional data to pass to upload endpoint
  disabled?: boolean
  maxFiles?: number // OK so MULTI file upload may be a bit of a misnomer. This can be 1
  allowLink?: boolean // Whether or not links (i.e. to Google Doc) can be attached
}

export enum MultiFileUploadMode {
  Dropzone = 'dropzone',
  Button = 'button',
}

const MultiFileUpload = ({
  value,
  onChange,
  data = {},
  allowRemove = true,
  action = UPLOAD_ACTION,
  disabled = false,
  mode = MultiFileUploadMode.Dropzone,
  maxFiles,
  allowLink = true,
}: Props) => {
  const [link, setLink] = useState({ name: '', url: '' })
  const [errorMessage, setErrorMessage] = useState('')

  // Clears error message
  useEffect(() => {
    if (link.name && link.url) {
      setErrorMessage('')
    }
  }, [link.name, link.url])
  // We wrap our on change so that we can call onChange arg with a fileUpload object
  const innerOnFileChange = (info: UploadChangeParam<UploadFile<any>>) => {
    const newFileUpload = info.file.response as FileUpload
    if (newFileUpload?.slug) {
      onChange([...value, newFileUpload])
    }
  }
  // Same purpose as innerOnFileChange, but for file upload links
  const onAddLink = () => {
    if (!link.name || !link.url) {
      setErrorMessage('Please include the document title and link')
      return
    }
    API.post('/cw/upload/', { link }).then(({ data: newFileUpload }) => {
      if (newFileUpload?.slug) {
        onChange([...value, newFileUpload])
      }
    })
  }
  // A file upload is removed from value
  const innerRemove = (url: string) => {
    onChange(value.filter(v => url !== v.url))
  }

  const isDisabled = disabled || (typeof maxFiles !== 'undefined' && value.length >= maxFiles)

  return (
    <div className={`${styles.multiFileUpload} mode-${mode} multi-file-upload`}>
      <Upload
        name="file"
        action={action}
        data={data}
        showUploadList={false}
        disabled={isDisabled}
        onChange={innerOnFileChange}
      >
        {mode === MultiFileUploadMode.Dropzone && (
          <div className="file-upload-target">Drag and drop files to upload here, or click to select files ...</div>
        )}
        {mode === MultiFileUploadMode.Button && (
          <Button size="small" disabled={isDisabled}>
            <FileAddOutlined />
            Attach File(s)...
          </Button>
        )}
      </Upload>
      {value.filter(v => !v.link).length > 0 && (
        <>
          <div className="files-list">
            <label>Attached Files:</label>
            {value
              .filter(v => !v.link)
              .map((v, i) => (
                <Tag key={v.slug} closable={allowRemove} onClose={() => innerRemove(v.url)}>
                  {v.title}
                </Tag>
              ))}
          </div>
        </>
      )}
      {allowLink && (
        <div className="attach-link">
          <br />
          <br />
          <h3 className="center">Add a Google Doc Link Below</h3>
          <br />
          <Space className="multi-link-upload" direction="vertical" size="middle">
            <Row align="middle">
              <Col span={4}>
                <Row justify="end">
                  <label>File name:</label>
                </Row>
              </Col>
              <Col span={19} offset={1}>
                <Input
                  addonBefore={<GoogleOutlined />}
                  placeholder="My Document Name"
                  onChange={e => {
                    e.persist()
                    setLink(prev => ({ ...prev, name: e.target.value }))
                  }}
                />
              </Col>
            </Row>
            <Row align="middle">
              <Col span={4}>
                <Row justify="end">
                  <label>Document link:</label>
                </Row>
              </Col>
              <Col span={19} offset={1}>
                <Input
                  addonBefore={<LinkOutlined />}
                  placeholder="Paste a link here"
                  onChange={e => {
                    e.persist()
                    setLink(prev => ({ ...prev, url: e.target.value }))
                  }}
                />
              </Col>
            </Row>
            <Row align="middle" justify="space-between">
              <Col span={10} offset={8}>
                <div className="red">{errorMessage}</div>
              </Col>
              <Button onClick={onAddLink} type="primary" size="small">
                Add Link
              </Button>
            </Row>
            {value.filter(v => v.link).length > 0 && (
              <div className="files-list">
                <label>Attached Links:</label>
                {value
                  .filter(v => v.link)
                  .map((v, i) => (
                    <Tag key={v.slug} closable={allowRemove} onClose={() => innerRemove(v.url)}>
                      {v.title}
                    </Tag>
                  ))}
              </div>
            )}
          </Space>
        </div>
      )}
    </div>
  )
}
export default MultiFileUpload
