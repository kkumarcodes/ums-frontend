// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Form, Select } from 'antd'
import { SelectProps } from 'antd/lib/select'
import styles from 'components/common/styles/FormItems.scss'
import { lowerCase, groupBy, sortBy } from 'lodash'
import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { selectTutoringServices } from 'store/tutoring/tutoringSelectors'
import { useReduxDispatch } from 'store/store'
import { fetchTutoringServices } from 'store/tutoring/tutoringThunks'
import { TutoringSessionType } from 'store/tutoring/tutoringTypes'

type Props = {
  name: string
  label?: string
  wrapperCN?: string
  isRequired?: boolean
  placeholder?: string
  extra?: string
} & SelectProps<any>

/**
 * Reusable select tutoring service
 * @param name Item name
 * @param entities Item array to appear in Select
 */
export const WrappedTutoringServiceSelect = ({
  name,
  label,
  placeholder,
  wrapperCN = styles.wrapperPersonSelect,
  isRequired = true,
  extra,
  ...fieldProps
}: Props) => {
  const tutoringServices = useSelector(selectTutoringServices)
  const dispatch = useReduxDispatch()
  useEffect(() => {
    if (tutoringServices.length === 0) {
      dispatch(fetchTutoringServices())
    }
  }, [dispatch, tutoringServices.length])

  const groupedServices = groupBy(sortBy(tutoringServices, 'name'), gb => {
    if (gb.session_type === TutoringSessionType.Curriculum) {
      return 'Curriculum'
    }
    if (gb.applies_to_individual_sessions) {
      return 'Ind. Test Prep'
    }
    return 'Group Test Prep'
  })

  return (
    <div className={wrapperCN}>
      <Form.Item
        name={name}
        label={label}
        rules={[{ required: isRequired, message: `Select subject(s)` }]}
        extra={extra}
      >
        <Select
          showSearch
          filterOption
          className="select ant-select"
          placeholder={placeholder || `Select a ${lowerCase(name)}`}
          optionFilterProp="children"
          mode="multiple"
          {...fieldProps}
        >
          {Object.keys(groupedServices).map(key => {
            return (
              <Select.OptGroup label={key} key={key}>
                {groupedServices[key].map(s => (
                  <Select.Option key={s.slug} value={s.pk}>
                    {s.name} {s.level && <span>({s.level})</span>}
                  </Select.Option>
                ))}
              </Select.OptGroup>
            )
          })}
        </Select>
      </Form.Item>
    </div>
  )
}
