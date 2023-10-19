// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React from 'react'
import moment from 'moment'
import { ContentIcon } from 'components/common/ContentIcon'

// Note: time is controlled via hasTime boolean
const defaultOptions = {
  header: { month: 'short' },
  title: { weekday: 'short' },
  value: { day: 'numeric' },
}

//? How do I import instead of redeclare?
interface DateTimeFormatOptions {
  localeMatcher?: string
  weekday?: string
  era?: string
  year?: string
  month?: string
  day?: string
  hour?: string
  minute?: string
  second?: string
  timeZoneName?: string
  formatMatcher?: string
  hour12?: boolean
  timeZone?: string
}

type Props = {
  date: Date
  bgColor?: string
  hasTime?: boolean
  options?: {
    header: DateTimeFormatOptions
    value: DateTimeFormatOptions
    title: DateTimeFormatOptions
  }
}

const formatDate = (date: Date, formatOptions: DateTimeFormatOptions) => {
  return date.toLocaleDateString(undefined, formatOptions)
}

/**
 * Renders a calendar icon with a dynamic date
 * @param date Date to display on icon
 */
export const CalendarIcon = ({ date, bgColor = '#04acec', hasTime = false, options = defaultOptions }: Props) => {
  const header = formatDate(date, options.header)
  const title = formatDate(date, options.title)
  const value = formatDate(date, options.value)
  const footer = hasTime ? moment(date).format('h:mma') : undefined

  return <ContentIcon header={header} footer={footer} bgColor={bgColor} title={title} value={value} />
}
