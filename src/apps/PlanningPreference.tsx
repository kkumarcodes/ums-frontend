// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Button, message, Radio } from 'antd'
import WisernetSection from 'components/common/UI/WisernetSection'
import React, { useState } from 'react'
import { useLocaleCtx } from './LocaleContext'

const PlanningPreference = () => {
  const { locale, setLocale } = useLocaleCtx()
  const [startOfWeek, setStartOfWeek] = useState(locale)

  const handleSubmit = e => {
    e.preventDefault()
    setLocale(startOfWeek)
    message.info('Changes Saved')
  }

  return (
    <WisernetSection title="Display Preferences">
      <p>Calendar display preferences</p>
      <Radio.Group name="localeOptions" defaultValue={startOfWeek} onChange={e => setStartOfWeek(e.target.value)}>
        <Radio value="enUS">Start your week on Sunday.</Radio>
        <Radio value="enGB">Start your week on Monday.</Radio>
      </Radio.Group>
      <Button type="primary" onClick={handleSubmit}>
        Save Display Preferences
      </Button>
    </WisernetSection>
  )
}

export default PlanningPreference
