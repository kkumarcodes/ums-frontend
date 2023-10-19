// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React from 'react'
import styles from 'components/common/styles/CalendarIcon.scss'

type Props = {
  header: string
  title?: string
  value: string
  footer?: string
  bgColor?: string
}

export const ContentIcon = ({ header, title, value, footer, bgColor }: Props) => {
  return (
    <div className={styles.icon}>
      <div className={styles.header} style={{ backgroundColor: bgColor }}>
        {header}
      </div>
      <div className={styles.middle}>
        <div className={styles.title}>{title}</div>
        <div className={styles.value}>{value}</div>
      </div>
      {footer ? (
        <div className={styles.footer} style={{ backgroundColor: bgColor }}>
          {footer}
        </div>
      ) : (
        <div className={styles.footer} style={{ backgroundColor: bgColor }}>
          &nbsp;
        </div>
      )}
    </div>
  )
}
