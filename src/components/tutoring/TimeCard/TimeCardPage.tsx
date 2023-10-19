// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import styles from 'components/tutoring/styles/TimeCard.scss'
import { TimeCardFilters, TimeCardTable } from 'components/tutoring/TimeCard'
import moment from 'moment'
import React, { useState } from 'react'
import { TimeCardProvider } from './context'

// Week runs Monday-Sunday
moment.locale('en-gb')
const now = moment().hour(0).minute(0).second(0)
const daysSinceLastMonday = now.day() ? now.day() : 7

type Props = {
  tutorID?: number
  adminID?: number
}

/**
 * @param tutorID Defined if active user is a tutor; controls filters/table presentation
 * @param adminID Defined if active user is an admin; controls filters/table presentation
 * Component setups and manages context for children components (TimeCardFilters & TimeCardTable)
 * Also controls overall component layout
 */
export const TimeCardPage = ({ tutorID, adminID }: Props) => {
  const [search, setSearch] = useState('')
  // selectedStart-selectedEnd defaults to current Monday-Sunday week plus previous week
  const [selectedStart, setStart] = useState(now.clone().subtract(daysSinceLastMonday + 7, 'd'))
  const [selectedEnd, setEnd] = useState(now.clone().add(7 - daysSinceLastMonday, 'd'))

  // Context value
  const value = {
    tutorID,
    adminID,
    search,
    setSearch,
    selectedStart,
    selectedEnd,
    setStart,
    setEnd,
  }

  return (
    <section className={styles.containerPage}>
      <h1>Time Cards</h1>
      <TimeCardProvider value={value}>
        <TimeCardFilters />
        <TimeCardTable />
      </TimeCardProvider>
    </section>
  )
}

export default TimeCardPage
