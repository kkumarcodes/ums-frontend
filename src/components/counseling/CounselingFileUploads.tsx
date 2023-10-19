// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { DeleteOutlined, EditOutlined, LinkOutlined, PlusCircleOutlined } from '@ant-design/icons'
import { Button, Input, Popconfirm } from 'antd'
import Table from 'antd/lib/table'
import moment from 'moment'
import { getFullName } from 'components/administrator'
import _ from 'lodash'
import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { FileUpload } from 'store/common/commonTypes'
import { deleteFileUpload } from 'store/counseling/counselingThunks'
import { CounselingUploadFileTags } from 'store/counseling/counselingTypes'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import { RootState } from 'store/rootReducer'
import { useReduxDispatch } from 'store/store'
import { selectIsCounselor, selectIsParent } from 'store/user/usersSelector'
import styles from './styles/CounselingFileUploads.scss'

type Props = {
  studentID: number
  filterTags?: CounselingUploadFileTags[]
  condensed?: boolean // Don't show add file button, and exclude tags column
  readOnly?: boolean
}

const CounselingFileUploads = ({ studentID, filterTags, condensed = false, readOnly = false }: Props) => {
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('')
  const dispatch = useReduxDispatch()

  const isCounselor = useSelector(selectIsCounselor)
  const isParent = useSelector(selectIsParent)
  readOnly = readOnly || !!isParent
  const student = useSelector((state: RootState) => state.user.students[studentID])
  const counselingFileUploads = useSelector((state: RootState) =>
    Object.values(state.counseling.counselingFileUploads).filter(
      fu =>
        student.counseling_file_uploads?.includes(fu.slug) &&
        (!filterTags || _.some(filterTags, t => fu.tags.includes(t))),
    ),
  )

  const filteredFileUploads =
    filter.length > 2
      ? counselingFileUploads.filter(
          cfu =>
            cfu.title.toLowerCase().includes(filter.toLowerCase()) ||
            cfu.tags.join(' ').toLowerCase().includes(filter.toLowerCase()),
        )
      : counselingFileUploads

  // Deleting a file upload makes it inactive
  const deleteResource = async (slug: string) => {
    setLoading(true)
    dispatch(deleteFileUpload(slug, student.pk))
    setLoading(false)
  }

  // Note that only counselors can edit/delete
  const renderEdit = (_, fu: FileUpload) => (
    <div className="edit-container">
      <Button
        shape="circle"
        type="default"
        size="small"
        icon={<EditOutlined />}
        onClick={() =>
          dispatch(
            showModal({
              modal: MODALS.COUNSELING_FILE_UPLOAD,
              props: { editFileUploadSlug: fu.slug, studentID, tags: fu.tags },
            }),
          )
        }
      />
      <Popconfirm onConfirm={() => deleteResource(fu.slug)} title="Are you sure you want to remove this file?">
        <Button size="small" loading={loading} shape="circle" type="default" icon={<DeleteOutlined />} />
      </Popconfirm>
    </div>
  )

  const renderLink = (url: string) => (
    <Button type="link" href={url} target="_blank" rel="noopener">
      Open File
      <LinkOutlined />
    </Button>
  )

  const renderCreated = (created: string) => moment(created).format('MM/DD/YY')

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
    },
    {
      title: 'File',
      dataIndex: 'url',
      render: renderLink,
    },
    {
      title: 'Created',
      dataIndex: 'created',
      render: renderCreated,
    },
  ]
  if (!condensed) {
    columns.push({
      title: 'Tags',
      dataIndex: 'tags',
      render: (tags: string[]) => (tags || []).join(', '),
    })
  }
  // Only counselors can edit
  if (isCounselor) {
    columns.push({
      title: 'Edit',
      dataIndex: 'pk',
      render: renderEdit,
    })
  }

  return (
    <div className={styles.counselingFileUploads}>
      <h2 className="f-title">File Uploads</h2>
      {isCounselor && (
        <p className="help">
          You and {getFullName(student)} can both upload files to this section. Files are specific to one student.
        </p>
      )}
      {!isCounselor && (
        <p className="help">Use this section to upload files. Files will be visible to you and your counselor.</p>
      )}
      <div className="wisernet-toolbar">
        {!filterTags && (
          <div>
            <Input.Search
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder="Filter by title or tags..."
              size="small"
            />
          </div>
        )}
        {!condensed && !readOnly && (
          <div className="action-container right">
            <Button
              type="primary"
              size="small"
              onClick={() =>
                dispatch(showModal({ modal: MODALS.COUNSELING_FILE_UPLOAD, props: { studentID, tags: filterTags } }))
              }
            >
              <PlusCircleOutlined />
              Add File
            </Button>
          </div>
        )}
      </div>
      <Table size="small" rowKey="slug" columns={columns} dataSource={filteredFileUploads} />
    </div>
  )
}
export default CounselingFileUploads
