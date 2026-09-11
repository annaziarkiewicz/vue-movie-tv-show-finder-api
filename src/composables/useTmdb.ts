import type {
    CoverColor,
    MediaType,
    MovieTvShow,
    TmdbMovieTvShowApi
} from '@/types/movieTvShowFinder'

const apiUrl = 'https://api.themoviedb.org/3'
const coverColors: CoverColor[] = ['mint', 'navy', 'rose']
const imageUrl = 'https://image.tmdb.org/t/p/w500'

export const useTmdb = (apiKey: string) => {
    const fetchJson = async <T>(
        path: string,
        signal: AbortSignal
    ): Promise<T> => {
        const separator = path.includes('?') ? '&' : '?'
        const response = await fetch(
            `${apiUrl}${path}${separator}api_key=${apiKey}`,
            {
                signal
            }
        )
        const body = await response.json()

        if (!response.ok) {
            throw body
        }

        return body
    }

    const getErrorMessage = (caughtError: unknown) => {
        if (caughtError instanceof Error) {
            return caughtError.message
        }

        if (caughtError && typeof caughtError === 'object') {
            const errorObject = caughtError as Record<string, unknown>

            if (typeof errorObject.status_message === 'string') {
                return errorObject.status_message
            }

            const errorEntry = Object.entries(errorObject)[0]

            if (errorEntry) {
                const [key, value] = errorEntry

                return `${key}: ${String(value)}`
            }
        }

        return 'Unknown error.'
    }

    const getImage = (path: string | null) => {
        return path ? `${imageUrl}${path}` : null
    }

    const getCoverColor = (title: string): CoverColor => {
        const value = [...title].reduce((sum, character) => {
            return sum + character.charCodeAt(0)
        }, 0)

        return coverColors[value % coverColors.length] ?? 'mint'
    }

    const getYear = (date?: string) => {
        if (!date) {
            return null
        }

        const year = Number(date.slice(0, 4))

        return Number.isNaN(year) ? null : year
    }

    const isAbortError = (caughtError: unknown) => {
        return (
            caughtError instanceof Error
            && caughtError.name === 'AbortError'
        )
    }

    const mapMovieTvShow = (
        item: TmdbMovieTvShowApi,
        type: MediaType
    ): MovieTvShow => {
        const title = type === 'movie'
            ? item.title ?? item.original_title ?? ''
            : item.name ?? item.original_name ?? ''
        const genreIds = 'genre_ids' in item
            ? item.genre_ids
            : item.genres.map((genre) => {
                return genre.id
            })

        return {
            coverColor: getCoverColor(title),
            genreIds,
            id: item.id,
            image: getImage(item.poster_path),
            overview: item.overview ?? '',
            popularity: item.popularity ?? 0,
            rating: item.vote_average ?? 0,
            title,
            type,
            voteCount: item.vote_count ?? 0,
            year: getYear(
                type === 'movie'
                    ? item.release_date
                    : item.first_air_date
            )
        }
    }

    return {
        fetchJson,
        getCoverColor,
        getErrorMessage,
        getImage,
        isAbortError,
        mapMovieTvShow
    }
}