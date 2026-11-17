<template>
    <BlockModal
        :model-value="modelValue"
        :title="modalLabel"
        @update:model-value="emit('update:modelValue', $event)"
    >
        <div class="az-result-details">
            <div class="az-result-details__start">
                <BlockCover
                    :cover="movieTvShow.image"
                    :cover-color="movieTvShow.coverColor"
                    :size="343"
                />
            </div>

            <div class="az-result-details__end">
                <div
                    v-if="movieTvShow.title"
                    class="az-result-details__type"
                >
                    {{ typeLabel }}<template v-if="movieTvShow.year"> &bull; {{ movieTvShow.year }}</template>
                </div>

                <h2
                    v-if="movieTvShow.title"
                    class="az-result-details__title"
                >
                    {{ movieTvShow.title }}
                </h2>

                <BlockDetails
                    :ariaLabel="modalLabel"
                    :details="details"
                    :error="error"
                    :loading="loading"
                    :retry-enabled="retryEnabled"
                    @person-select="emit('person-select', $event)"
                    @retry="emit('retry')"
                />
            </div>
        </div>
    </BlockModal>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

import { useMediaTypeLabel } from '@/composables/useMediaTypeLabel'

import BlockCover from '@/components/BlockCover.vue'
import BlockDetails from '@/components/BlockDetails.vue'
import BlockModal from '@/components/BlockModal.vue'

import type {
    CastMember,
    MovieTvShow,
    MovieTvShowDetails
} from '@/types/movieTvShowFinder'

const props = defineProps<{
    details: MovieTvShowDetails | null
    error: string | null
    loading: boolean
    modelValue: boolean
    movieTvShow: MovieTvShow
    retryEnabled: boolean
}>()

const emit = defineEmits<{
    (event: 'person-select', person: CastMember): void
    (event: 'retry'): void
    (event: 'update:modelValue', value: boolean): void
}>()

const { getMediaTypeLabel } = useMediaTypeLabel()

const modalLabel = computed(() => {
    return props.movieTvShow.type === 'movie'
        ? 'Movie details'
        : 'TV show details'
})

const typeLabel = computed(() => {
    return getMediaTypeLabel(props.movieTvShow)
})
</script>

<style lang="scss" scoped>
.az-result-details {
    width: 100%;
    padding: 36px;
    display: flex;
    gap: 48px;

    @media (max-width: 767px) {
        padding: 24px;
        flex-direction: column;
        gap: 0;

        :deep(.az-details) {
            overflow: visible;
            flex: none;
            order: 4;
        }
    }

    &__start {
        width: 240px;
        flex-shrink: 0;

        @media (max-width: 767px) {
            width: 100%;
            margin-block-end: 24px;
            order: 3;
        }
    }

    &__end {
        min-width: 0;
        display: flex;
        flex: 1;
        flex-direction: column;

        @media (max-width: 767px) {
            display: contents;
        }
    }

    &__type {
        font-size: 12px;
        line-height: 1em;
        color: $color-sand-400;
        text-transform: uppercase;

        @media (max-width: 767px) {
            order: 1;
        }
    }

    &__title {
        margin-block-end: 12px;
        font-size: 36px;
        line-height: 1.25em;
        color: $color-milk-100;
        text-transform: uppercase;
        overflow-wrap: anywhere;

        &:before {
            content: '';
            width: 38px;
            height: 26px;
            float: right;

            @media (max-width: 767px) {
                width: 44px;
                height: 32px;
            }
        }

        @media (max-width: 767px) {
            order: 2;
        }

        @media (max-width: 480px) {
            font-size: 24px;
        }
    }
}
</style>