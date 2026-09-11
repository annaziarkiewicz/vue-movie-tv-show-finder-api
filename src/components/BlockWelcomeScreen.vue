<template>
    <div class="az-welcome">
        <a
            v-for="item in items"
            :key="item.name"
            class="az-welcome__tile"
            :href="getSearchUrl(item)"
        >
            <img
                class="az-welcome__image"
                alt=""
                :src="item.image"
            >

            <div class="az-welcome__name">
                {{ item.name }}
            </div>
        </a>
    </div>
</template>

<script lang="ts" setup>
import amanda from '@/assets/amanda-seyfried.png'
import bethany from '@/assets/bethany-joy-lenz.png'
import kerry from '@/assets/kerry-washington.png'
import mariska from '@/assets/mariska-hargitay.png'
import priyanka from '@/assets/priyanka-chopra.png'
import teresa from '@/assets/teresa-palmer.png'

import type { WelcomeItem } from '@/types/movieTvShowFinder'

const items: WelcomeItem[] = [
    {
        id: 20374,
        image: teresa,
        name: 'Teresa Palmer'
    },
    {
        id: 11703,
        image: kerry,
        name: 'Kerry Washington'
    },
    {
        id: 1118081,
        image: bethany,
        name: 'Bethany Joy Lenz'
    },
    {
        id: 6240,
        image: mariska,
        name: 'Mariska Hargitay'
    },
    {
        id: 71070,
        image: amanda,
        name: 'Amanda Seyfried'
    },
    {
        id: 77234,
        image: priyanka,
        name: 'Priyanka Chopra'
    }
]

const getSearchUrl = (item: WelcomeItem) => {
    const searchParams = new URLSearchParams({
        person: item.name,
        personId: String(item.id)
    })

    return `?${searchParams.toString()}`
}
</script>

<style lang="scss" scoped>
.az-welcome {
    z-index: 0;
    margin-block-end: -2px;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 36px 24px;

    @media (max-width: 767px) {
        grid-template-columns: repeat(2, 1fr);
    }

    @media (max-width: 480px) {
        grid-template-columns: 1fr;
    }

    &__tile {
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 24px;
        cursor: pointer;

        &:focus-visible {
            @include focus-ring($color-grey-400, true);
        }

        &:before {
            content: '';
            position: absolute;
            top: 30px;
            width: 68%;
            height: 120px;
            background: $color-milk-200;
            transition: .25s;

            @media (prefers-reduced-motion: reduce) {
                transition: none;
            }
        }

        &:hover {
            &:before {
                @media (prefers-reduced-motion: no-preference) {
                    top: 80px;
                    width: 10%;
                    height: 20px;
                }
            }

            .az-welcome__name {
                color: $color-grey-400;
                text-shadow: 1px 1px $color-grey-200;
            }
        }
    }

    &__image {
        z-index: 1;
        max-height: 200px;
        padding-block-end: 24px;
    }

    &__name {
        font-size: 15px;
        line-height: 1.25em;
        color: $color-milk-200;
        text-transform: uppercase;
    }
}
</style>