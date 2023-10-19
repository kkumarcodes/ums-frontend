// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { AutoComplete } from 'antd'
import { AutoCompleteProps } from 'antd/lib/auto-complete'
import React, { useState } from 'react'

const CUSTOM_VALUE = 'AUTOCOMPLETE_CUSTOM_VALUE'

type Props = {
  onSelectCustomValue: (value: string) => void
  onSelect: (value: string | number) => void
} & Omit<AutoCompleteProps, 'onSelect'>

export const AutocompleteCustomValue = ({ options, onSelectCustomValue, onSelect, ...props }: Props) => {
  const [search, setSearch] = useState('')

  const internalOnSelect = (value: string | number) => {
    if (value === CUSTOM_VALUE && search) onSelectCustomValue(search)
    else if (value !== CUSTOM_VALUE) onSelect(value)
    setSearch('')
  }
  // We just augment options when they search so the value being searched for is always an option
  const searchMatchesLabel = options && Boolean(options.find(o => o.label === search))
  const augmentedOptions =
    search && options && !searchMatchesLabel
      ? [{ label: `Hit enter to create: ${search}`, value: CUSTOM_VALUE }, ...options]
      : options
  return (
    <AutoComplete
      defaultActiveFirstOption={true}
      options={augmentedOptions}
      onSearch={setSearch}
      showSearch={true}
      filterOption={(s, o) =>
        o?.value === CUSTOM_VALUE || !s || o?.label?.toString().toLowerCase().includes(s.toLowerCase())
      }
      onSelect={internalOnSelect}
      value={search}
      {...props}
    />
  )
}
