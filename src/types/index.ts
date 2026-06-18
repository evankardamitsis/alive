export type PostStatus = "draft" | "published" | "scheduled" | "archived"

export type UserRole = "admin" | "editor" | "contributor"

export interface Author {
  id: string
  name: string
  slug: string
  bio: string | null
  avatar_url: string | null
  email: string
  role: UserRole
  social_links: Record<string, string>
  created_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  color: string | null
  parent_id: string | null
}

export interface Tag {
  id: string
  name: string
  slug: string
}

export interface Post {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string // HTML from Tiptap
  cover_image_url: string | null
  cover_image_alt: string | null
  status: PostStatus
  featured: boolean
  is_hero: boolean
  author_id: string
  category_id: string
  published_at: string | null
  scheduled_at: string | null
  created_at: string
  updated_at: string
  // relations
  author?: Author
  category?: Category
  tags?: Tag[]
  read_time_minutes?: number
}

export interface PostWithRelations extends Post {
  author: Author
  category: Category
  tags: Tag[]
}

export interface Playlist {
  id: string
  user_id: string
  name: string
  is_public: boolean
  created_at: string
}

export interface PlaylistItem {
  id: string
  playlist_id: string
  spotify_track_id: string
  title: string
  artist: string
  added_at: string
}
