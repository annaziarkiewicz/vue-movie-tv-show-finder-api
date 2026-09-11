<template>
    <div
        class="az-cast-member"
        role="button"
        tabindex="0"
        @click="selectPerson"
        @keydown.enter="selectPerson"
        @keydown.space.prevent="selectPerson"
    >
        <img
            v-if="avatar && !avatarMissing"
            class="az-cast-member__avatar"
            alt=""
            :src="avatar"
            @error="onImageError"
        >

        <div v-else class="az-cast-member__avatar">
            No image
        </div>

        <div class="az-cast-member__content">
            <span class="az-cast-member__name">
                {{ name }}
            </span>

            <span class="az-cast-member__character">
                {{ character }}
            </span>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'

import type { CastMember } from '@/types/movieTvShowFinder'

const props = defineProps<{
    avatar: string | null
    character: string
    id: number
    name: string
}>()

const emit = defineEmits<{
    (event: 'person-select', person: CastMember): void
}>()

const avatarMissing = ref(!props.avatar)

const onImageError = () => {
    avatarMissing.value = true
}

const selectPerson = () => {
    emit('person-select', {
        avatar: props.avatar,
        character: props.character,
        id: props.id,
        name: props.name
    })
}

watch(() => props.avatar, (avatar) => {
    avatarMissing.value = !avatar
})
</script>

<style lang="scss" scoped>
.az-cast-member {
    position: relative;
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;

    &:focus-visible {
        background: $color-grey-400;
        outline: none;
    }

    &:hover {
        .az-cast-member__name {
            color: $color-grey-400;
        }
    }

    &:focus-visible:hover {
        .az-cast-member__name {
            color: $color-milk-500;
        }
    }

    &__avatar {
        width: 48px;
        height: 48px;
        display: flex;
        flex-shrink: 0;
        justify-content: center;
        align-items: center;
        background: #CFCFC9;
        border-radius: 50%;
        object-fit: cover;
        font-size: 9px;
        color: $color-milk-300;
    }

    &__content {
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
        overflow-wrap: anywhere;
    }

    &__name {
        font-size: 20px;
        line-height: 1.25em;
        color: $color-milk-200;
    }

    &__character {
        font-size: 12px;
        line-height: 1em;
        color: $color-milk-500;
        text-transform: uppercase;
    }
}
</style>