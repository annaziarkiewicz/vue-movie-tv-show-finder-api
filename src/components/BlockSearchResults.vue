<template>
    <span
        aria-atomic="true"
        class="az-search-results-status"
        role="status"
    >
        {{ resultsStatus }}
    </span>

    <div
        :aria-busy="loading"
        class="az-search-results"
    >
        <BlockLoaderDots v-if="loading" />

        <template v-else-if="error">
            <BlockError
                :class="{ 'az-search-results__error--with-alternative': alternativeSearchType }"
                :message="error"
            />

            <button
                v-if="alternativeSearchType"
                class="az-search-results__button"
                type="button"
                @click="emit('alternative-search')"
            >
                {{ alternativeSearchType === 'movies' ? 'Search movies' : 'Search series' }}
            </button>
        </template>

        <BlockResultsGrid
            v-else
            :items="items"
            @select="emit('select', $event)"
        />
    </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

import BlockError from '@/components/BlockError.vue'
import BlockLoaderDots from '@/components/BlockLoaderDots.vue'
import BlockResultsGrid from '@/components/BlockResultsGrid.vue'

import type { MovieTvShow } from '@/types/movieTvShowFinder'

const props = defineProps<{
    alternativeSearchType?: 'movies' | 'series' | null
    error: string | null
    items: MovieTvShow[]
    loading: boolean
}>()

const emit = defineEmits<{
    (event: 'alternative-search'): void
    (event: 'select', item: MovieTvShow): void
}>()

const resultsStatus = computed(() => {
    if (props.loading || props.error || !props.items.length) {
        return ''
    }

    return `Search complete. Showing ${props.items.length} results.`
})
</script>

<style lang="scss" scoped>
.az-search-results-status {
    position: absolute;
    overflow: hidden;
    width: 1px;
    height: 1px;
    white-space: nowrap;
    clip-path: inset(50%);
}

.az-search-results {
    display: flex;
    flex: 1;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;

    &__error--with-alternative {
        flex: 0;
    }

    &__button {
        margin-block: 12px auto;
        padding: 16px 24px;
        background: $color-rose-100;
        border-radius: 8px;
        font-size: 15px;
        font-weight: 500;
        color: $color-milk-200;
        text-transform: uppercase;
        transition: .25s;

        &:focus-visible {
            @include focus-ring($color-grey-300, 8px);
        }

        &:hover {
            background: $color-rose-200;
        }
    }
}
</style>