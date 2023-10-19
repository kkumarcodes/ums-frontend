// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React from 'react'
import _ from 'lodash'
import { useSelector } from 'react-redux'
import { RootState } from 'store/rootReducer'
import { Button } from 'antd'

import { LinkOutlined } from '@ant-design/icons'
import styles from './styles/StudentBasecampDetails.scss'

type Props = {
  studentID: number
}

const StudentBasecampDetails = ({ studentID }: Props) => {
  const student = useSelector((state: RootState) => state.user.students[studentID])
  return (
    <div className={styles.studentBasecampDetails}>
      {student?.basecamp_attachments && (
        <p>
          <img src="/static/cwcommon/basecamp.jpeg" alt="Basecamp" />
          <Button target="blank" type="link" href={student.basecamp_attachments}>
            Basecamp Files <LinkOutlined />
          </Button>
        </p>
      )}
      {!student?.basecamp_attachments && <p className="help">No basecamp files</p>}

      {student?.basecamp_documents && (
        <p>
          <img src="/static/cwcommon/basecamp.jpeg" alt="Basecamp" />
          <Button target="blank" type="link" href={student.basecamp_documents}>
            Basecamp Notes/Docs <LinkOutlined />
          </Button>
        </p>
      )}
      {!student?.basecamp_documents && <p className="help">No basecamp notes</p>}
    </div>
  )
}
export default StudentBasecampDetails
