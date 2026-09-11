<template>
    <section
        class="az-app"
        :class="{ 'az-app--inside-iframe': isIframe }"
    >
        <BlockSearchBar
            ref="searchBarRef"
            button-label="Search"
            :disabled="loading || (!query.trim() && !searched)"
            :loading="loading && !resultsLoading"
            :model-value="query"
            :placeholder="searchPlaceholder"
            :suggestions-enabled="searchType === 'people'"
            @close-suggestions="closeSuggestions"
            @search="searchMoviesTvShows"
            @update:model-value="updateQuery"
        >
            <template #prepend>
                <BlockSearchBarSelect
                    :model-value="searchType"
                    :options="searchTypeOptions"
                    @update:model-value="updateSearchType"
                />
            </template>

            <template
                v-if="peopleSuggestions.length"
                #suggestions="{ suggestionsId, withSelect }"
            >
                <BlockSearchBarSuggestions
                    aria-label="People suggestions"
                    :id="suggestionsId"
                    :suggestions="personSuggestionOptions"
                    :total-options="peopleSuggestionsTotal"
                    :with-select="withSelect"
                    @close="closeSuggestionOptions"
                    @select="selectSuggestion"
                >
                    <template #footer>
                        <div
                            v-if="peopleSuggestionsHasMore"
                            class="az-people-suggestions-footer"
                        >
                            <div class="az-people-suggestions-footer__actions">
                                <BlockError
                                    v-if="peopleSuggestionsError"
                                    class="az-people-suggestions-footer__error"
                                    :message="peopleSuggestionsError"
                                />

                                <button
                                    v-if="peopleSuggestionsHasMore"
                                    :aria-disabled="peopleSuggestionsLoading"
                                    class="az-people-suggestions-footer__button"
                                    type="button"
                                    @click="loadMorePeopleSuggestions"
                                    @keydown.esc.prevent.stop="closeSuggestionOptions"
                                >
                                    Load next {{ nextPeopleCount }} people
                                </button>
                            </div>

                            <span
                                aria-atomic="true"
                                aria-live="polite"
                                class="az-people-suggestions-footer__count"
                            >
                                Showing <b>{{ peopleSuggestions.length }}</b> of <b>{{ peopleSuggestionsTotal }}</b> people
                            </span>
                        </div>
                    </template>
                </BlockSearchBarSuggestions>
            </template>
        </BlockSearchBar>

        <BlockWelcomeScreen
            v-if="!searched && !resultsLoading"
        />

        <BlockSearchResults
            v-else
            :alternative-search-type="alternativeSearchType"
            :error="error"
            :items="moviesTvShows"
            :loading="resultsLoading"
            @alternative-search="searchAlternativeTitles"
            @select="openMovieTvShow"
        />

        <BlockPagination
            v-if="!loading && searched && moviesTvShows.length && totalPages > 1"
            :current-page="currentPage"
            :disabled="loading"
            :total-pages="totalPages"
            @page-change="changePage"
        />

        <BlockResultDetails
            v-if="activeMovieTvShow"
            :key="`${activeMovieTvShow.type}-${activeMovieTvShow.id}`"
            :details="details"
            :error="detailsError"
            :loading="detailsLoading"
            :model-value="detailsVisible"
            :movie-tv-show="activeMovieTvShow"
            :retry-enabled="detailsRetryEnabled"
            @person-select="openPerson"
            @retry="loadMovieTvShowDetails(activeMovieTvShow)"
            @update:model-value="updateDetailsVisibility"
        />
    </section>

    <BlockSplinter :is-iframe="isIframe">
        <template #credits>
            <div class="az-credits">
                <div
                    class="az-credits__logo"
                    aria-label="TMDB"
                    role="img"
                />

                <div class="az-credits__text">
                    This product uses the TMDB API but is not endorsed or certified by TMDB.
                </div>
            </div>
        </template>
    </BlockSplinter>
</template>

<script lang="ts" setup>
import {
    computed,
    nextTick,
    onBeforeUnmount,
    onMounted,
    ref,
    watch
} from 'vue'

import { useDetails } from '@/composables/useDetails'
import { useIframeCommunication } from '@/composables/useIframeCommunication'
import { useSearch } from '@/composables/useSearch'
import { useUrl } from '@/composables/useUrl'

import BlockError from '@/components/BlockError.vue'
import BlockPagination from '@/components/BlockPagination.vue'
import BlockResultDetails from '@/components/BlockResultDetails.vue'
import BlockSearchBar from '@/components/BlockSearchBar.vue'
import BlockSearchBarSelect from '@/components/BlockSearchBarSelect.vue'
import BlockSearchBarSuggestions from '@/components/BlockSearchBarSuggestions.vue'
import BlockSearchResults from '@/components/BlockSearchResults.vue'
import BlockSplinter from '@/components/BlockSplinter.vue'
import BlockWelcomeScreen from '@/components/BlockWelcomeScreen.vue'

import type { Suggestion } from '@/components/BlockSearchBarSuggestions.vue'
import type {
    CastMember,
    MovieTvShow,
    PersonSuggestion,
    SearchType
} from '@/types/movieTvShowFinder'

const apiKey = ''

const { isIframe } = useIframeCommunication()

const {
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
} = useSearch(apiKey)

const {
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
} = useDetails(apiKey)

const searchBarRef = ref<InstanceType<typeof BlockSearchBar> | null>(null)

const {
    skipNextPopstateLoad,
    urlChangeId,
    getMovieTvShowStateFromUrl,
    getSearchStateFromUrl,
    getUrlParamsWithoutMovieTvShow,
    invalidateUrlChange,
    updateUrl
} = useUrl()

const nextPeopleCount = computed(() => {
    return Math.min(20, Math.max(0, peopleSuggestionsTotal.value - peopleSuggestions.value.length))
})

const resetApplication = () => {
    resetSearch()
    resetDetails()
}

const loadSearchResults = (
    searchQuery: string,
    type: SearchType,
    page = 1
) => {
    resetDetails()

    return loadMoviesTvShows(searchQuery, type, page)
}

const commitPersonSelection = (person: PersonSuggestion) => {
    query.value = person.name
    searchType.value = 'people'

    updateUrl({
        page: '1',
        person: person.name,
        personId: String(person.id),
        type: 'people'
    })

    resetDetails()
}

const searchMoviesTvShows = async () => {
    const searchQuery = query.value.trim()

    if (!searchQuery) {
        query.value = ''

        updateUrl({})

        resetApplication()
        return
    }

    query.value = searchQuery

    if (searchType.value !== 'people') {
        updateUrl({
            page: '1',
            search: searchQuery,
            type: searchType.value
        })

        await loadSearchResults(searchQuery, searchType.value)
        return
    }

    const currentUrlChangeId = ++urlChangeId.value
    const outcome = await loadSearchResults(searchQuery, 'people')

    if (currentUrlChangeId !== urlChangeId.value) {
        return
    }

    if (outcome?.selectedPerson) {
        commitPersonSelection(outcome.selectedPerson)
        return
    }

    if (!outcome?.peopleSuggestions.length) {
        updateUrl({
            page: '1',
            person: searchQuery,
            type: 'people'
        })
    }
}

const searchAlternativeTitles = async () => {
    const type = alternativeSearchType.value

    if (!type) {
        return
    }

    searchType.value = type
    await searchMoviesTvShows()
}

const selectPerson = async (
    person: PersonSuggestion,
    loadById = false
) => {
    commitPersonSelection(person)

    await nextTick()
    searchBarRef.value?.focusInput()

    if (loadById) {
        await loadPersonMoviesTvShowsById(person.id)
        return
    }

    await loadPersonMoviesTvShows(person)
}

const closeSuggestions = () => {
    clearPeopleSuggestions()
}

const closeSuggestionOptions = () => {
    closeSuggestions()
    searchBarRef.value?.focusInput()
}

const openPerson = async (person: CastMember) => {
    await selectPerson({
        department: null,
        id: person.id,
        image: person.avatar,
        name: person.name
    }, true)
}

const cancelPendingSearch = () => {
    if (cancelSearch()) {
        updateUrl({}, true)
    }
}

const updateQuery = (value: string) => {
    invalidateUrlChange()
    cancelPendingSearch()
    query.value = value

    if (peopleSuggestions.value.length) {
        closeSuggestions()
    }
}

const updateSearchType = (value: string) => {
    if (value !== 'people' && value !== 'movies' && value !== 'series') {
        return
    }

    invalidateUrlChange()
    cancelPendingSearch()
    closeSuggestions()
    searchType.value = value
}

const selectSuggestion = async (
    suggestion: Suggestion
) => {
    const personId = Number(suggestion.id)
    const person = peopleSuggestions.value.find((item) => {
        return item.id === personId
    })

    if (!person) {
        return
    }

    await selectPerson(person)
}

const openMovieTvShow = async (
    movieTvShow: MovieTvShow
) => {
    cancelSearch()
    closeSuggestions()

    const params = getUrlParamsWithoutMovieTvShow()

    if (movieTvShow.type === 'movie') {
        params.movie = movieTvShow.title
        params.movieId = String(movieTvShow.id)
    } else {
        params.show = movieTvShow.title
        params.showId = String(movieTvShow.id)
    }

    updateUrl(
        params,
        false,
        {
            movieTvShowDetails: true
        }
    )

    await showMovieTvShowDetails(movieTvShow)
}

const updateDetailsVisibility = (value: boolean) => {
    if (value) {
        detailsVisible.value = true
        return
    }

    if (window.history.state?.movieTvShowDetails) {
        skipNextPopstateLoad.value = true
        resetDetails()
        window.history.back()
        return
    }

    updateUrl(getUrlParamsWithoutMovieTvShow(), true)

    resetDetails()
}

const scrollToApplicationTop = async () => {
    await nextTick()
    searchBarRef.value?.focusInput()
    document.querySelector<HTMLElement>('.az-app')?.scrollIntoView({
        behavior: 'instant',
        block: 'start'
    })
}

const changePage = async (page: number) => {
    if (loading.value || page === currentPage.value) {
        return
    }

    const params = getUrlParamsWithoutMovieTvShow()
    const searchState = getSearchStateFromUrl()
    const personId = Number(params.personId)

    params.page = String(page)
    params.type = searchState.type
    query.value = searchState.query
    searchType.value = searchState.type

    updateUrl(params)
    resetDetails()

    const currentUrlChangeId = urlChangeId.value

    if (searchState.type === 'people' && 'personId' in params) {
        await loadPersonMoviesTvShowsById(personId, page)
    } else {
        await loadSearchResults(searchState.query, searchState.type, page)
    }

    if (currentUrlChangeId === urlChangeId.value) {
        await scrollToApplicationTop()
    }
}

const handleUrlChange = async () => {
    const currentUrlChangeId = ++urlChangeId.value
    const searchParams = new URLSearchParams(window.location.search)
    const personId = Number(searchParams.get('personId'))
    const movieTvShowUrlState = getMovieTvShowStateFromUrl()
    const searchState = getSearchStateFromUrl()

    query.value = searchState.query
    searchType.value = searchState.type

    const invalidDetailsId = movieTvShowUrlState !== null
        && (!Number.isSafeInteger(movieTvShowUrlState.id) || movieTvShowUrlState.id <= 0)

    if (invalidDetailsId && movieTvShowUrlState) {
        await showMovieTvShowDetailsById(
            movieTvShowUrlState.id,
            movieTvShowUrlState.type
        )
    }

    if (
        searchState.type === 'people'
        && searchParams.has('personId')
    ) {
        if (!invalidDetailsId) {
            resetDetails()
        }

        await loadPersonMoviesTvShowsById(personId, searchState.page)
    } else if (searchState.query) {
        if (!invalidDetailsId) {
            resetDetails()
        }

        await loadMoviesTvShows(
            searchState.query,
            searchState.type,
            searchState.page
        )
    } else {
        resetSearch()
    }

    if (currentUrlChangeId !== urlChangeId.value || invalidDetailsId) {
        return
    }

    if (!movieTvShowUrlState) {
        resetDetails()
        return
    }

    const movieTvShow = moviesTvShows.value.find((item) => {
        return item.id === movieTvShowUrlState.id
            && item.type === movieTvShowUrlState.type
    })

    if (movieTvShow) {
        await showMovieTvShowDetails(movieTvShow)
        return
    }

    await showMovieTvShowDetailsById(
        movieTvShowUrlState.id,
        movieTvShowUrlState.type,
        movieTvShowUrlState.title
    )
}

const handlePopstate = () => {
    if (skipNextPopstateLoad.value) {
        skipNextPopstateLoad.value = false
        return
    }

    handleUrlChange()
}

onMounted(() => {
    window.addEventListener('popstate', handlePopstate)
    handleUrlChange()
})

watch(peopleSuggestionsHasMore, async (hasMore) => {
    const button = document.activeElement

    if (
        !hasMore
        && button instanceof HTMLButtonElement
        && button.classList.contains('az-people-suggestions-footer__button')
    ) {
        const suggestionsList = button.closest('[role="listbox"]')
        const currentOptions = suggestionsList?.querySelectorAll<HTMLButtonElement>('[role="option"]')

        currentOptions?.[currentOptions.length - 1]?.focus()

        await nextTick()

        const options = suggestionsList?.querySelectorAll<HTMLButtonElement>('[role="option"]')
        const lastOption = options?.[options.length - 1]

        if (lastOption?.isConnected) {
            lastOption.focus()
        }
    }
})

onBeforeUnmount(() => {
    window.removeEventListener('popstate', handlePopstate)
    cancelSearch()
    resetDetails()
})
</script>

<style lang="scss" scoped>
.az-app {
    position: relative;
    width: 100%;
    max-width: 960px;
    min-height: 680px;
    padding: 136px 36px 24px;
    display: flex;
    flex-direction: column;
    justify-content: stretch;
    gap: 36px;
    background: #B6B6AF;

    @media (max-width: 767px) {
        padding-inline: 24px;
    }

    @media (max-width: 480px) {
        padding-block-start: 204px;
    }

    &:not(.az-app--inside-iframe) {
        margin-block-start: 24px;
    }
}

.az-people-suggestions-footer {
    margin-block-start: 12px;
    padding: 0 36px 20px 24px;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    gap: 12px;

    @media (max-width: 768px) {
        flex-direction: column;
    }

    &__actions {
        min-width: 0;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;

        @media (max-width: 480px) {
            width: 100%;
        }
    }

    &__error {
        overflow-wrap: anywhere;
    }

    &__button {
        padding: 14.5px 24px;
        background: $color-milk-200;
        border-radius: 22px;
        font-size: 15px;
        font-weight: 500;
        line-height: 1.25em;
        color: $color-milk-400;
        text-transform: uppercase;
        transition: .25s;

        @media (max-width: 480px) {
            width: 100%;
        }

        &:focus-visible {
            @include focus-ring($color-grey-400, 22px);
        }

        &:hover {
            background: $color-milk-100;
        }
    }

    &__count {
        font-size: 15px;
        line-height: 1.25em;
        color: $color-milk-500;
    }
}

.az-credits {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 24px;

    @media (max-width: 767px) {
        flex-direction: column;
        gap: 0;
    }

    &__logo {
        width: 140px;
        height: 40px;
        margin-block: -12px;
        flex-shrink: 0;
        background: $color-milk-100;
        mask: url('@/assets/tmdb.svg') center / contain no-repeat;
        -webkit-mask: url('@/assets/tmdb.svg') center / contain no-repeat;

        @media (max-width: 767px) {
            margin-block: -8px 0;
        }
    }
}
</style>