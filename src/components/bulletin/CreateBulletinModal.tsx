// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { LeftOutlined } from '@ant-design/icons'
import { Button, message } from 'antd'
import Modal from 'antd/lib/modal/Modal'
import { clone, map } from 'lodash'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectVisibleModal, selectVisibleModalProps } from 'store/display/displaySelectors'
import { closeModal } from 'store/display/displaySlice'
import { CreateBulletinProps, MODALS } from 'store/display/displayTypes'
import { selectBulletin } from 'store/notification/notificationsSelector'
import { createBulletin, updateBulletin } from 'store/notification/notificationsThunks'
import { Bulletin } from 'store/notification/notificationsTypes'
import { useReduxDispatch } from 'store/store'
import CreateBulletinContent from './CreateBulletinModalContent'
import CreateBulletinModalRecipients from './CreateBulletinModalRecipients'
import styles from './styles/CreateBulletinModal.scss'

enum Page {
  Recipients,
  Bulletin,
}
const InitialData: Partial<Bulletin> = {
  pk: undefined,
  title: '',
  content: '',
  students: true,
  parents: true,
  cap: true,
  cas: true,
  class_years: [],
  counseling_student_types: [],
  send_notification: true,
  file_uploads: [],
  tags: [],
}

const CreateBulletinModal = () => {
  const [page, setPage] = useState(Page.Recipients)
  const [bulletin, setBulletin] = useState(InitialData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const dispatch = useReduxDispatch()

  const props = useSelector(selectVisibleModalProps(MODALS.CREATE_BULLETIN)) as CreateBulletinProps
  const visible = useSelector(selectVisibleModal(MODALS.CREATE_BULLETIN))
  const editBulletin = useSelector(selectBulletin(props?.bulletinID))

  useEffect(() => {
    if (visible) {
      if (editBulletin) {
        setPage(Page.Bulletin)
        setBulletin({ ...editBulletin })
      } else {
        setBulletin(clone(InitialData))
        setPage(Page.Recipients)
      }
    }
  }, [visible, editBulletin]) // eslint-disable-line react-hooks/exhaustive-deps

  const doCloseModal = () => {
    setPage(Page.Recipients)
    setBulletin(clone(InitialData))
    dispatch(closeModal())
  }

  const onNext = async () => {
    setError('')
    const errors = []
    if (page === Page.Recipients) {
      // Validate

      if (
        !bulletin.class_years?.length &&
        !bulletin.counseling_student_types?.length &&
        !bulletin.visible_to_notification_recipients &&
        !bulletin.tags?.length
      )
        errors.push('Please select class years/packages or individual students/parents for this announcement')
    } else if (page === Page.Bulletin) {
      if (!bulletin.title) errors.push('Please enter a subject')
      if (!bulletin.content) errors.push('Please enter content')
    }
    if (errors.length > 0) {
      setError(errors.join('. '))
      return
    }

    if (page === Page.Recipients) {
      setPage(Page.Bulletin)
      return
    }

    // If we are setting visible to notification recipients explicitly, then evergreen is false and
    // we ignore class years and students
    if (!editBulletin && bulletin.visible_to_notification_recipients) {
      bulletin.evergreen = false
      bulletin.counseling_student_types = []
      bulletin.class_years = []
      bulletin.all_class_years = false
      bulletin.all_counseling_student_types = false
      bulletin.tags = []
    } else if (bulletin.evergreen) {
      bulletin.tags = []
    }

    // Set update_file_uploads to be slugs of all of our file uploads
    if (bulletin.file_uploads) {
      bulletin.update_file_uploads = map(bulletin.file_uploads, 'slug')
      // delete bulletin.file_uploads
    }

    // We are ready to create/save the bulletin
    setLoading(true)
    try {
      if (editBulletin) {
        await dispatch(updateBulletin({ ...editBulletin, ...bulletin }))
      } else {
        await dispatch(createBulletin(bulletin))
      }
      doCloseModal()
    } catch (err) {
      message.warn('Could not save bulletin')
    } finally {
      setLoading(false)
    }
  }

  let nextText = 'Next'
  if (page === Page.Bulletin) nextText = editBulletin ? 'Update' : 'Post'
  const footer = (
    <div className="footer flex">
      <div className="left">
        {page === Page.Bulletin && !editBulletin && (
          <Button type="default" onClick={() => setPage(Page.Recipients)}>
            <LeftOutlined />
            Edit Recipients
          </Button>
        )}
      </div>
      <div className="right">
        <Button type="default" onClick={() => doCloseModal()}>
          Cancel
        </Button>
        <Button type="primary" onClick={onNext} loading={loading}>
          {nextText}
        </Button>
      </div>
    </div>
  )

  /** VERY IMPORTANT  when modal re-opens the quill editor
   * in our content component will overwrite bulletin state var with previous editBulletin if bulletin isn't set yet
   */
  const updateContent = (content: string) => {
    if (!editBulletin || bulletin.pk === editBulletin.pk) {
      setBulletin({ ...bulletin, content })
    }
  }
  return (
    <Modal footer={footer} className={styles.createBulletinModal} visible={visible} onCancel={() => doCloseModal()}>
      {page === Page.Recipients && <CreateBulletinModalRecipients bulletin={bulletin} setBulletin={setBulletin} />}
      {page === Page.Bulletin && (
        <CreateBulletinContent bulletin={bulletin} setBulletin={setBulletin} updateContent={updateContent} />
      )}
      {error && <p className="center error red">{error}</p>}
    </Modal>
  )
}
export default CreateBulletinModal
