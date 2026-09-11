<template>
    <div
        class="az-cover"
        :style="coverStyles"
    >
        <div class="az-cover__case">
            <div class="az-cover__image">
                <div
                    class="az-cover__poster"
                    :class="{
                        'az-cover__poster--loading': loading,
                        [`az-cover__poster--${coverColor}`]: coverMissing
                    }"
                >
                    <BlockLoaderRing
                        v-if="loading"
                        aria-hidden="true"
                        :size="32"
                    />

                    <img
                        v-if="cover && !coverMissing"
                        v-show="!loading"
                        class="az-cover__poster-image"
                        alt=""
                        :src="cover"
                        @error="onImageError"
                        @load="onImageLoad"
                    >

                    <div
                        v-if="coverMissing"
                        class="az-cover__poster-empty"
                    >
                        No poster
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'

import BlockLoaderRing from '@/components/BlockLoaderRing.vue'

import type { CoverColor } from '@/types/movieTvShowFinder'

const props = withDefaults(defineProps<{
    cover: string | null
    coverColor: CoverColor
    size?: number
}>(), {
    size: 180
})

const coverMissing = ref(!props.cover)
const loading = ref(Boolean(props.cover))

const coverStyles = computed(() => {
    return {
        '--cover-height': `${props.size}px`,
        '--cover-width': `${Math.round(props.size / 1.4296)}px`
    }
})

const onImageError = () => {
    coverMissing.value = true
    loading.value = false
}

const onImageLoad = () => {
    loading.value = false
}

watch(() => props.cover, (cover) => {
    coverMissing.value = !cover
    loading.value = Boolean(cover)
})
</script>

<style lang="scss" scoped>
.az-cover {
    position: relative;
    z-index: 0;
    width: var(--cover-width);
    height: var(--cover-height);
    margin: 0 auto;

    &:after {
        content: '';
        position: absolute;
        bottom: -5px;
        left: 0;
        width: 100%;
        height: 10px;
        background: rgba($color-grey-500, .3);
        box-shadow: 0 0 20px rgba($color-grey-500, .5);
        border-radius: 20px;
        transform: perspective(600px) rotateX(100deg);
    }

    &__case {
        position: relative;
        overflow: hidden;
        width: 100%;
        height: 100%;
        padding: 1px 1px 1px 0;
        background: $color-grey-400;
        border-radius: 2px 4px 4px 2px;

        &:after {
            content: '';
            position: absolute;
            top: 0;
            left: 32px;
            z-index: 4;
            width: 100%;
            height: 200%;
            background: rgba($color-milk-100, .05);
            pointer-events: none;
            transform: rotate(35deg);
        }
    }

    &__image {
        position: relative;
        width: 100%;
        height: 100%;
        padding: 1px 1px 1px 0;
        background: $color-grey-400;
        border-radius: 0 3px 3px 0;

        &:before {
            content: '';
            position: absolute;
            top: -10px;
            bottom: 0;
            left: 1px;
            z-index: 3;
            width: 2px;
            background: rgba($color-milk-100, .3);
            border-radius: 8px;
        }

        &:after {
            content: '';
            position: absolute;
            top: -13px;
            left: 1px;
            right: -2px;
            height: 15px;
            border-radius: 8px;
            border-top: 2px solid rgba($color-milk-100, .3);
        }
    }

    &__poster {
        position: relative;
        width: 100%;
        height: 100%;
        padding: 1px 1px 1px 0;
        display: flex;
        justify-content: center;
        align-items: center;
        background: rgba($color-milk-100, .2);
        border-radius: 0 4px 4px 0;

        &:before {
            content: '';
            position: absolute;
            top: 2px;
            left: 0;
            z-index: 2;
            width: 0;
            height: 100%;
            box-shadow: 0 0 5px 2px rgba($color-grey-500, .3);
        }

        &:after {
            content: '';
            position: absolute;
            top: 5px;
            left: 0;
            z-index: 1;
            width: 0;
            height: 100%;
            box-shadow: 0 0 5px 3px rgba($color-milk-100, .3);
        }

        &--loading {
            background: #CFCFC9;
        }

        &--mint {
            background: $color-mint-200;
            color: $color-mint-400;
        }

        &--navy {
            background: $color-navy-200;
            color: $color-navy-400;
        }

        &--rose {
            background: $color-rose-200;
            color: $color-rose-400;
        }

        &-image {
            position: relative;
            z-index: 1;
            width: 100%;
            height: 100%;
            border-radius: 0 3px 3px 0;
            object-fit: cover;
        }

        &-empty {
            font-size: 12px;
            line-height: 1em;
            text-transform: uppercase;
        }
    }
}
</style>