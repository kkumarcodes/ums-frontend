// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { shallowEqual, useSelector } from 'react-redux'
import { RootState } from 'store/rootReducer'

// ref: https://stackoverflow.com/questions/57301439/how-to-make-a-function-inherit-the-return-type-of-the-returned-function
export function useShallowSelector<TReturn>(selector: (state: RootState) => TReturn) {
  return useSelector<RootState, TReturn>(selector, shallowEqual)
}
