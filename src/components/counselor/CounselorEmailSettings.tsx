// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Switch } from 'antd'
import { RichTextEditor } from 'components/common/RichTextEditor'
import WisernetSection from 'components/common/UI/WisernetSection'
import { throttle } from 'lodash'
import React, { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useReduxDispatch } from 'store/store'
import { selectCounselor } from 'store/user/usersSelector'
import { updateCounselor } from 'store/user/usersThunks'
import { Counselor } from 'store/user/usersTypes'
import styles from './styles/CounselorEmailSettings.scss'

const THROTTLE_DELAY = 800

type Props = {
  counselorID: number
}

const CounselorEmailSettings = ({ counselorID }: Props) => {
  const dispatch = useReduxDispatch()
  const counselor = useSelector(selectCounselor(counselorID))

  // State variables for controlled inputs
  const [header, setHeader] = useState('')
  const [signature, setSignature] = useState('')

  useEffect(() => {
    setHeader(counselor?.email_header || '')
    setSignature(counselor?.email_signature || '')
  }, [counselorID]) // eslint-disable-line react-hooks/exhaustive-deps

  // Update local state then autosave
  const autosave = useCallback(
    throttle((val: Partial<Counselor>) => {
      dispatch(updateCounselor(counselorID, val))
    }, THROTTLE_DELAY),
    [counselorID, dispatch],
  )
  const doUpdate = (val: Partial<Counselor>) => {
    if (val.email_signature) setSignature(val.email_signature)
    if (val.email_header) setHeader(val.email_header)
    autosave(val)
  }

  return (
    <div className={styles.counselorEmailSettings}>
      <WisernetSection title="Email content">
        <div className="email-setting-container">
          <h3 className="f-subtitle-1">Email Header</h3>
          <p className="help">
            The below content will automatically populate at the top of your emails with meeting notes. You will be able
            to edit this header for each email before sending.
          </p>
          <RichTextEditor
            value={header}
            onChange={(v: string) => doUpdate({ email_header: v })}
            placeholder="Enter your email header here..."
          />
        </div>
        <div className="email-setting-container">
          <h3 className="f-subtitle-1">Email Signature</h3>
          <p className="help">
            The below content will automatically populate at the bottom of your emails with meeting notes. You will be
            able to edit this signature for each email before sending.
          </p>
          <RichTextEditor
            value={signature}
            onChange={(v: string) => doUpdate({ email_signature: v })}
            placeholder="Enter your email signature here..."
          />
        </div>
        <div className="email-setting-container">
          <Switch checked={counselor?.cc_on_meeting_notes} onChange={e => doUpdate({ cc_on_meeting_notes: e })} />
          &nbsp;CC me (counselor) on all meeting notes emails to parents
        </div>
      </WisernetSection>
    </div>
  )
}
export default CounselorEmailSettings
