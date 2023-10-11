// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { EditOutlined } from '@ant-design/icons'
import { Table, Tag } from 'antd'
import { TableProps } from 'antd/lib/table'
import { createColumns } from 'components/administrator'
import styles from 'components/administrator/styles/Page.scss'
import React from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import { useReduxDispatch } from 'store/store'
import { selectLocations } from 'store/tutoring/tutoringSelectors'
import { Location } from 'store/tutoring/tutoringTypes'
import { AddLocationForm } from './AddLocationForm'

const expandedRowRender = (record: Location) => <p>Expanded Component Placeholder; Use to display location address?</p>

const tableProps: TableProps<Location> = {
  rowKey: 'pk',
  showHeader: true,
  expandedRowRender,
  expandRowByClick: true,
  size: 'middle',
  pagination: { position: 'bottom' },
}

const renderNameLink = (text: string, record: Location) => (
  <Link className={styles.nameLink} to={`/locations/${record.pk}`}>
    {text}
  </Link>
)

const renderOffersTutoring = (text: string, record: Location) => (
  <Tag color={record.offers_tutoring ? 'green' : 'red'}>{record.offers_tutoring ? 'Yes' : 'No'}</Tag>
)

const renderOffersAdmissions = (text: string, record: Location) => (
  <Tag color={record.offers_admissions ? 'green' : 'red'}>{record.offers_admissions ? 'Yes' : 'No'}</Tag>
)

/**
 * Component renders a location page that displays a AddLocation button and Locations Table
 */
export const LocationPage = () => {
  const locations = useSelector(selectLocations)
  const dispatch = useReduxDispatch()

  // launch modal to enable editing of location data
  const showEditLocationModal = (pk: number) => dispatch(showModal({ props: { pk }, modal: MODALS.LOCATION }))

  // Display edit icon on each location row
  const renderEditLocation = (text: string, record: Location) => {
    return <EditOutlined onClick={() => showEditLocationModal(record.pk)} />
  }

  // Table columns to render
  const columns = createColumns([
    ['Name', 'name', renderNameLink],
    'description',
    ['Offers Tutoring?', 'offers_tutoring', renderOffersTutoring],
    ['Offers Admissions?', 'offers_admission', renderOffersAdmissions],
    ['Edit', 'edit_location', renderEditLocation],
  ])

  return (
    <section className={styles.locationPage}>
      <h1>Location Table</h1>
      <div className={styles.addButtonWrapper}>
        <AddLocationForm />
      </div>
      <Table {...tableProps} dataSource={locations} columns={columns} />
    </section>
  )
}
export default LocationPage
