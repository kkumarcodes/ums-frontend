// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { LinkOutlined } from '@ant-design/icons'
import { Button, Input, message, Popover } from 'antd'
import React, { useRef } from 'react'
import { useSelector } from 'react-redux'
import { selectIsCounselor } from 'store/user/usersSelector'
import styles from './styles/ScheduleMeetingPopover.scss'

// Yup - it's just a link to UMS with a query param to schedule meeting.
const SCHEDULE_LINK = (id: number) =>
  `${window.location.protocol}//${window.location.host}/?scheduleCounselorMeeting=${id}`

type Props = {
  meetingID: number // ID of counselor meeting
}

const ScheduleMeetingPopover = ({ meetingID }: Props) => {
  const isCounselor = useSelector(selectIsCounselor)
  const copyInput = useRef<Input>()

  // Copy SCHEDULE_LINK to clipboard
  const copyLink = () => {
    if (copyInput.current) {
      copyInput.current.select()
      document.execCommand('copy')
      message.success('Copied link to your clipboard!')
    }
  }

  const content = (
    <div className={styles.scheduleMeetingPopover}>
      <div className="flex">
        <Button type="primary" size="small" onClick={copyLink}>
          <LinkOutlined />
          &nbsp;Copy Link
        </Button>
        <Input ref={copyInput} size="small" readOnly={true} value={SCHEDULE_LINK(meetingID)} />
      </div>

      <p className="help">Students and parents can use this link to schedule this meeting in UMS.</p>
      {isCounselor && (
        <p className="help">
          This link will not work on your counselor account. Click the edit button (pencil icon) to schedule or
          reschedule a meeting.
        </p>
      )}
    </div>
  )

  return (
    <Popover content={content}>
      <Button type="default" size="small" icon={<LinkOutlined />} />
    </Popover>
  )
}
export default ScheduleMeetingPopover
