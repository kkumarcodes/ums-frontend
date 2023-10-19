// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import React from 'react'
import styles from './styles/UIStyles.scss'

export enum WisernetSectionContrast {
  High = 'high-contrast', // Blue background, white text
  Low = 'low-contrast', // Gray background, blue text
}

type Props = {
  children: React.ReactNode
  title?: React.ReactNode | string
  className?: string
  help?: string
  contrast?: WisernetSectionContrast // Dark blue background; white font
  noPadding?: boolean
}

const WisernetSection = ({ children, title, className, help, contrast, noPadding }: Props) => {
  let contrastClassName = ''
  if (contrast === WisernetSectionContrast.High) contrastClassName = styles.wisernetSectionHighContrast
  else if (contrast === WisernetSectionContrast.Low) contrastClassName = styles.wisernetSectionLowContrast
  return (
    <div className={`wisernet-section ${className} ${styles.wisernetSection} ${contrastClassName}`}>
      {title && <h2 className="wisernet-section-title f-title">{title}</h2>}
      <div className={`wisernet-section-content ${noPadding ? 'no-padding' : ''}`}>{children}</div>
      {help && <div className="wisernet-section-help help">{help}</div>}
    </div>
  )
}
export default WisernetSection
