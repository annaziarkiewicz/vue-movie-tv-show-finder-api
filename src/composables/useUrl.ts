import { ref } from 'vue'

import type {
    MovieTvShowSearchUrlState,
    MovieTvShowUrlState
} from '@/types/movieTvShowFinder'

export const useUrl = () => {
    const skipNextPopstateLoad = ref(false)
    const urlChangeId = ref(0)

    const invalidateUrlChange = () => {
        urlChangeId.value += 1
    }

    const getSearchStateFromUrl = (): MovieTvShowSearchUrlState => {
        const searchParams = new URLSearchParams(window.location.search)
        const person = searchParams.get('person')?.trim() ?? ''
        const requestedType = searchParams.get('type')
        const requestedPage = Number(searchParams.get('page'))
        const page = Number.isSafeInteger(requestedPage)
            && requestedPage > 0
            && requestedPage <= 500
            ? requestedPage
            : 1

        if (person || searchParams.has('personId')) {
            return {
                page,
                query: person,
                type: 'people'
            }
        }

        return {
            page,
            query: searchParams.get('search')?.trim() ?? '',
            type: requestedType === 'series'
                ? 'series'
                : requestedType === 'people'
                    ? 'people'
                    : 'movies'
        }
    }

    const getMovieTvShowStateFromUrl = (): MovieTvShowUrlState | null => {
        const searchParams = new URLSearchParams(window.location.search)
        const movieId = Number(searchParams.get('movieId'))
        const showId = Number(searchParams.get('showId'))

        if (searchParams.has('movieId')) {
            return {
                id: movieId,
                title: searchParams.get('movie')?.trim() ?? '',
                type: 'movie'
            }
        }

        if (searchParams.has('showId')) {
            return {
                id: showId,
                title: searchParams.get('show')?.trim() ?? '',
                type: 'tv'
            }
        }

        return null
    }

    const getUrlParamsWithoutMovieTvShow = () => {
        const params = Object.fromEntries(
            new URLSearchParams(window.location.search)
        )

        delete params.movie
        delete params.movieId
        delete params.show
        delete params.showId

        return params
    }

    const updateUrl = (
        params: Record<string, string | null>,
        replaceCurrentEntry = false,
        state: Record<string, boolean> = {}
    ) => {
        invalidateUrlChange()

        const { page, ...searchParams } = params
        const orderedParams = {
            search: searchParams.search,
            person: searchParams.person,
            type: searchParams.type,
            ...searchParams,
            page
        }
        const url = new URL(window.location.href)

        url.search = ''

        Object.entries(orderedParams).forEach(([key, value]) => {
            if (value) {
                url.searchParams.set(key, value)
            } else {
                url.searchParams.delete(key)
            }
        })

        if (replaceCurrentEntry) {
            window.history.replaceState(state, '', url)
            return
        }

        window.history.pushState(state, '', url)
    }

    return {
        skipNextPopstateLoad,
        urlChangeId,
        getMovieTvShowStateFromUrl,
        getSearchStateFromUrl,
        getUrlParamsWithoutMovieTvShow,
        invalidateUrlChange,
        updateUrl
    }
}