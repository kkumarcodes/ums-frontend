// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React, { useRef } from 'react'
import { selectVisibleGoogleCalInstructionsModal, selectActiveModal } from 'store/display/displaySelectors'
import { Modal, Input, Button, message } from 'antd'
import { useSelector, useDispatch } from 'react-redux'
import { GoogleCalInstructionsModalProps } from 'store/display/displayTypes'
import { LinkOutlined } from '@ant-design/icons'
import { closeModal } from 'store/display/displaySlice'

const GoogleCalInstructionsModal = () => {
  const copyInput = useRef<Input>()
  const visible = useSelector(selectVisibleGoogleCalInstructionsModal)
  const props = useSelector(selectActiveModal)?.modalProps as GoogleCalInstructionsModalProps
  const link = props?.link
  const dispatch = useDispatch()

  const copyLink = () => {
    if (copyInput.current) {
      copyInput.current.select()
      document.execCommand('copy')
      message.success('Copied link to clipboard!')
    }
  }

  return (
    <Modal
      visible={visible}
      title="Add this calendar to Google or Outlook Calendar"
      cancelText=""
      okText="Got it!"
      onOk={() => dispatch(closeModal())}
      onCancel={() => dispatch(closeModal())}
    >
      <ol>
        <li>
          Copy this link:&nbsp;
          <Input
            ref={copyInput}
            addonBefore={
              <Button type="link" size="small" onClick={copyLink}>
                <LinkOutlined /> Copy Link
              </Button>
            }
            readOnly={true}
            value={link}
          />
        </li>
        <li>
          To add to Google Calendar, follow the instructions under <em>Add using a link</em> here:
          <br />
          <a
            href="https://support.google.com/calendar/answer/37100?co=GENIE.Platform%3DDesktop&hl=en"
            rel="noopener noreferrer"
            target="_blank"
          >
            https://support.google.com/calendar/answer/37100?co=GENIE.Platform%3DDesktop&hl=en
          </a>
        </li>
        <li>
          To add to Outlook (Online) Calendar, follow the instructions under <em>Subscribe to a calendar</em> here:
          <br />
          <a
            href="https://support.microsoft.com/en-us/office/import-or-subscribe-to-a-calendar-in-outlook-on-the-web-503ffaf6-7b86-44fe-8dd6-8099d95f38df"
            rel="noopener noreferrer"
            target="_blank"
          >
            https://support.microsoft.com/en-us/office/import-or-subscribe-to-a-calendar-in-outlook-on-the-web-503ffaf6-7b86-44fe-8dd6-8099d95f38df
          </a>
        </li>
      </ol>
    </Modal>
  )
}

export default GoogleCalInstructionsModal
