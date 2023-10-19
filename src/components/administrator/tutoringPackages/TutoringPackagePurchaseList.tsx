// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { PlusCircleOutlined, RollbackOutlined } from '@ant-design/icons'
import { Button, message, Popconfirm, Row, Skeleton, Table, Tag, Tooltip } from 'antd'
import { TableProps } from 'antd/lib/table'
import moment from 'moment'
import React, { useEffect, useState } from 'react'
import { shallowEqual, useSelector } from 'react-redux'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import { RootState } from 'store/rootReducer'
import { useReduxDispatch } from 'store/store'
import {
  fetchTutoringPackagePurchases,
  fetchTutoringPackages,
  reverseTutoringPackagePurchase,
} from 'store/tutoring/tutoringThunks'
import { TutoringPackage, TutoringPackagePurchase } from 'store/tutoring/tutoringTypes'
import { selectStudent } from 'store/user/usersSelector'
import { sortString } from '../utils'
import styles from './styles/TutoringPackagePurchaseList.scss'

type Props = {
  forStudent: number
}

export const TutoringPackagePurchaseList = ({ forStudent }: Props) => {
  const [loading, setLoading] = useState(false)
  const [reversing, setReversing] = useState(false)
  const dispatch = useReduxDispatch()
  const student = useSelector(selectStudent(forStudent))

  const { tutoringPackagePurchases } = useSelector((state: RootState) => {
    return {
      tutoringPackagePurchases: Object.values(state.tutoring.tutoringPackagePurchases).filter(
        p => p.student === forStudent,
      ),
    }
  }, shallowEqual)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const promises: Promise<any>[] = [
        dispatch(fetchTutoringPackagePurchases(forStudent)),
        dispatch(fetchTutoringPackages()),
      ]
      Promise.all(promises)
        .then(() => setLoading(false))
        .catch(e => message.error('Failed to fetch data'))
    }
    fetchData()
  }, [dispatch, forStudent])

  const showCreateModal = () => {
    dispatch(showModal({ modal: MODALS.CREATE_TUTORING_PACKAGE_PURCHASE, props: { student: forStudent } }))
  }

  const reversePurchase = (purchasePK: number) => {
    setReversing(true)
    dispatch(reverseTutoringPackagePurchase(purchasePK)).finally(() => setReversing(false))
  }

  /** Couple of render functions */
  const renderReversed = (text: string) =>
    text ? <Tag color="red">Reversed {moment(text).format('MMM Do h:mma')}</Tag> : ''

  const renderCreated = (text: string) => (text ? moment(text).format('MMM Do h:mma') : '')

  const renderActions = (text: string, record: TutoringPackagePurchase) => {
    return record.purchase_reversed || reversing ? null : (
      <Row>
        <Popconfirm
          title="Are you sure you want to reverse this package (remove hours from student)?"
          onConfirm={() => reversePurchase(record.pk)}
        >
          <Tooltip title="Reverse package">
            <Button size="small">
              <RollbackOutlined />
            </Button>
          </Tooltip>
        </Popconfirm>
      </Row>
    )
  }

  const COLUMNS = [
    {
      title: 'Package',
      dataIndex: 'tutoring_package_name',
      sorter: (a, b) => sortString(b.tutoring_package_name, a.tutoring_package_name),
      defaultSortOrder: 'ascend',
      sortDirections: ['ascend', 'descend', 'ascend'],
    },
    {
      title: 'Individual Test Prep Hours',
      dataIndex: 'individual_test_prep_hours',
      sorter: (a: TutoringPackage, b: TutoringPackage) => b.individual_test_prep_hours - a.individual_test_prep_hours,
      sortDirections: ['ascend', 'descend', 'ascend'],
    },
    {
      title: 'Group Test Prep Hours',
      dataIndex: 'group_test_prep_hours',
      sorter: (a: TutoringPackage, b: TutoringPackage) => b.group_test_prep_hours - a.group_test_prep_hours,
      sortDirections: ['ascend', 'descend', 'ascend'],
    },
    {
      title: 'Individual Curriculum Hours',
      dataIndex: 'individual_curriculum_hours',
      sorter: (a: TutoringPackage, b: TutoringPackage) => b.individual_curriculum_hours - a.individual_curriculum_hours,
      sortDirections: ['ascend', 'descend', 'ascend'],
    },
    {
      title: 'Purchased',
      dataIndex: 'created',
      render: renderCreated,

      sorter: (a: TutoringPackage, b: TutoringPackage) => moment(a.created).valueOf() - moment(b.created).valueOf(),

      sortDirections: ['ascend', 'descend', 'ascend'],
    },
    {
      title: 'Price Paid',
      dataIndex: 'price_paid',
      render: (s: string) => `$${s}`,
      sorter: (a: TutoringPackage, b: TutoringPackage) => {
        return parseFloat(a.price_paid) - parseFloat(b.price_paid)
      },

      sortDirections: ['ascend', 'descend', 'ascend'],
    },
    {
      title: 'Reversed',
      dataIndex: 'purchase_reversed',
      render: renderReversed,
    },
    {
      title: 'Note',
      dataIndex: 'admin_note',
    },
    {
      title: 'Actions',
      dataIndex: 'pk',
      render: renderActions,
    },
  ]

  const tableProps: TableProps<TutoringPackagePurchase> = {
    showHeader: true,
    // size: 'middle',
    pagination: { position: 'bottom' },
    rowKey: 'pk',
  }

  return (
    <section className={styles.tutoringPackagePurchaseList}>
      {loading && <Skeleton />}
      {!loading && (
        <>
          <div className="flex hours-remaining">
            <label className="f-subtitle-2">Hours Remaining:</label>
            <span>Individual Curriculum: {student?.individual_curriculum_hours}</span>
            <span>Individual Test Prep: {student?.individual_test_prep_hours}</span>
            <span>Group: {student?.group_test_prep_hours}</span>
          </div>
          <div className="packagePurchaseToolbar right">
            <Button type="primary" onClick={showCreateModal}>
              <PlusCircleOutlined />
              Add Package Purchase
            </Button>
          </div>
          <div className="tableContainer">
            <Table<TutoringPackagePurchase>
              {...tableProps}
              className="packagesTable"
              dataSource={tutoringPackagePurchases}
              columns={COLUMNS}
            />
          </div>
        </>
      )}
    </section>
  )
}
