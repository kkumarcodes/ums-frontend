import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { each, findIndex } from 'lodash'
import { CloseModalPayload, DisplayStateType, ModalVisibility, ShowModalPayload } from './displayTypes'

const initialState: DisplayStateType = {
  modals: [],
  activeModalIndex: -1,
}
export type AlterModalVisibilityPayload = {
  visibility: ModalVisibility
  state?: object
  idx?: number
  title: string
}

const displaySlice = createSlice({
  name: 'display',
  initialState,
  reducers: {
    showModal(state: DisplayStateType, action: PayloadAction<ShowModalPayload>) {
      const newIdx = state.modals.length
      state.modals.push({
        modalType: action.payload.modal,
        modalProps: action.payload.props,
        state: {},
        visibility: ModalVisibility.Visible,
      })
      state.activeModalIndex = newIdx
    },
    // Removes modal from modal state entirely. To hide or minimize modal, use alterModalVisibility
    closeModal(state: DisplayStateType, action?: PayloadAction<CloseModalPayload | void>) {
      state.modals.splice(state.activeModalIndex, 1)
      state.activeModalIndex = findIndex(state.modals, m => m.visibility === ModalVisibility.Visible)
    },
    // Change the visibility of a modal in state.modals. Does not create a new or destroy an existing modal
    // If we're making a hidden/minimized modal visible and there is already a visible modal, that modal that is already
    // visible will adopt the old visibility of the newly visible modal (either hidden or minimized)
    alterModalVisibility(state: DisplayStateType, action: PayloadAction<AlterModalVisibilityPayload>) {
      const idx = action.payload.idx === undefined ? state.activeModalIndex : action.payload.idx
      const modal = state.modals[idx]
      if (!modal) console.error('Attempting to alter visibility for modal that does not exist')
      const oldVisibility = modal.visibility
      modal.visibility = action.payload.visibility
      modal.state = action.payload.state || modal.state
      modal.title = action.payload.title

      if (modal.visibility === ModalVisibility.Visible) {
        each(state.modals, (m, idx) => {
          if (idx !== action.payload.idx && m.visibility === ModalVisibility.Visible) {
            m.visibility = oldVisibility
          }
        })
      }
      state.activeModalIndex = findIndex(state.modals, m => m.visibility === ModalVisibility.Visible)
    },
    // Make previous hidden (not minimized) modal visible, and hide the active modal
    // Returns an error if there is no previous hidden modal
    modalBack(state: DisplayStateType, action: PayloadAction) {
      const newIdx = findIndex(state.modals, m => m.visibility === ModalVisibility.Hidden)
      if (newIdx === -1 || newIdx === state.activeModalIndex) {
        console.error("Can't dispatch display/back action -- no modal to go back to!")
      }
      state.modals[state.activeModalIndex].visibility = ModalVisibility.Hidden
      state.activeModalIndex = newIdx
    },
    modalForward(state: DisplayStateType, action: PayloadAction) {
      const newIdx = findIndex(state.modals, m => m.visibility === ModalVisibility.Hidden, state.activeModalIndex + 1)
      if (newIdx === -1 || newIdx === state.activeModalIndex) {
        console.error("Can't dispatch display/forward action -- no modal to go forward to!")
      }
      state.modals[state.activeModalIndex].visibility = ModalVisibility.Hidden
      state.activeModalIndex = newIdx
    },
  },
})

export const { showModal, closeModal, alterModalVisibility, modalBack, modalForward } = displaySlice.actions
export default displaySlice.reducer
