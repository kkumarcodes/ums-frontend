// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React from 'react'
import { FileDoneOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { each } from 'lodash'
import { CSVDataTypes } from './enums'

type Props = {
  dataType: CSVDataTypes
  // These query params will get passed as part of request
  queryParams?: { [key: any]: string }
  title?: string
}

const DownloadCSVButton = (props: Props) => {
  let url = `${props.dataType}?format=csv`
  if (props.queryParams) {
    each(props.queryParams, (val, key) => {
      url += `&${key}=${val}`
    })
  }

  return (
    <Button type="primary" target="_blank" href={url}>
      <FileDoneOutlined />
      {props.title ?? 'Download CSV'}
    </Button>
  )
}

export default DownloadCSVButton
