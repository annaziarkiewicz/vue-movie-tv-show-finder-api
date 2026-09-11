<template>
    <div
        ref="detailsRef"
        :aria-busy="loading"
        :aria-label="ariaLabel"
        class="az-details"
        role="region"
        :tabindex="isScrollable ? 0 : undefined"
    >
        <BlockLoaderDots v-if="loading" />

        <div v-else-if="error" class="az-details__error">
            <BlockError :message="error" />

            <button
                v-if="retryEnabled"
                class="az-details__retry"
                type="button"
                @click="emit('retry')"
            >
                Retry
            </button>
        </div>

        <template v-else-if="details">
            <div v-if="details.overview" class="az-details__description">
                <h3 class="az-details__description-label">
                    Description:
                </h3>

                <div class="az-details__description-value">
                    {{ details.overview }}
                </div>
            </div>

            <div
                v-if="hasDetails"
                class="az-details__list"
            >
                <h3 class="az-details__list-label">
                    Details:
                </h3>

                <div v-if="details.genres.length" class="az-details__item">
                    <span class="az-details__item-label">
                        Genres:
                    </span>

                    <span class="az-details__item-value">
                        {{ details.genres.join(', ') }}
                    </span>
                </div>

                <div v-if="details.runtime" class="az-details__item">
                    <span class="az-details__item-label">
                        Runtime:
                    </span>

                    <span class="az-details__item-value">
                        {{ details.runtime }} min
                    </span>
                </div>

                <div v-if="details.status" class="az-details__item">
                    <span class="az-details__item-label">
                        Status:
                    </span>

                    <span class="az-details__item-value">
                        {{ details.status }}
                    </span>
                </div>

                <div class="az-details__item">
                    <span class="az-details__item-label">
                        Rating:
                    </span>

                    <span class="az-details__item-value">
                        {{ details.rating.toFixed(1) }} / 10
                    </span>
                </div>

                <div class="az-details__item">
                    <span class="az-details__item-label">
                        Votes:
                    </span>

                    <span class="az-details__item-value">
                        {{ details.voteCount.toLocaleString() }}
                    </span>
                </div>

                <div
                    v-if="details.type === 'tv' && details.seasons"
                    class="az-details__item"
                >
                    <span class="az-details__item-label">
                        Seasons:
                    </span>

                    <span class="az-details__item-value">
                        {{ details.seasons }}
                    </span>
                </div>

                <div
                    v-if="details.type === 'tv' && details.episodes"
                    class="az-details__item"
                >
                    <span class="az-details__item-label">
                        Episodes:
                    </span>

                    <span class="az-details__item-value">
                        {{ details.episodes }}
                    </span>
                </div>
            </div>

            <div v-if="details.cast.length" class="az-details__cast">
                <h3 class="az-details__cast-label">
                    Cast:
                </h3>

                <div class="az-details__cast-list">
                    <BlockCastMember
                        v-for="member in details.cast"
                        :key="member.id"
                        :avatar="member.avatar"
                        :character="member.character"
                        :id="member.id"
                        :name="member.name"
                        @person-select="emit('person-select', $event)"
                    />
                </div>
            </div>
        </template>
    </div>
</template>

<script lang="ts" setup>
import {
    computed,
    nextTick,
    onMounted,
    onUnmounted,
    ref,
    watch
} from 'vue'

import BlockCastMember from '@/components/BlockCastMember.vue'
import BlockError from '@/components/BlockError.vue'
import BlockLoaderDots from '@/components/BlockLoaderDots.vue'

import type {
    CastMember,
    MovieTvShowDetails
} from '@/types/movieTvShowFinder'

const props = withDefaults(defineProps<{
    ariaLabel: string
    details: MovieTvShowDetails | null
    error: string | null
    loading: boolean
    retryEnabled?: boolean
}>(), {
    retryEnabled: true
})

const emit = defineEmits<{
    (event: 'person-select', person: CastMember): void
    (event: 'retry'): void
}>()

const detailsRef = ref<HTMLElement | null>(null)
const isScrollable = ref(false)

const hasDetails = computed(() => {
    if (!props.details) {
        return false
    }

    return Boolean(
        props.details.genres.length
        || props.details.runtime
        || props.details.status
        || props.details.rating != null
        || props.details.voteCount != null
        || props.details.seasons
        || props.details.episodes
    )
})

const updateScrollable = () => {
    if (!detailsRef.value || window.innerWidth <= 767) {
        isScrollable.value = false
        return
    }

    isScrollable.value = detailsRef.value.scrollHeight > detailsRef.value.clientHeight
}

watch(
    () => [
        props.details,
        props.error,
        props.loading
    ],
    async () => {
        await nextTick()
        updateScrollable()
    }
)

onMounted(async () => {
    await nextTick()
    updateScrollable()
    window.addEventListener('resize', updateScrollable)
})

onUnmounted(() => {
    window.removeEventListener('resize', updateScrollable)
})
</script>

<style lang="scss" scoped>
.az-details {
    overflow-y: auto;
    min-width: 0;
    padding-block: 8px 4px;
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
    gap: 24px;

    @media (max-width: 767px) {
        overflow-y: visible;
    }

    &:focus-visible {
        @include focus-ring($color-grey-400, 4px);
    }

    &::-webkit-scrollbar {
        width: 8px;
    }

    &::-webkit-scrollbar-track {
        background: $color-grey-200;
        border-radius: 4px;
    }

    &::-webkit-scrollbar-thumb {
        background: $color-milk-200;
        border-radius: 4px;
    }

    &__error {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 24px;
    }

    &__retry {
        padding: 16px 24px;
        background: $color-rose-200;
        border-radius: 8px;
        font-size: 15px;
        font-weight: 500;
        color: $color-milk-200;
        text-transform: uppercase;
        transition: .25s;

        &:focus-visible {
            @include focus-ring($color-grey-400, 8px);
        }

        &:hover {
            background: $color-rose-300;
        }
    }

    &__description {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 4px;

        &-label {
            font-size: 12px;
            line-height: 1em;
            color: $color-milk-500;
            text-transform: uppercase;
        }

        &-value {
            padding-inline-end: 12px;
            font-size: 20px;
            line-height: 1.5em;
            color: $color-milk-100;
            overflow-wrap: anywhere;

            @media (max-width: 767px) {
                padding: 0;
            }
        }
    }

    &__list {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 4px;

        &-label {
            font-size: 12px;
            line-height: 1em;
            color: $color-milk-500;
            text-transform: uppercase;
        }
    }

    &__item {
        font-size: 20px;
        line-height: 1.5em;

        &-label {
            color: $color-milk-200;
        }

        &-value {
            color: $color-milk-100;
            overflow-wrap: anywhere;
        }
    }

    &__cast {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 4px;

        &-label {
            font-size: 12px;
            line-height: 1em;
            color: $color-milk-500;
            text-transform: uppercase;
        }

        &-list {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px 24px;

            @media (max-width: 767px) {
                grid-template-columns: 1fr;
            }
        }
    }
}
</style>