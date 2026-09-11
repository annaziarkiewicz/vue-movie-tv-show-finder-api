import { ref } from 'vue'

import { useTmdb } from '@/composables/useTmdb'

import type {
    MediaType,
    MovieTvShow,
    MovieTvShowDetails,
    TmdbCreditsApi,
    TmdbDetailsApi
} from '@/types/movieTvShowFinder'

export const useDetails = (apiKey: string) => {
    const activeMovieTvShow = ref<MovieTvShow | null>(null)
    const details = ref<MovieTvShowDetails | null>(null)
    const detailsError = ref<string | null>(null)
    const detailsLoading = ref(false)
    const detailsRetryEnabled = ref(true)
    const detailsVisible = ref(false)

    let detailsRequestController: AbortController | null = null

    const {
        fetchJson,
        getCoverColor,
        getErrorMessage,
        getImage,
        isAbortError,
        mapMovieTvShow
    } = useTmdb(apiKey)

    const mapDetailsToMovieTvShowDetails = (
        item: TmdbDetailsApi,
        credits: TmdbCreditsApi,
        movieTvShow: MovieTvShow
    ): MovieTvShowDetails => {
        const isMovie = movieTvShow.type === 'movie'

        return {
            ...movieTvShow,
            cast: [...credits.cast]
                .sort((memberA, memberB) => {
                    return memberA.order - memberB.order
                })
                .slice(0, 12)
                .map((member) => ({
                    avatar: getImage(member.profile_path),
                    character: member.character,
                    id: member.id,
                    name: member.name
                })),
            episodes: isMovie
                ? null
                : item.number_of_episodes ?? null,
            genres: item.genres.map((genre) => {
                return genre.name
            }),
            runtime: isMovie
                ? item.runtime ?? null
                : item.episode_run_time?.[0] ?? null,
            seasons: isMovie
                ? null
                : item.number_of_seasons ?? null,
            status: item.status ?? null
        }
    }

    const createPlaceholderMovieTvShow = (
        id: number,
        type: MediaType,
        title = ''
    ): MovieTvShow => {
        return {
            coverColor: getCoverColor(title),
            genreIds: [],
            id,
            image: null,
            overview: '',
            popularity: 0,
            rating: 0,
            title,
            type,
            voteCount: 0,
            year: null
        }
    }

    const resetDetails = () => {
        detailsRequestController?.abort()
        detailsRequestController = null

        activeMovieTvShow.value = null
        details.value = null
        detailsError.value = null
        detailsLoading.value = false
        detailsRetryEnabled.value = true
        detailsVisible.value = false
    }

    const loadMovieTvShowDetails = async (
        movieTvShow: MovieTvShow
    ) => {
        detailsRequestController?.abort()
        detailsRequestController = null
        details.value = null
        detailsError.value = null
        detailsLoading.value = false
        detailsRetryEnabled.value = true

        if (!Number.isSafeInteger(movieTvShow.id) || movieTvShow.id <= 0) {
            activeMovieTvShow.value = createPlaceholderMovieTvShow(
                movieTvShow.id,
                movieTvShow.type
            )
            detailsError.value = 'Invalid id: The pre-requisite id is invalid or not found.'
            detailsRetryEnabled.value = false
            return
        }

        const requestController = new AbortController()

        detailsRequestController = requestController
        detailsLoading.value = true

        try {
            const [detailsData, creditsData] = await Promise.all([
                fetchJson<TmdbDetailsApi>(
                    `/${movieTvShow.type}/${movieTvShow.id}?language=en-US`,
                    requestController.signal
                ),
                fetchJson<TmdbCreditsApi>(
                    `/${movieTvShow.type}/${movieTvShow.id}/credits?language=en-US`,
                    requestController.signal
                )
            ])

            if (detailsRequestController !== requestController) {
                return
            }

            const mappedMovieTvShow = mapMovieTvShow(
                detailsData,
                movieTvShow.type
            )

            activeMovieTvShow.value = mappedMovieTvShow
            details.value = mapDetailsToMovieTvShowDetails(
                detailsData,
                creditsData,
                mappedMovieTvShow
            )
        } catch (caughtError) {
            if (
                isAbortError(caughtError)
                || detailsRequestController !== requestController
            ) {
                return
            }

            const errorCode = caughtError && typeof caughtError === 'object'
                ? (caughtError as Record<string, unknown>).status_code
                : null

            if (errorCode === 6 || errorCode === 34 || errorCode === 44) {
                activeMovieTvShow.value = createPlaceholderMovieTvShow(
                    movieTvShow.id,
                    movieTvShow.type
                )
                detailsRetryEnabled.value = false
            }

            detailsError.value = getErrorMessage(caughtError)
        } finally {
            if (detailsRequestController === requestController) {
                detailsLoading.value = false
                detailsRequestController = null
            }
        }
    }

    const showMovieTvShowDetails = async (
        movieTvShow: MovieTvShow
    ) => {
        activeMovieTvShow.value = movieTvShow
        detailsVisible.value = true

        await loadMovieTvShowDetails(movieTvShow)
    }

    const showMovieTvShowDetailsById = async (
        id: number,
        type: MediaType,
        title = ''
    ) => {
        const movieTvShow = createPlaceholderMovieTvShow(id, type, title)

        activeMovieTvShow.value = movieTvShow
        detailsVisible.value = true

        await loadMovieTvShowDetails(movieTvShow)
    }

    return {
        activeMovieTvShow,
        details,
        detailsError,
        detailsLoading,
        detailsRetryEnabled,
        detailsVisible,
        loadMovieTvShowDetails,
        resetDetails,
        showMovieTvShowDetails,
        showMovieTvShowDetailsById
    }
}