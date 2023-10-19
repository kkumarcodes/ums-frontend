// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import Vimeo from '@u-wave/react-vimeo'
import { Modal } from 'antd'
import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { selectVisibleModal, selectVisibleModalProps } from 'store/display/displaySelectors'
import { closeModal } from 'store/display/displaySlice'
import { MODALS, VimeoResourceModalProps } from 'store/display/displayTypes'

import { selectResource } from 'store/resource/resourcesSelectors'
import { Resource } from 'store/resource/resourcesTypes'
import { useReduxDispatch } from 'store/store'

const VimeoResourceModal = () => {
  const dispatch = useReduxDispatch()
  const visible = useSelector(selectVisibleModal(MODALS.VIMEO_RESOURCE_MODAL))
  const modalProps = useSelector(selectVisibleModalProps(MODALS.VIMEO_RESOURCE_MODAL)) as VimeoResourceModalProps
  const resource = useSelector(selectResource(modalProps?.pk))
  const [currentTime, setCurrentTime] = useState(0)
  const [currentPercentage, setCurrentPercentage] = useState(0)

  const trackEvent = (eventName: string, resource?: Resource) => {

  }

  const renderPlayer = (resource?: Resource) => {
    return (
      <div>
        <h2>{resource?.title}</h2>
        <Vimeo
          video={resource?.link || 'x2to0hs'}
          responsive={true}
          autoplay
          onLoaded={() => {
            trackEvent('Start Vimeo Video', resource)
          }}
          onTimeUpdate={data => {
            setCurrentTime(data.seconds)
            setCurrentPercentage(data.percent)
          }}
        />
      </div>
    )
  }

  return (
    <Modal
      visible={visible}
      className="rlmodal"
      closable
      width={768}
      destroyOnClose={true}
      footer={null}
      onCancel={() => {
        dispatch(closeModal())
        trackEvent('End Vimeo Video', resource)
      }}
    >
      {renderPlayer(resource)}
    </Modal>
  )
}

export default VimeoResourceModal
