export interface Resource {
  slug: string
  pk: number
  title: string
  description: string
  resource_file: string
  link: string
  created_by: number
  resource_group: number | null
  resource_group_title: string | null
  is_stock: boolean
  archived?: boolean
  public?: boolean
  url: string
  view_count: number
  cap: boolean
  cas: boolean
  vimeo_id: string // Read only
}

export interface PostResource extends Resource {
  file_upload?: string | null
}

export interface ResourceGroup {
  pk: number
  slug: string
  title: string
  description: string
  public: boolean
}

export type ResourceState = {
  resources: {
    [pk: number]: Resource
  }
  resourceGroups: {
    [pk: number]: ResourceGroup
  }
}
