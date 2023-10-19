// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React, { useEffect } from 'react'
import CampusReelCarousel from './CampusReelCarousel'

type Props = {
  iped: string
}

const CampusReel = ({ iped }: Props) => {
  useEffect(() => {
    if (iped) {
      new CampusReelCarousel('campusreel', iped, process.env.CAMPUS_REEL_API_KEY)
      return function cleanup() {
        const div = document.querySelector('#campusreel')
        while (div?.firstChild) {
          div.removeChild(div.firstChild)
        }
      }
    }
  }, [iped])

  return (
    <section className="campus-reel-container">
      <h3 className="header">Campus Reel</h3>
      <div className="campus-reel-content">
        <div id="campusreel" />
        {/* <Empty className="empty-campus-reel" description={<div className="h3">No Campus Reel Videos Available</div>} /> */}
      </div>
    </section>
  )
}

export default CampusReel
