<template>
    <div
        :aria-busy="disabled"
        class="az-pagination"
    >
        <button
            :aria-disabled="disabled || currentPage <= 1"
            aria-label="Previous page"
            class="az-pagination__button"
            :disabled="currentPage <= 1"
            type="button"
            @click="selectPage(currentPage - 1)"
        >
            <span
                aria-hidden="true"
                class="az-pagination__icon az-pagination__icon--previous"
            />
        </button>

        <template v-for="page in pages" :key="page">
            <div
                v-if="page === currentPage"
                aria-current="page"
                class="az-pagination__button az-pagination__button--current"
            >
                {{ page }}
            </div>

            <button
                v-else-if="typeof page === 'number'"
                :aria-disabled="disabled"
                :aria-label="`Page ${page}`"
                class="az-pagination__button"
                type="button"
                @click="selectPage(page)"
            >
                {{ page }}
            </button>

            <span v-else aria-hidden="true" class="az-pagination__ellipsis">
                …
            </span>
        </template>

        <button
            :aria-disabled="disabled || currentPage >= totalPages"
            aria-label="Next page"
            class="az-pagination__button"
            :disabled="currentPage >= totalPages"
            type="button"
            @click="selectPage(currentPage + 1)"
        >
            <span
                aria-hidden="true"
                class="az-pagination__icon az-pagination__icon--next"
            />
        </button>
    </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps<{
    currentPage: number
    disabled: boolean
    totalPages: number
}>()

const emit = defineEmits<{
    (event: 'page-change', page: number): void
}>()

const visibleMiddlePages = ref(3)

let desktopMediaQuery: MediaQueryList | null = null
let mobileMediaQuery: MediaQueryList | null = null

const updateVisibleMiddlePages = () => {
    visibleMiddlePages.value = mobileMediaQuery?.matches ? 1 : desktopMediaQuery?.matches ? 5 : 3
}

const pages = computed(() => {
    const visiblePages: (number | string)[] = []
    const middlePages = visibleMiddlePages.value
    const sidePages = (middlePages - 1) / 2
    const startPage = Math.max(
        2,
        Math.min(props.currentPage - sidePages, props.totalPages - middlePages)
    )
    const endPage = startPage + middlePages - 1

    if (props.totalPages <= middlePages + 4) {
        return Array.from({ length: props.totalPages }, (_, index) => {
            return index + 1
        })
    }

    visiblePages.push(1)

    if (startPage > 2) {
        visiblePages.push('start-gap')
    }

    for (let page = startPage; page <= endPage; page += 1) {
        visiblePages.push(page)
    }

    if (endPage < props.totalPages - 1) {
        visiblePages.push('end-gap')
    }

    visiblePages.push(props.totalPages)

    return visiblePages
})

const selectPage = (page: number) => {
    if (
        props.disabled
        || page === props.currentPage
        || page < 1
        || page > props.totalPages
    ) {
        return
    }

    emit('page-change', page)
}

onMounted(() => {
    desktopMediaQuery = window.matchMedia('(width > 768px)')
    mobileMediaQuery = window.matchMedia('(max-width: 480px)')
    updateVisibleMiddlePages()
    desktopMediaQuery.addEventListener('change', updateVisibleMiddlePages)
    mobileMediaQuery.addEventListener('change', updateVisibleMiddlePages)
})

onBeforeUnmount(() => {
    desktopMediaQuery?.removeEventListener('change', updateVisibleMiddlePages)
    mobileMediaQuery?.removeEventListener('change', updateVisibleMiddlePages)
})
</script>

<style lang="scss" scoped>
.az-pagination {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: 8px;

    @media (max-width: 480px) {
        gap: 4px;
    }

    @media (max-width: 360px) {
        width: calc(100% + 4px);
        margin-inline: -2px;
    }

    &__button {
        min-width: 44px;
        height: 44px;
        padding: 8px;
        display: flex;
        flex-shrink: 0;
        justify-content: center;
        align-items: center;
        background: transparent;
        border-radius: 22px;
        border: none;
        font-size: 15px;
        color: $color-milk-200;
        transition: .25s;

        &:focus-visible:not(.az-pagination__button--current) {
            @include focus-ring($color-grey-300, 22px);
        }

        &:hover:not(:disabled):not([aria-disabled='true']):not(.az-pagination__button--current) {
            background: $color-milk-200;
            color: $color-sand-300;
        }

        &:disabled,
        &[aria-disabled='true'] {
            background: transparent;
            border: none;
            cursor: not-allowed;
            color: $color-sand-300;
        }

        &--current {
            border: 2px solid $color-milk-200;
            cursor: default;
            color: $color-milk-200;
        }
    }

    &__ellipsis {
        width: 24px;
        height: 44px;
        display: flex;
        justify-content: center;
        align-items: center;
        background: transparent;
        border: none;
        font-size: 15px;
        color: $color-sand-300;

        @media (max-width: 480px) {
            margin: 0 -4px;
        }
    }

    &__icon {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
        background: currentColor;
        mask: url('@/assets/arrow.svg') center / contain no-repeat;
        -webkit-mask: url('@/assets/arrow.svg') center / contain no-repeat;

        &--previous {
            transform: rotate(90deg);
        }

        &--next {
            transform: rotate(-90deg);
        }
    }
}
</style>