import { createCtx } from 'components/administrator'

export type SearchContextType = {
  searchText: string
  setSearchText: React.Dispatch<React.SetStateAction<string>>
}

export const [useSearchCtx, SearchProvider] = createCtx<SearchContextType>()
