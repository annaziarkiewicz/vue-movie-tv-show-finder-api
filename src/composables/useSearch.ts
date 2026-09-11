import { computed, ref } from 'vue'

import { useMediaTypeLabel } from '@/composables/useMediaTypeLabel'
import { useTmdb } from '@/composables/useTmdb'

import type {
    MovieTvShow,
    PersonSuggestion,
    SearchOutcome,
    SearchType,
    SearchTypeOption,
    TmdbCombinedCreditApi,
    TmdbCombinedCreditsApi,
    TmdbPersonDetailsApi,
    TmdbPersonSearchApi,
    TmdbSearchApi
} from '@/types/movieTvShowFinder'

type TitleSearchPage = {
    results: MovieTvShow[]
    totalPages: number
    totalResults: number
}

const resultsPerPage = 60

const searchTypeOptions: SearchTypeOption[] = [
    {
        label: 'Movies',
        value: 'movies'
    },
    {
        label: 'Series',
        value: 'series'
    },
    {
        label: 'People',
        value: 'people'
    }
]

export const useSearch = (apiKey: string) => {
    const alternativeSearchType = ref<'movies' | 'series' | null>(null)
    const currentPage = ref(1)
    const error = ref<string | null>(null)
    const loading = ref(false)
    const moviesTvShows = ref<MovieTvShow[]>([])
    const peopleSearchPage = ref(0)
    const peopleSearchTotalPages = ref(0)
    const peopleSuggestions = ref<PersonSuggestion[]>([])
    const peopleSuggestionsError = ref<string | null>(null)
    const peopleSuggestionsLoading = ref(false)
    const peopleSuggestionsTotal = ref(0)
    const query = ref('')
    const resultsLoading = ref(false)
    const searched = ref(false)
    const searchType = ref<SearchType>('movies')
    const totalPages = ref(0)

    let alternativeRequestController: AbortController | null = null
    let cachedAlternativePage: {
        data: TitleSearchPage
        query: string
        type: 'movie' | 'tv'
    } | null = null
    let cachedPerson: {
        moviesTvShows: MovieTvShow[]
        person: PersonSuggestion
    } | null = null
    let peopleRequestController: AbortController | null = null
    let peopleSearchQuery = ''
    let searchRequestController: AbortController | null = null

    const { getMediaTypeLabel } = useMediaTypeLabel()

    const {
        fetchJson,
        getErrorMessage,
        getImage,
        isAbortError,
        mapMovieTvShow
    } = useTmdb(apiKey)

    const peopleSuggestionsHasMore = computed(() => {
        return peopleSearchPage.value < peopleSearchTotalPages.value
            && peopleSuggestions.value.length < peopleSuggestionsTotal.value
    })

    const personSuggestionOptions = computed(() => {
        return peopleSuggestions.value.map((person) => {
            return {
                description: person.department ?? undefined,
                id: person.id,
                image: person.image ?? undefined,
                label: person.name
            }
        })
    })

    const searchPlaceholder = computed(() => {
        return searchType.value === 'people'
            ? 'Search for an actor, director or other person...'
            : searchType.value === 'series'
                ? 'Search for your favorite series...'
                : 'Search for your favorite movie...'
    })

    const isSelfAppearance = (item: TmdbCombinedCreditApi) => {
        const character = item.character?.trim().toLowerCase() ?? ''

        return character.includes('self')
    }

    const mapCreditToMovieTvShow = (
        item: TmdbCombinedCreditApi
    ): MovieTvShow | null => {
        if (item.media_type !== 'movie' && item.media_type !== 'tv') {
            return null
        }

        return mapMovieTvShow(item, item.media_type)
    }

    const mapPersonToSuggestion = (
        person: TmdbPersonDetailsApi
    ): PersonSuggestion => {
        return {
            department: person.known_for_department ?? null,
            id: person.id,
            image: getImage(person.profile_path),
            name: person.name
        }
    }

    const removeDuplicates = (results: MovieTvShow[]) => {
        const uniqueMoviesTvShows = new Map<string, MovieTvShow>()

        results.forEach((item) => {
            uniqueMoviesTvShows.set(`${item.type}-${item.id}`, item)
        })

        return Array.from(uniqueMoviesTvShows.values())
    }

    const sortByYear = (
        itemA: MovieTvShow,
        itemB: MovieTvShow
    ) => {
        if (itemA.year === null && itemB.year === null) {
            return itemB.popularity - itemA.popularity
        }

        if (itemA.year === null) {
            return 1
        }

        if (itemB.year === null) {
            return -1
        }

        if (itemA.year !== itemB.year) {
            return itemB.year - itemA.year
        }

        return itemB.popularity - itemA.popularity
    }

    const loadTitlePage = async (
        type: 'movie' | 'tv',
        searchQuery: string,
        page: number,
        signal: AbortSignal
    ): Promise<TitleSearchPage> => {
        if (
            page === 1
            && cachedAlternativePage?.query === searchQuery
            && cachedAlternativePage.type === type
        ) {
            return cachedAlternativePage.data
        }

        const encodedQuery = encodeURIComponent(searchQuery)
        const data = await fetchJson<TmdbSearchApi>(
            `/search/${type}?query=${encodedQuery}&include_adult=false&language=en-US&page=${page}`,
            signal
        )

        if (!Array.isArray(data.results)) {
            throw new Error('Invalid search results.')
        }

        const results = data.results.filter((item) => {
            if (!item || !Number.isSafeInteger(item.id) || item.id <= 0) {
                return false
            }

            const title = type === 'movie'
                ? item.title ?? item.original_title
                : item.name ?? item.original_name

            return typeof title === 'string'
                && Boolean(title.trim())
                && Array.isArray(item.genre_ids)
        }).map((item) => {
            return mapMovieTvShow(item, type)
        })

        return {
            results,
            totalPages: Number.isSafeInteger(data.total_pages)
                ? Math.min(500, Math.max(0, data.total_pages))
                : 0,
            totalResults: Number.isSafeInteger(data.total_results)
                ? Math.min(10000, Math.max(0, data.total_results))
                : results.length
        }
    }

    const loadPersonCredits = async (
        person: PersonSuggestion,
        signal: AbortSignal
    ): Promise<MovieTvShow[]> => {
        const creditsData = await fetchJson<TmdbCombinedCreditsApi>(
            `/person/${person.id}/combined_credits?language=en-US`,
            signal
        )

        let credits: TmdbCombinedCreditApi[]

        if (person.department === 'Acting') {
            credits = creditsData.cast.filter((item) => {
                return !isSelfAppearance(item)
            })
        } else if (person.department) {
            credits = creditsData.crew.filter((item) => {
                return item.department === person.department
            })
        } else {
            credits = [
                ...creditsData.cast.filter((item) => {
                    return !isSelfAppearance(item)
                }),
                ...creditsData.crew
            ]
        }

        const results = credits
            .map(mapCreditToMovieTvShow)
            .filter((item): item is MovieTvShow => item !== null)
            .filter((item) => {
                return getMediaTypeLabel(item) !== 'Talk Show'
            })

        return removeDuplicates(results).sort(sortByYear)
    }

    const loadTitleResults = async (
        searchQuery: string,
        type: 'movies' | 'series',
        page: number,
        signal: AbortSignal
    ): Promise<SearchOutcome> => {
        const firstApiPage = (page - 1) * 3 + 1
        const apiPages = Array.from({ length: 3 }, (_, index) => {
            return firstApiPage + index
        }).filter((apiPage) => {
            const cachedTotalPages = cachedAlternativePage?.query === searchQuery
                && cachedAlternativePage.type === (type === 'movies' ? 'movie' : 'tv')
                ? cachedAlternativePage.data.totalPages
                : 500

            return apiPage <= Math.min(500, Math.max(1, cachedTotalPages))
        })

        if (!apiPages.length) {
            throw new Error('No results found on this page.')
        }

        const responses = await Promise.allSettled(apiPages.map((apiPage) => {
            return loadTitlePage(
                type === 'movies' ? 'movie' : 'tv',
                searchQuery,
                apiPage,
                signal
            )
        }))
        const successfulResponses = responses.filter((response) => {
            return response.status === 'fulfilled'
        })
        const results = removeDuplicates(successfulResponses.flatMap((response) => {
            return response.value.results
        }))
        const failedResponse = responses.find((response) => {
            return response.status === 'rejected'
        })
        const totalResults = Math.max(
            0,
            ...successfulResponses.map((response) => {
                return Math.min(response.value.totalResults, response.value.totalPages * 20)
            })
        )

        if (!results.length && failedResponse) {
            throw failedResponse.reason
        }

        return {
            currentPage: page,
            moviesTvShows: results,
            noResultsMessage: !results.length && !failedResponse && totalResults === 0 && page === 1
                ? type === 'movies' ? 'No movies found.' : 'No series found.'
                : undefined,
            peopleSuggestions: [],
            selectedPerson: null,
            totalPages: Math.ceil(totalResults / resultsPerPage)
        }
    }

    const loadPersonOutcome = async (
        person: PersonSuggestion,
        page: number,
        signal: AbortSignal
    ): Promise<SearchOutcome> => {
        const results = cachedPerson?.person.id === person.id
            ? cachedPerson.moviesTvShows
            : await loadPersonCredits(person, signal)
        const startIndex = (page - 1) * resultsPerPage

        if (!signal.aborted) {
            cachedPerson = {
                moviesTvShows: results,
                person
            }
        }

        return {
            currentPage: page,
            moviesTvShows: results.slice(startIndex, startIndex + resultsPerPage),
            peopleSuggestions: [],
            selectedPerson: person,
            totalPages: Math.ceil(results.length / resultsPerPage)
        }
    }

    const loadPeopleResults = async (
        searchQuery: string,
        page: number,
        signal: AbortSignal
    ): Promise<SearchOutcome> => {
        const encodedQuery = encodeURIComponent(searchQuery)

        const peopleData = await fetchJson<TmdbPersonSearchApi>(
            `/search/person?query=${encodedQuery}&include_adult=false&language=en-US&page=1`,
            signal
        )

        const people = peopleData.results.map(mapPersonToSuggestion)

        if (!signal.aborted) {
            peopleSearchPage.value = 1
            peopleSearchQuery = searchQuery
            peopleSearchTotalPages.value = peopleData.total_pages
            peopleSuggestionsTotal.value = peopleData.total_results
        }

        if (!people.length) {
            return {
                currentPage: page,
                moviesTvShows: [],
                noResultsMessage: 'No people found.',
                peopleSuggestions: [],
                selectedPerson: null,
                totalPages: 0
            }
        }

        if (people.length > 1 || peopleData.total_results > 1) {
            return {
                currentPage: page,
                moviesTvShows: [],
                peopleSuggestions: people,
                selectedPerson: null,
                totalPages: 0
            }
        }

        return loadPersonOutcome(people[0], page, signal)
    }

    const clearPeopleSuggestions = () => {
        peopleRequestController?.abort()
        peopleRequestController = null
        peopleSearchPage.value = 0
        peopleSearchQuery = ''
        peopleSearchTotalPages.value = 0
        peopleSuggestions.value = []
        peopleSuggestionsError.value = null
        peopleSuggestionsLoading.value = false
        peopleSuggestionsTotal.value = 0
    }

    const loadMorePeopleSuggestions = async () => {
        if (!peopleSuggestionsHasMore.value || peopleSuggestionsLoading.value) {
            return
        }

        const requestController = new AbortController()
        const nextPage = peopleSearchPage.value + 1
        const encodedQuery = encodeURIComponent(peopleSearchQuery)

        peopleRequestController = requestController
        peopleSuggestionsError.value = null
        peopleSuggestionsLoading.value = true

        try {
            const data = await fetchJson<TmdbPersonSearchApi>(
                `/search/person?query=${encodedQuery}&include_adult=false&language=en-US&page=${nextPage}`,
                requestController.signal
            )

            if (peopleRequestController !== requestController) {
                return
            }

            const people = data.results.map(mapPersonToSuggestion)
            const existingIds = new Set(peopleSuggestions.value.map((person) => person.id))

            peopleSuggestions.value = [
                ...peopleSuggestions.value,
                ...people.filter((person) => !existingIds.has(person.id))
            ]
            peopleSearchPage.value = nextPage
            peopleSearchTotalPages.value = data.total_pages
            peopleSuggestionsTotal.value = data.total_results
        } catch (caughtError) {
            if (
                isAbortError(caughtError)
                || peopleRequestController !== requestController
            ) {
                return
            }

            peopleSuggestionsError.value = getErrorMessage(caughtError)
        } finally {
            if (peopleRequestController === requestController) {
                peopleRequestController = null
                peopleSuggestionsLoading.value = false
            }
        }
    }

    const checkAlternativeSearch = async (
        searchQuery: string,
        type: 'movies' | 'series'
    ) => {
        const requestController = new AbortController()
        const alternativeType = type === 'movies' ? 'series' : 'movies'
        const mediaType = alternativeType === 'movies' ? 'movie' : 'tv'

        alternativeRequestController = requestController

        try {
            const data = await loadTitlePage(mediaType, searchQuery, 1, requestController.signal)

            if (alternativeRequestController !== requestController) {
                return
            }

            if (data.results.length) {
                cachedAlternativePage = {
                    data,
                    query: searchQuery,
                    type: mediaType
                }
                alternativeSearchType.value = alternativeType
            }
        } catch {
            return
        } finally {
            if (alternativeRequestController === requestController) {
                alternativeRequestController = null
            }
        }
    }

    const executeSearch = async (
        loadResults: (signal: AbortSignal) => Promise<SearchOutcome>,
        noResultsMessage: string,
        preserveCurrentContent = false
    ) => {
        searchRequestController?.abort()
        alternativeRequestController?.abort()
        alternativeRequestController = null
        alternativeSearchType.value = null

        const requestController = new AbortController()

        searchRequestController = requestController
        clearPeopleSuggestions()
        loading.value = true
        resultsLoading.value = !preserveCurrentContent

        try {
            const outcome = await loadResults(requestController.signal)

            if (searchRequestController !== requestController) {
                return null
            }

            if (outcome.peopleSuggestions.length) {
                peopleSuggestions.value = outcome.peopleSuggestions
                return outcome
            }

            currentPage.value = outcome.currentPage
            moviesTvShows.value = outcome.moviesTvShows
            totalPages.value = outcome.totalPages
            error.value = null
            searched.value = true

            if (!moviesTvShows.value.length) {
                error.value = outcome.noResultsMessage ?? noResultsMessage
            }

            return outcome
        } catch (caughtError) {
            if (
                isAbortError(caughtError)
                || searchRequestController !== requestController
            ) {
                return null
            }

            moviesTvShows.value = []
            peopleSuggestions.value = []
            totalPages.value = 0
            error.value = getErrorMessage(caughtError)
            searched.value = true

            return null
        } finally {
            if (searchRequestController === requestController) {
                loading.value = false
                resultsLoading.value = false
                searchRequestController = null
            }
        }
    }

    const cancelSearch = () => {
        const cancelledResultsSearch = resultsLoading.value

        peopleRequestController?.abort()
        peopleRequestController = null
        peopleSuggestionsLoading.value = false
        alternativeRequestController?.abort()
        alternativeRequestController = null
        alternativeSearchType.value = null
        searchRequestController?.abort()
        searchRequestController = null

        loading.value = false
        resultsLoading.value = false

        if (cancelledResultsSearch) {
            currentPage.value = 1
            moviesTvShows.value = []
            totalPages.value = 0
            error.value = null
            searched.value = false
        }

        return cancelledResultsSearch
    }

    const resetSearch = () => {
        cancelSearch()

        clearPeopleSuggestions()
        currentPage.value = 1
        moviesTvShows.value = []
        peopleSuggestions.value = []
        totalPages.value = 0
        error.value = null
        searched.value = false
    }

    const loadPersonMoviesTvShowsById = (
        id: number,
        page = 1
    ) => {
        return executeSearch(
            async (signal) => {
                if (!Number.isSafeInteger(id) || id <= 0) {
                    throw new Error('Invalid id: The pre-requisite id is invalid or not found.')
                }

                if (cachedPerson?.person.id === id) {
                    return loadPersonOutcome(cachedPerson.person, page, signal)
                }

                const person = await fetchJson<TmdbPersonDetailsApi>(
                    `/person/${id}?language=en-US`,
                    signal
                )

                return loadPersonOutcome(mapPersonToSuggestion(person), page, signal)
            },
            'No movies or TV shows found for this person.'
        )
    }

    const loadMoviesTvShows = async (
        searchQuery: string,
        type: SearchType,
        page = 1
    ) => {
        const noResultsMessage = type === 'people'
            ? 'No movies or TV shows found for this person.'
            : type === 'series'
                ? 'No series found.'
                : 'No movies found.'

        const outcome = await executeSearch(
            (signal) => {
                return type === 'people'
                    ? loadPeopleResults(searchQuery, page, signal)
                    : loadTitleResults(searchQuery, type, page, signal)
            },
            noResultsMessage,
            type === 'people'
        )

        if (outcome?.noResultsMessage && type !== 'people') {
            void checkAlternativeSearch(searchQuery, type)
        }

        return outcome
    }

    const loadPersonMoviesTvShows = (
        person: PersonSuggestion,
        page = 1
    ) => {
        return executeSearch(
            async (signal) => {
                if (!Number.isSafeInteger(person.id) || person.id <= 0) {
                    throw new Error('Invalid id: The pre-requisite id is invalid or not found.')
                }

                return loadPersonOutcome(person, page, signal)
            },
            'No movies or TV shows found for this person.'
        )
    }

    return {
        alternativeSearchType,
        currentPage,
        error,
        loading,
        moviesTvShows,
        peopleSuggestions,
        peopleSuggestionsError,
        peopleSuggestionsHasMore,
        peopleSuggestionsLoading,
        peopleSuggestionsTotal,
        personSuggestionOptions,
        query,
        resultsLoading,
        searched,
        searchPlaceholder,
        searchType,
        searchTypeOptions,
        totalPages,
        cancelSearch,
        clearPeopleSuggestions,
        loadMorePeopleSuggestions,
        loadMoviesTvShows,
        loadPersonMoviesTvShows,
        loadPersonMoviesTvShowsById,
        resetSearch
    }
}