import type { MovieTvShow } from '@/types/movieTvShowFinder'

const documentaryGenreId = 99
const newsGenreId = 10763
const realityShowGenreId = 10764
const talkShowGenreId = 10767

export const useMediaTypeLabel = () => {
    const getMediaTypeLabel = (movieTvShow: MovieTvShow) => {
        if (movieTvShow.type === 'movie') {
            return 'Movie'
        }

        if (movieTvShow.genreIds.includes(talkShowGenreId)) {
            return 'Talk Show'
        }

        if (movieTvShow.genreIds.includes(realityShowGenreId)) {
            return 'Reality Show'
        }

        if (movieTvShow.genreIds.includes(newsGenreId)) {
            return 'News'
        }

        if (movieTvShow.genreIds.includes(documentaryGenreId)) {
            return 'Documentary'
        }

        return 'Series'
    }

    return {
        getMediaTypeLabel
    }
}