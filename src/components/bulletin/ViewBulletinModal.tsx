// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import Modal from 'antd/lib/modal/Modal'
import moment from 'moment'
import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { selectVisibleModal, selectVisibleModalProps } from 'store/display/displaySelectors'
import { closeModal } from 'store/display/displaySlice'
import { MODALS, ViewBulletinProps } from 'store/display/displayTypes'
import { selectBulletin } from 'store/notification/notificationsSelector'
import { readBulletin } from 'store/notification/notificationsThunks'
import { useReduxDispatch } from 'store/store'

const ViewBulletinModal = () => {
  const dispatch = useReduxDispatch()
  const visible = useSelector(selectVisibleModal(MODALS.VIEW_BULLETIN))
  const modalProps = useSelector(selectVisibleModalProps(MODALS.VIEW_BULLETIN)) as ViewBulletinProps
  const bulletin = useSelector(selectBulletin(modalProps?.bulletinID))

  // When modal becomes visible, we mark it read
  const bulletinID = modalProps?.bulletinID
  useEffect(() => {
    if (visible && bulletinID) dispatch(readBulletin(bulletinID))
  }, [dispatch, bulletinID, visible])

  return (
    <Modal
      visible={visible}
      onCancel={() => dispatch(closeModal())}
      okButtonProps={{ style: { display: 'none' } }}
      cancelText="Close"
    >
      <h2 className="center f-subtitle-1">{bulletin?.title}</h2>
      {bulletin?.created && <h3 className="center f-subtitle-3">{moment(bulletin.created).format('MMM Do')}</h3>}
      <div className="content" dangerouslySetInnerHTML={{ __html: bulletin?.content || '' }} />
      {bulletin?.file_uploads && (
        <div className="file-uploads">
          <h3>Attached Files:</h3>
          <ul>
            {bulletin.file_uploads.map(fu => (
              <li key={fu.slug}>
                <a href={fu.url} target="_blank" rel="noreferrer">
                  {fu.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Modal>
  )
}
export default ViewBulletinModal
