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
  /** When true, author name/avatar appear on the public site */
  show_on_site: boolean
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

export type PromoBannerFormat = "standard" | "interstitial" | "prestitial" | "special_boost"

export type PromoBannerCategoryScope = "none" | "all" | "selected"

/** Article pages: none, all, or only articles in the banner's targeted categories */
export type PromoBannerArticleScope = "none" | "all" | "categories"

/** desktop = 768px and up, mobile = below 768px */
export type PromoBannerDevice = "all" | "desktop" | "mobile"

/** Spots a standard banner may use on a page */
export type PromoSpot = "rail" | "feed" | "article" | "sidebar" | "after_article"

export interface PromoBanner {
  id: string
  /** Internal name, shown only in admin */
  name: string
  /** Key visual — used on every screen when no mobile visual is set */
  image_url: string
  /** Intrinsic size of the key visual (lets the site reserve space and pick the right srcset) */
  image_width: number | null
  image_height: number | null
  /** Optional mobile-specific visual */
  mobile_image_url: string | null
  mobile_image_width: number | null
  mobile_image_height: number | null
  alt_text: string | null
  destination_url: string
  format: PromoBannerFormat
  starts_at: string
  ends_at: string
  show_on_home: boolean
  category_scope: PromoBannerCategoryScope
  category_ids: string[]
  article_scope: PromoBannerArticleScope
  device: PromoBannerDevice
  /** Standard banners only: which spots it may use (at least one) */
  placements: PromoSpot[]
  /** Show once in each allowed spot on a page, instead of once per page */
  repeat_in_spots: boolean
  /** The banner stops showing once either total is reached (null = no cap) */
  max_impressions: number | null
  max_clicks: number | null
  /** Higher shows first */
  priority: number
  /** Share among banners of the same priority: 2 = shown about twice as often as 1 */
  weight: number
  is_active: boolean
  created_at: string
  updated_at: string
}
