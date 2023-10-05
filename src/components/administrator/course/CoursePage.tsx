// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { PlusCircleOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { SearchProvider } from 'components/administrator/'
import DownloadCSVButton from 'components/common/DownloadCSVButton'
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import CourseTable from './CourseTable'
import { CourseFilter } from './CourseFilter'
import { CSVDataTypes } from 'components/common/enums'

/**
 * Renders a layout component for managing GroupTutoringSessions and provides FilterContext
 */
export const CoursePage = () => {
  const [searchText, setSearchText] = useState('')

  return (
    <SearchProvider value={{ searchText, setSearchText }}>
      <section className="pageContainer">
        <h1>Courses</h1>
        <div className="actionsContainer">
          <CourseFilter />
          <DownloadCSVButton dataType={CSVDataTypes.Courses} />
          <Link to="/user/platform/administrator/courses/add/">
            <Button className="buttonCreate" type="primary">
              <PlusCircleOutlined />
              Create New Course
            </Button>
          </Link>
        </div>
        <CourseTable />
      </section>
    </SearchProvider>
  )
}

export default CoursePage
