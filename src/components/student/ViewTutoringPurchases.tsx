// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Skeleton, Table, Typography } from 'antd'
import moment from 'moment'
import _ from 'lodash'
import numeral from 'numeral'
import React, { useEffect, useState } from 'react'
import { shallowEqual, useSelector } from 'react-redux'
import { RootState } from 'store/rootReducer'
import { useReduxDispatch } from 'store/store'
import { fetchTutoringPackagePurchases } from 'store/tutoring/tutoringThunks'
import { ActiveUser, UserType } from 'store/user/usersTypes'
import { TutoringPackagePurchase } from 'store/tutoring/tutoringTypes'

export const ViewTutoringPurchases = () => {
  const dispatch = useReduxDispatch()
  const [loading, setLoading] = useState(false)

  const { student, packagePurchases } = useSelector((state: RootState) => {
    if (state.user.activeUser?.userType === UserType.Parent) {
      const student = state.user.selectedStudent
      return {
        student,
        packagePurchases: Object.values(state.tutoring.tutoringPackagePurchases).filter(p => {
          return p.student === student?.pk
        }),
      }
    }
    const student = state.user.students[(state.user.activeUser as ActiveUser).cwUserID]
    const packagePurchases = Object.values(state.tutoring.tutoringPackagePurchases).filter(p => {
      return p.student === student.pk
    })

    return { student, packagePurchases }
  }, shallowEqual)

  type packagePurchasesRow = {
    key: number
    created: string
    price_paid: string
    individual_test_prep_hours: number
    group_test_prep_hours: number
  }

  const hasSessions = Boolean(Object.keys(packagePurchases).length)
  const hasStudent = Boolean(student)
  useEffect(() => {
    if (!hasSessions || !hasStudent) setLoading(true)

    if (hasStudent) {
      dispatch(fetchTutoringPackagePurchases(student.pk)).then(r => setLoading(false))
    }
  }, [dispatch, hasSessions, hasStudent, student.pk])

  let dataRows: packagePurchasesRow[] = []
  const individualTestPrepHours = _.sum(_.map(packagePurchases, p => Number(p.individual_test_prep_hours)))
  const groupTestPrepHours = _.sum(_.map(packagePurchases, p => Number(p.group_test_prep_hours)))
  const individualCurriculumHours = _.sum(_.map(packagePurchases, p => Number(p.individual_curriculum_hours)))
  let formatedTotalCost = ''

  if (packagePurchases) {
    const moneyString = numeral(_.sum(_.map(packagePurchases, 'price_paid')))
    formatedTotalCost = moneyString.format('$0,0.00')

    dataRows = Object.values(packagePurchases).map(r => {
      const moneyString = numeral(r.price_paid)
      return {
        key: r.pk,
        created: moment(r.created).format('MM/DD/YYYY'),
        price_paid: moneyString.format('$0,0.00'),
        individual_test_prep_hours: r.individual_test_prep_hours,
        group_test_prep_hours: r.group_test_prep_hours,
        individual_curriculum_hours: r.individual_curriculum_hours,
      }
    })
  }

  const columns = [
    {
      title: 'Purchase Date',
      dataIndex: 'created',
      sorter: (a: packagePurchasesRow, b: packagePurchasesRow): number => (a.created < b.created ? -1 : 1),
      defaultSortOrder: 'descend',
    },
    {
      title: 'Purchase Price',
      dataIndex: 'price_paid',
    },
    {
      title: 'Individual Test Prep Hours',
      dataIndex: 'individual_test_prep_hours',
    },
    {
      title: 'Group Test Prep Hours',
      dataIndex: 'group_test_prep_hours',
    },
    {
      title: 'Individual Curriculum Hours',
      dataIndex: 'individual_curriculum_hours',
    },
  ]

  const { Text } = Typography
  return loading ? (
    <Skeleton />
  ) : (
    <div>
      <h1>Tutoring Package Purchase History</h1>
      <Table
        columns={columns}
        dataSource={dataRows}
        summary={purchaseData => {
          return (
            <tr>
              <th>Totals</th>
              <td>
                <Text>{formatedTotalCost}</Text>
              </td>
              <td>
                <Text>
                  {individualTestPrepHours} hours ({individualTestPrepHours * 60} minutes)
                </Text>
              </td>
              <td>
                <Text>
                  {groupTestPrepHours} hours ({groupTestPrepHours * 60} minutes)
                </Text>
              </td>
              <td>
                <Text>
                  {individualCurriculumHours} hours ({individualCurriculumHours * 60} minutes)
                </Text>
              </td>
            </tr>
          )
        }}
      />
    </div>
  )
}

export default ViewTutoringPurchases
