// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { notification, message } from 'antd'
import { filter, keys, snakeCase, some, startCase } from 'lodash'
import moment, { Moment } from 'moment'
import React from 'react'

/**
 * @param objWithOneKey an object with one and only one key
 * @returns extracted key
 * @throws if objWithOneKey doesn't have exactly one key
 * @description Helper function to extract the sole key from an object with only one key
 */
export const extractOnlyKey = (objWithOneKey: Record<string, any>) => {
  const objKeyArray = Object.keys(objWithOneKey)
  if (objKeyArray.length === 1) {
    return objKeyArray[0]
  }
  throw new Error('Object must have only one key')
}

/**
 * @param seedArray an array that contains seed data in the form of strings, arrays, or objects
 * @returns AntD Table columns prop
 * @description Helper function that generates AntD Table columns prop based on seedArray element type.
 * If string, title field will be startCase(ele). dataIndex & key fields will be snakeCase(ele)
 * If array of length 3, title set to first ele, dataIndex and key set to second ele, render set to third ele
 * If object with only 1 key:value pair, key and dataIndex fields set to object key and title set to object value
 * If object with many keys, it should be an AntD column object, return unprocessed seed
 */
export const createColumns = (
  seedArray: (
    | string
    | Record<string, string>
    | Record<string, any>
    | [string, string, (text: string, record?: any) => JSX.Element]
  )[],
) => {
  // simple text column
  return seedArray.map(seed => {
    // column with simple text values
    if (typeof seed === 'string') {
      return {
        title: startCase(seed),
        key: snakeCase(seed),
        dataIndex: snakeCase(seed),
      }
    }
    // column with a customRender (common use case)
    if (Array.isArray(seed) && seed.length === 3) {
      return {
        title: seed[0],
        key: seed[1],
        dataIndex: seed[1],
        render: seed[2],
      }
    }
    // At this point the seed type should either be an object with only one key:value pair (case 1)
    // Or it's a standard AntD column object (case 2)
    if (typeof seed === 'object' && Object.keys(seed).length === 1) {
      // column with customHeaderTitle
      const seedKey = extractOnlyKey(seed)
      let title = ''
      if (hasKey(seed, seedKey)) {
        title = seed[seedKey]
      }
      return {
        title,
        key: seedKey,
        dataIndex: seedKey,
      }
    }
    // case 2 is our default case, just return unprocessed seed ... sorta .. see below
    if (typeof seed === 'object' && Object.keys(seed).length > 1) {
      // actually we change default sort behavior to asc/desc (will be ignored if column is not sortable)
      return { ...seed, sortDirections: ['ascend', 'descend', 'ascend'] }
    }
    // If we are here, malformed seedArray, throw error
    throw new Error('seedArray malformed. Refer to method doc')
  })
}

/**
 * @param entities table data array to shape
 * @param entityType type of data; required to determine which keys to extract from entities and how to shape dataSource
 * @returns AntD Table dataSource prop
 * @description Helper function that generates AntD dataSource prop based on entity type
 */
export const createResourceDataSource = (entities: any, entityType: any) => {
  return entities.map((entity: any) => {
    // need to rename public field since public is a reserved keyword in JS
    const { pk, title, description, public: p, slug } = entity
    const commonFields = {
      key: pk,
      title,
      description,
      public: p,
      slug,
    }
    if (entityType === 'resourceGroups') {
      return commonFields
    }
    if (entityType === 'resources') {
      const { resource_group_title, url, is_stock, view_count } = entity
      return {
        ...commonFields,
        resource_group: resource_group_title,
        url,
        is_stock,
        view_count,
      }
    }
    // Something went wrong if we are here, throw error
    throw new Error('Entity type error')
  })
}

/**
 * @param description {string} description of error
 * @param top {number} distance from top of viewport ; defaults to 60px
 * @returns AntD notification.error component
 * @description Helper function that provides user with error feedback
 */
export const handleError = (description: string, top = 60) => {
  notification.error({ message: 'Error:', top, description })
}

/**
 * @param description {string} description of success
 * @param top {number} distance from top of viewport ; defaults to 60px
 * @returns AntD notification.success component
 * @description Helper function that provides user with success feedback
 */
export const handleSuccess = (description: string, top = 60) => {
  notification.success({ message: 'Success:', top, description })
}

// Disables submit button if form errors exist
/**
 * @param fieldsError return Error object from AntD getFieldsError()
 * @returns {boolean}
 * @description Evaluates all decorated input fields for client-side errors
 */
export const hasErrors = (fieldsError: Record<string, any>) => {
  return some(Object.values(fieldsError), Boolean)
}

/**
 * Helper function to enable using strings to index objects in typescript
 * @param obj target object we are validating key for
 * @param key `keyof any` is short for "string | number | symbol"
 */
export function hasKey<O>(obj: O, key: keyof any): key is keyof O {
  return key in obj
}

/**
 * @param date {Moment}
 * @param time {Moment}
 * @returns datetime {string} moment(datetime).toISOString()
 */
export const mergeDateAndTime = (date: Moment, time: Moment) => {
  return moment(date).set({ hour: time.hour(), minute: time.minute(), second: time.second() }).toISOString()
}

/**
 *  @description Helper function that enables creating a context with no upfront value
 * without having to undefined check all the time
 */
export function createCtx<A>() {
  const ctx = React.createContext<A | undefined>(undefined)
  function useCtx() {
    const c = React.useContext(ctx)
    if (!c) throw new Error('useCtx must be inside a Provider with a value')
    return c
  }
  return [useCtx, ctx.Provider] as const // make TypeScript infer a tuple, not an array of union types
}

/**
 * Helper function returns reverse enum keys (i.e. a list of integer strings)
 * @param enums - a *Numeric* enum
 */
export const reverseEnumKeys = (enums: any) => filter(keys(enums), (ele: string) => Number(ele) >= 0)

/**
 * Compare function to order strings alphabetically.
 * If either value is falsy place at the end of line
 */
export const sortString = (stringA: string, stringB: string) => {
  if (stringA && stringB) {
    return stringA.toLowerCase() < stringB.toLowerCase() ? -1 : 1
  }
  return -1
}

// Comparer function for sorting booleans
export const sortBoolean = (x: boolean, y: boolean) => {
  if (x === y) return 0
  return x ? -1 : 1
}

// Comparer function for sorting date strings that can be null
export const sortNullishDateStrings = (x: string | null, y: string | null) => {
  if (x && !y) return 1
  if (y && !x) return -1
  return moment(x ?? '').diff(moment(y ?? ''))
}

type Person = {
  first_name: string
  last_name: string
}
/**
 * Helper function to generate full name.
 * If first_name is defined and last_name is undefined, returns only first_name
 * If first_name is undefined, returns empty string
 */
export const getFullName = (person?: Person) => {
  if (person?.first_name && person?.last_name) {
    return `${person.first_name} ${person.last_name}`
  }
  if (person?.first_name && !person?.last_name) {
    return person.first_name
  }
  return ''
}

export const pluralize = (word: string, num: number) => (num !== 1 ? `${word}s` : word)

export enum TagColors {
  // AntD preset colors
  magenta = 'magenta',
  red = 'red',
  volcano = 'volcano',
  orange = 'orange',
  gold = 'gold',
  lime = 'lime',
  green = 'green',
  cyan = 'cyan',
  blue = 'blue',
  geekblue = 'geekblue',
  purple = 'purple',
  // AntD status color
  success = 'success',
  processing = 'processing',
  error = 'error',
  default = 'default',
  warning = 'warning',
  // Platform colors
  yellow = '#ffc927',
  darkBlue = '#293a68',
  lightBlue = '#04acec',
}

export const PROGRAM_ADVISORS = [
  'Niki LeBlanc',
  'Patti Winkel',
  'Cortney Flint',
  // 'Lauren Ogden',
  'Jaclyn Muralla',
  'Andrea Johnson',
  'Jennifer Douglas',
  'David Martinsen',
]
/**
 * @param content {string} error message content
 * @param top {number} distance from top of viewport ; defaults to 40px
 * @param top {number} duration in seconds; defaults to 4 seconds
 * @returns AntD message.error component
 * @description Helper function that provides user with error feedback
 */
export const messageError = (content: string, top = 10, duration = 4) => {
  message.config({ top })
  message.error({ content, top, duration })
}

/**
 * @param content {string} success message content
 * @param top {number} distance from top of viewport ; defaults to 40px
 * @param top {number} duration in seconds; defaults to 4 seconds
 * @returns AntD message.error component
 * @description Helper function that provides user with error feedback
 */
export const messageSuccess = (content: string, top = 10, duration = 4) => {
  message.config({ top })
  message.success({ content, top, duration })
}

export const truncateString = (str: string, num: number) => {
  if (str.length > num) {
    return str.slice(0, num) + "...";
  } else {
    return str;
  }
}