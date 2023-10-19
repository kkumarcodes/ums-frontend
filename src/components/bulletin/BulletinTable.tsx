// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import {
  CheckOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusCircleOutlined,
  PushpinFilled,
  PushpinOutlined,
} from '@ant-design/icons'
import { Button, Popconfirm, Skeleton, Table, Tag, Tooltip } from 'antd'
import React, { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import { selectBulletins } from 'store/notification/notificationsSelector'
import { deleteBulletin, fetchBulletins, updateBulletin } from 'store/notification/notificationsThunks'
import { Bulletin } from 'store/notification/notificationsTypes'
import { useReduxDispatch } from 'store/store'
import moment from 'moment'
import { CounselingStudentType, CounselingStudentTypeLabels } from 'store/user/usersTypes'
import { find, invert, isEmpty, isError, orderBy, some } from 'lodash'
import { selectCounselor, selectIsAdmin } from 'store/user/usersSelector'
import Modal from 'antd/lib/modal/Modal'
import styles from './styles/BulletinTable.scss'

type Props = {
  counselorID?: number // If set, then we just load bulletins for this counselor
}

const MAX_LIST_ITEMS = 5

// Component that's an info modal display students and parents who have read bulletin
// Inlined as component here because this is the only place this will be used
const BulletinReadersModal = ({
  visible,
  bulletin,
  onDismiss,
}: {
  visible: boolean
  bulletin?: Bulletin
  onDismiss: () => void
}) => {
  const noStudents = isEmpty(bulletin?.read_student_names ?? [])
  const noParents = isEmpty(bulletin?.read_parent_names ?? [])
  return (
    <Modal
      className={styles.bulletinReadersModal}
      visible={visible}
      onOk={onDismiss}
      title={`Bulletin Readers - ${bulletin?.title}`}
      onCancel={onDismiss}
      cancelButtonProps={{ style: { display: 'none' } }}
    >
      <p className="help center">
        Below are students and parents who read this announcement <em>within UMS</em>
      </p>
      <div className="flex student-parent-names">
        <div className="students">
          <h3 className="f-subtitle-2 center">Students</h3>
          {(bulletin?.read_student_names ?? []).map(n => (
            <p key={n}>{n}</p>
          ))}
          {noStudents && <p className="help center">No students have read this announcement</p>}
        </div>
        <div className="parents">
          <h3 className="f-subtitle-2 center">Parents</h3>
          {(bulletin?.read_parent_names ?? []).map(n => (
            <p key={n}>{n}</p>
          ))}
          {noParents && <p className="help center">No parents have read this announcement</p>}
        </div>
      </div>
    </Modal>
  )
}

const BulletinTable = ({ counselorID }: Props) => {
  const [loading, setLoading] = useState(false)
  const dispatch = useReduxDispatch()
  const isAdmin = useSelector(selectIsAdmin)
  const counselor = useSelector(selectCounselor(counselorID))
  const [pinningBulletins, setPinningBulletins] = useState<number[]>([])
  // PK of bulletin we're displaying modal to display readers of bulletin
  const [displayReadersPK, setDisplayReadersPK] = useState<number>()

  let bulletins = orderBy(useSelector(selectBulletins), 'created', 'desc')
  if (counselor) bulletins = bulletins.filter(b => b.created_by === counselor.user_id)
  else if (isAdmin) bulletins = bulletins.filter(b => b.admin_announcement)

  // Edit and delete actions
  const onEdit = (pk: number) => dispatch(showModal({ modal: MODALS.CREATE_BULLETIN, props: { bulletinID: pk } }))
  const onDelete = (pk: number) => {
    dispatch(deleteBulletin(pk))
  }

  const renderBool = (val: boolean) => (val ? <CheckOutlined /> : '')
  const renderList = (val: number[] | string[]) => {
    if (val.length <= MAX_LIST_ITEMS) return val.join(', ')
    return `${val.slice(0, MAX_LIST_ITEMS).join(', ')} and ${val.length - MAX_LIST_ITEMS} more...`
  }

  const renderDate = (val: string) => moment(val).format('MMM Do h:mma')
  const renderPackages = (val: string[], bulletin: Bulletin) =>
    bulletin.all_counseling_student_types
      ? 'All'
      : renderList(val.map(v => CounselingStudentTypeLabels[invert(CounselingStudentType)[v]]))

  const renderClassYears = (years: number[], bulletin: Bulletin) =>
    bulletin.all_class_years ? 'All' : renderList(years)

  const renderStudentTags = (tags: string[], bulletin: Bulletin) => (bulletin.tags ? renderList(tags) : 'None')

  const renderRead = (_, bulletin: Bulletin) => {
    const len = (bulletin.read_parent_names ?? []).length + (bulletin.read_student_names ?? []).length
    return (
      <Button className="read-link" type="link" onClick={() => setDisplayReadersPK(bulletin.pk)}>
        View ({len})
      </Button>
    )
  }

  const togglePinned = useCallback(
    async (pk: number, pinned: boolean) => {
      setPinningBulletins([...pinningBulletins, pk])
      await dispatch(updateBulletin({ pk, pinned }))
      setPinningBulletins(pinningBulletins.filter(p => p !== pk))
    },
    [dispatch, pinningBulletins],
  )

  const renderActions = (_, bulletin: Bulletin) => {
    const pinTitle = bulletin.pinned
      ? 'This announcement is pinned. Click to un-pin.'
      : 'Click to pin this announcement, which will make it appear above all un-pinned announcements'
    return (
      <>
        <Tooltip title={pinTitle}>
          <Button
            type="default"
            shape="circle"
            loading={some(pinningBulletins, b => b === bulletin.pk)}
            size="small"
            icon={bulletin.pinned ? <PushpinFilled /> : <PushpinOutlined />}
            onClick={() => togglePinned(bulletin.pk, !bulletin.pinned)}
          />
        </Tooltip>
        <Button
          type="default"
          shape="circle"
          size="small"
          icon={<EditOutlined />}
          onClick={() => onEdit(bulletin.pk)}
        />
        <Popconfirm onConfirm={() => onDelete(bulletin.pk)} title="Are you sure you want to delete this announcement?">
          <Button type="default" shape="circle" size="small" icon={<DeleteOutlined />} />
        </Popconfirm>
      </>
    )
  }

  const columns = [
    {
      title: 'Created',
      dataIndex: 'created',
      render: renderDate,
    },
    {
      title: 'Subject',
      dataIndex: 'title',
    },
    {
      title: 'Students',
      dataIndex: 'students',
      render: renderBool,
    },
    {
      title: 'Parents',
      dataIndex: 'parents',
      render: renderBool,
    },
    {
      title: 'Evergreen',
      dataIndex: 'evergreen',
      render: renderBool,
    },
    {
      title: 'Class Years',
      dataIndex: 'class_years',
      render: renderClassYears,
      width: '300px',
    },
    {
      title: 'Counseling Packages',
      dataIndex: 'counseling_student_types',
      render: renderPackages,
    },
    {
      title: 'Tags',
      dataIndex: 'tags',
      render: renderStudentTags,
    },
    {
      title: 'Notification Sent',
      dataIndex: 'send_notification',
      render: renderBool,
    },
    {
      title: 'Readers',
      dataIndex: 'read_student_names',
      render: renderRead,
      className: 'center',
    },
    {
      title: 'Actions',
      dataIndex: 'pk',
      width: '160px',
      render: renderActions,
    },
  ]

  useEffect(() => {
    setLoading(true)
    dispatch(fetchBulletins({})).then(() => setLoading(false))
  }, [dispatch])
  return (
    <div className={styles.bulletinTable}>
      <BulletinReadersModal
        onDismiss={() => setDisplayReadersPK(undefined)}
        visible={!!displayReadersPK}
        bulletin={find(bulletins, b => b.pk === displayReadersPK)}
      />
      <h2 className="f-title">Announcements</h2>
      <div className="wisernet-toolbar">
        <Button type="primary" onClick={() => dispatch(showModal({ modal: MODALS.CREATE_BULLETIN, props: {} }))}>
          Create Announcement <PlusCircleOutlined />
        </Button>
      </div>
      <div className="table-container">
        {loading && <Skeleton loading={true} />}
        {!loading && <Table columns={columns} dataSource={bulletins} />}
      </div>
    </div>
  )
}
export default BulletinTable
