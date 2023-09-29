// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React from 'react'
import Highlighter from 'react-highlight-words'
import { Location } from 'store/tutoring/tutoringTypes'
import { CommonUser } from 'store/user/usersTypes'

export const renderHighlighter = (text = '', search = '') => (
  <Highlighter
    highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
    searchWords={[search]}
    autoEscape
    textToHighlight={text}
  />
)

export const renderLocationDetails = ({
  address,
  address_line_two,
  city,
  state,
  zip_code,
  country,
}: Partial<CommonUser>) => (
  <address>
    <div>{address} </div>
    {address_line_two && <div>{address_line_two} </div>}
    {city && state && zip_code && (
      <>
        <div>
          {city}, {state} {zip_code.padStart(5, '0')}
        </div>
        {country && <div>{country}</div>}
      </>
    )}
  </address>
)

export const renderAddressDetails = ({ address, address_line_two, city, state, zip_code }: Location) => (
  <address>
    <div>{address}</div>
    {address_line_two && <div>{address_line_two}</div>}
    {city && state && zip_code && (
      <div>
        {city}, {state} {zip_code.padStart(5, '0')}
      </div>
    )}
  </address>
)
