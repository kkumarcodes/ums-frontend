// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { QuestionCircleOutlined } from '@ant-design/icons'
import { Checkbox, Input, Tooltip } from 'antd'
import MultiFileUpload from 'components/common/MultiFileUpload'
import { RichTextEditor } from 'components/common/RichTextEditor'
import React, { useRef } from 'react'
import ReactQuill from 'react-quill'
import { Bulletin } from 'store/notification/notificationsTypes'
import styles from './styles/CreateBulletinModal.scss'

type Props = {
  bulletin: Partial<Bulletin>
  setBulletin: React.Dispatch<React.SetStateAction<Partial<Bulletin>>>
  updateContent: (content: string) => void
}

const CreateBulletinContent = ({ bulletin, setBulletin, updateContent }: Props) => {
  const editorRef = useRef<ReactQuill>(null)

  return (
    <div className={styles.createBulletinContent}>
      <div className="subject-container form-flex">
        <label>Subject</label>
        <Input value={bulletin.title} onChange={e => setBulletin({ ...bulletin, title: e.target.value })} />
      </div>
      <div className="rich-text-container">
        <label>Announcement:</label>
        <RichTextEditor
          ref={editorRef}
          placeholder="Add your notes here..."
          initialHtml={bulletin.content || ''}
          value={bulletin.content}
          onChange={updateContent}
        />
      </div>
      <div className="file-attachments">
        <MultiFileUpload
          allowLink={false}
          value={bulletin.file_uploads ?? []}
          onChange={fu => setBulletin({ ...bulletin, file_uploads: fu })}
        />
      </div>
      {!bulletin.pk && (
        <div className="send-noti">
          <Tooltip title="Whether or not users who can see this announcements should recieve an email/text alert for the announcement">
            <Checkbox
              checked={bulletin.send_notification}
              onChange={e => setBulletin({ ...bulletin, send_notification: e.target.checked })}
            >
              Send notification for announcement&nbsp;
              <QuestionCircleOutlined />
            </Checkbox>
          </Tooltip>
        </div>
      )}
    </div>
  )
}
export default CreateBulletinContent
