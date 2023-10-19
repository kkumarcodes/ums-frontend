// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { Modal } from 'antd'
import React, { useState } from 'react'
import { useLocation } from 'react-router-dom'

const WelcomeModal = () => {
  const routerURLParams = new URLSearchParams(useLocation().search)
  const browserURLParams = new URLSearchParams(window.location.search)
  const [visible, setVisible] = useState(
    Boolean(routerURLParams.get('welcomeModal')) || Boolean(browserURLParams.get('welcomeModal')),
  )
  return (
    <Modal
      visible={visible}
      onCancel={() => setVisible(false)}
      onOk={() => setVisible(false)}
      cancelButtonProps={{ style: { display: 'none' } }}
      title="Welcome to UMS"
    >
      <p className="center">
        Welcome to UMS! Please bookmark this page (wisernet.collegewise.com) so you can easily come back to use
        whenever you need.
      </p>
    </Modal>
  )
}
export default WelcomeModal
