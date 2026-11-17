export type MediaType = 'movie' | 'tv'

export type SearchType = 'movies' | 'series' | 'people'

export interface TmdbGenreApi {
    id: number
    name: string
}

export interface TmdbCastApi {
    character: string
    id: number
    name: string
    order: number
    profile_path: string | null
}

export interface TmdbCreditsApi {
    cast: TmdbCastApi[]
}

export interface TmdbSearchResultApi {
    first_air_date?: string
    genre_ids: number[]
    id: number
    name?: string
    original_name?: string
    original_title?: string
    overview: string
    popularity: number
    poster_path: string | null
    release_date?: string
    title?: string
    vote_average: number
    vote_count: number
}

export interface TmdbSearchApi {
    page: number
    results: TmdbSearchResultApi[]
    total_pages: number
    total_results: number
}

export interface TmdbPersonDetailsApi {
    id: number
    known_for_department?: string
    name: string
    profile_path: string | null
}

export interface TmdbPersonSearchResultApi extends TmdbPersonDetailsApi {
    popularity: number
}

export interface TmdbPersonSearchApi {
    page: number
    results: TmdbPersonSearchResultApi[]
    total_pages: number
    total_results: number
}

export interface TmdbCombinedCreditApi {
    character?: string
    department?: string
    first_air_date?: string
    genre_ids: number[]
    id: number
    job?: string
    media_type: MediaType
    name?: string
    original_name?: string
    original_title?: string
    overview?: string
    popularity?: number
    poster_path: string | null
    release_date?: string
    title?: string
    vote_average?: number
    vote_count?: number
}

export interface TmdbCombinedCreditsApi {
    cast: TmdbCombinedCreditApi[]
    crew: TmdbCombinedCreditApi[]
}

export interface TmdbDetailsApi {
    episode_run_time?: number[]
    first_air_date?: string
    genres: TmdbGenreApi[]
    id: number
    name?: string
    number_of_episodes?: number
    number_of_seasons?: number
    original_name?: string
    original_title?: string
    overview: string
    popularity?: number
    poster_path: string | null
    release_date?: string
    runtime?: number | null
    status?: string
    title?: string
    vote_average: number
    vote_count: number
}

export interface CastMember {
    avatar: string | null
    character: string
    id: number
    name: string
}

export interface MovieTvShow {
    coverColor: CoverColor
    genreIds: number[]
    id: number
    image: string | null
    overview: string
    popularity: number
    rating: number
    title: string
    type: MediaType
    voteCount: number
    year: number | null
}

export interface MovieTvShowDetails extends MovieTvShow {
    cast: CastMember[]
    episodes: number | null
    genres: string[]
    runtime: number | null
    seasons: number | null
    status: string | null
}

export type TmdbMovieTvShowApi =
    | TmdbCombinedCreditApi
    | TmdbDetailsApi
    | TmdbSearchResultApi

export interface PersonSuggestion {
    department: string | null
    id: number
    image: string | null
    name: string
}

export interface MovieTvShowSearchUrlState {
    page: number
    query: string
    type: SearchType
}

export interface MovieTvShowUrlState {
    id: number
    title: string
    type: MediaType
}

export type CoverColor = 'mint' | 'navy' | 'rose'

export interface WelcomeItem {
    id: number
    image: string
    name: string
}

export interface SearchOutcome {
    currentPage: number
    moviesTvShows: MovieTvShow[]
    noResultsMessage?: string
    peopleSuggestions: PersonSuggestion[]
    selectedPerson: PersonSuggestion | null
    totalPages: number
}

export interface SearchTypeOption {
    label: string
    value: SearchType
}