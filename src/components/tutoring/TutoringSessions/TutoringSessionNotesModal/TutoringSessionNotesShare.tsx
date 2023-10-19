// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import React from 'react'

import { Checkbox, Input } from 'antd'
import styles from './styles/TutoringSessionNotesModal.scss'
import { useTutoringSessionNotesCtx } from './TutoringSessionNotesModalContext'

const TutoringSessionNotesShare = () => {
  const ctx = useTutoringSessionNotesCtx()

  return (
    <div className={styles.tutoringSessionNotesShare}>
      <div className="checkbox-container">
        <Checkbox
          checked={ctx.share.student || ctx.share.parent}
          onChange={e => ctx.setShare({ student: e.target.checked, parent: e.target.checked })}
        >
          Share with students or parents
        </Checkbox>
      </div>
      <div className="flex">
        <div className="checkbox-container">
          <Checkbox
            checked={ctx.share.student}
            onChange={e => ctx.setShare({ ...ctx.share, student: e.target.checked })}
          >
            Share with student
          </Checkbox>
        </div>
        <div className="checkbox-container">
          <Checkbox checked={ctx.share.parent} onChange={e => ctx.setShare({ ...ctx.share, parent: e.target.checked })}>
            Share with parent
          </Checkbox>
        </div>
      </div>
      {ctx.individualSession && (
        <div className="cc-email-container">
          <label>
            CC Email <span className="help">optional email address to be cc&apos;d on notes here</span>
          </label>
          <Input value={ctx.ccEmail} onChange={e => ctx.setCCEMail(e.target.value)} />
        </div>
      )}
    </div>
  )
}
export default TutoringSessionNotesShare
