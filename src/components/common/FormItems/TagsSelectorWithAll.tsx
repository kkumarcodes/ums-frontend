// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import Select, { SelectProps } from 'antd/lib/select'
import { map } from 'lodash'
import React from 'react'

type Props = {} & SelectProps<(string | number)[]>

const ALL = 'all'

const TagsSelectorWithAll = ({ options, value, onChange, ...selectProps }: Props) => {
  const updateValue = (val: (number | string)[], o) => {
    if (onChange && val) {
      // We used to have ALL value, now we are going to just the added value
      if (val.length === 2 && val[0] === ALL) {
        onChange([val[1]], o)
      } else if (val.includes(ALL)) {
        // All is getting added, so we select all
        onChange(map(options, 'value'), o)
      } else {
        onChange(val, o)
      }
    }
  }

  const displayOptions = [{ label: 'All', value: ALL }, ...options]
  const displayValue = value?.length === options?.length ? [ALL] : value
  return (
    <div className="tags-selector-with-all">
      <Select mode="tags" {...selectProps} options={displayOptions} value={displayValue} onChange={updateValue} />
    </div>
  )
}
export default TagsSelectorWithAll
