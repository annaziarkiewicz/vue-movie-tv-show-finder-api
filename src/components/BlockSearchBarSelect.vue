<template>
    <div
        ref="selectRef"
        class="az-search-bar-select"
        :style="selectStyles"
        @focusout="onFocusOut"
    >
        <button
            ref="selectButtonRef"
            :aria-controls="selectOpen ? optionsId : undefined"
            :aria-expanded="selectOpen"
            aria-haspopup="listbox"
            :aria-label="`${ariaLabel}: ${selectedOptionLabel}`"
            class="az-search-bar-select__button"
            :class="{ 'az-search-bar-select__button--open': selectOpen }"
            type="button"
            @click="toggleSelect"
            @keydown="onSelectButtonKeyDown"
        >
            <span class="az-search-bar-select__value">
                {{ selectedOptionLabel }}
            </span>

            <span
                aria-hidden="true"
                class="az-search-bar-select__icon"
                :class="{ 'az-search-bar-select__icon--open': selectOpen }"
            />
        </button>

        <div
            v-if="selectOpen"
            :id="optionsId"
            :aria-label="ariaLabel"
            class="az-search-bar-select__options"
            role="listbox"
            :style="optionsStyles"
        >
            <div class="az-search-bar-select__list">
                <button
                    v-for="(option, index) in availableOptions"
                    :key="option.value"
                    aria-selected="false"
                    class="az-search-bar-select__option"
                    role="option"
                    :tabindex="index === activeOptionIndex ? 0 : -1"
                    type="button"
                    @click="selectOption(option.value)"
                    @keydown="onOptionKeyDown"
                >
                    {{ option.label }}
                </button>
            </div>
        </div>
    </div>
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

type SelectOption = {
    label: string
    value: string
}

const props = withDefaults(defineProps<{
    ariaLabel?: string
    modelValue?: string
    options?: SelectOption[]
}>(), {
    ariaLabel: 'Search type',
    modelValue: '',
    options: () => []
})

const emit = defineEmits<{
    (event: 'update:modelValue', value: string): void
}>()

const activeOptionIndex = ref(0)
const optionsId = 'az-search-bar-select-options'
const selectButtonRef = ref<HTMLButtonElement | null>(null)
const selectOpen = ref(false)
const selectRef = ref<HTMLElement | null>(null)
const selectWidth = ref(120)

const availableOptions = computed(() => {
    return props.options.filter(
        (option) => option.value !== props.modelValue
    )
})

const selectedOptionLabel = computed(() => {
    return props.options.find(
        (option) => option.value === props.modelValue
    )?.label ?? ''
})

const optionsStyles = computed(() => {
    return {
        width: `${selectWidth.value + 20}px`
    }
})

const selectStyles = computed(() => {
    return {
        width: `${selectWidth.value}px`
    }
})

const updateSelectWidth = async () => {
    await nextTick()

    if (!selectButtonRef.value || !props.options.length) {
        selectWidth.value = 120
        return
    }

    const buttonStyles = window.getComputedStyle(selectButtonRef.value)
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')

    if (!context) {
        return
    }

    context.font = [
        buttonStyles.fontStyle,
        buttonStyles.fontVariant,
        buttonStyles.fontWeight,
        buttonStyles.fontSize,
        buttonStyles.fontFamily
    ].join(' ')

    const widestLabelWidth = Math.max(
        ...props.options.map((option) => {
            return context.measureText(option.label).width
        })
    )

    const buttonPadding = 28
    const iconWidth = 20
    const labelIconGap = 16
    const requiredWidth = Math.ceil(
        widestLabelWidth + buttonPadding + iconWidth + labelIconGap
    )

    selectWidth.value = Math.max(120, requiredWidth)
}

const focusOption = async (index: number) => {
    await nextTick()

    const optionButtons = selectRef.value?.querySelectorAll<HTMLButtonElement>(
        '.az-search-bar-select__option'
    )

    optionButtons?.[index]?.focus()
}

const openSelect = async (index: number) => {
    if (!availableOptions.value.length) {
        return
    }

    activeOptionIndex.value = index
    selectOpen.value = true

    await focusOption(index)
}

const closeSelect = async (restoreFocus = false) => {
    selectOpen.value = false

    if (!restoreFocus) {
        return
    }

    await nextTick()
    selectButtonRef.value?.focus()
}

const toggleSelect = (event: MouseEvent) => {
    if (selectOpen.value) {
        closeSelect()
        return
    }

    activeOptionIndex.value = 0
    selectOpen.value = true

    if (event.detail === 0) {
        focusOption(0)
    }
}

const selectOption = async (value: string) => {
    emit('update:modelValue', value)

    await closeSelect(true)
}

const moveOptionFocus = async (direction: number) => {
    const optionsCount = availableOptions.value.length

    if (!optionsCount) {
        return
    }

    activeOptionIndex.value = (
        activeOptionIndex.value
        + direction
        + optionsCount
    ) % optionsCount

    await focusOption(activeOptionIndex.value)
}

const onSelectButtonKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
        event.preventDefault()
        openSelect(0)
        return
    }

    if (event.key === 'ArrowUp') {
        event.preventDefault()
        openSelect(availableOptions.value.length - 1)
        return
    }

    if (event.key === 'Escape' && selectOpen.value) {
        event.preventDefault()
        closeSelect()
    }
}

const onOptionKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
        event.preventDefault()
        moveOptionFocus(1)
        return
    }

    if (event.key === 'ArrowUp') {
        event.preventDefault()
        moveOptionFocus(-1)
        return
    }

    if (event.key === 'Home') {
        event.preventDefault()
        activeOptionIndex.value = 0
        focusOption(0)
        return
    }

    if (event.key === 'End') {
        event.preventDefault()
        activeOptionIndex.value = availableOptions.value.length - 1
        focusOption(activeOptionIndex.value)
        return
    }

    if (event.key === 'Escape') {
        event.preventDefault()
        closeSelect(true)
    }
}

const onFocusOut = (event: FocusEvent) => {
    const nextTarget = event.relatedTarget

    if (
        nextTarget instanceof Node
        && selectRef.value?.contains(nextTarget)
    ) {
        return
    }

    selectOpen.value = false
}

const onDocumentPointerDown = (event: PointerEvent) => {
    const target = event.target as Node

    if (!selectRef.value?.contains(target)) {
        selectOpen.value = false
    }
}

watch(
    () => props.options,
    updateSelectWidth,
    {
        deep: true
    }
)

onMounted(() => {
    document.addEventListener('pointerdown', onDocumentPointerDown)

    updateSelectWidth()
    document.fonts.ready.then(updateSelectWidth)
})

onBeforeUnmount(() => {
    document.removeEventListener('pointerdown', onDocumentPointerDown)
})
</script>

<style lang="scss" scoped>
.az-search-bar-select {
    margin-inline-end: 8px;
    flex-shrink: 0;

    @media (max-width: 480px) {
        position: relative;
        width: 100% !important;
        margin-inline-end: 0;
    }

    &__button {
        position: relative;
        z-index: 1;
        width: 100%;
        padding: 14px 16px 14px 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 24px;
        line-height: 1em;
        color: $color-milk-100;

        @media (max-width: 480px) {
            z-index: 5;
            padding-inline-start: 12px;
            padding-inline-end: 0;
        }

        &:before {
            content: '';
            position: absolute;
            right: 0;
            width: 4px;
            height: calc(100% + 2 * 12px);
            background: $color-milk-200;

            @media (max-width: 480px) {
                display: none;
            }
        }

        &:focus-visible:after {
            content: '';
            position: absolute;
            top: -8px;
            bottom: -8px;
            left: -16px;
            right: 4px;
            box-shadow: 0 0 0 4px $color-grey-300;
            border-radius: 34px 0 0 34px;
            pointer-events: none;

            @media (max-width: 480px) {
                top: -8px;
                bottom: -4px;
                left: -16px;
                right: -12px;
                border-radius: 34px 34px 0 0;
            }
        }

        &[aria-expanded='true']:focus-visible:after {
            border-radius: 34px 0 0 0;

            @media (max-width: 480px) {
                border-radius: 34px 34px 0 0;
            }
        }
    }

    &__value {
        white-space: nowrap;
    }

    &__icon {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
        background: $color-milk-100;
        mask: url('@/assets/arrow.svg') center / contain no-repeat;
        -webkit-mask: url('@/assets/arrow.svg') center / contain no-repeat;

        &--open {
            rotate: 180deg;
        }
    }

    &__options {
        position: absolute;
        top: -4px;
        left: -4px;
        padding: 70px 0 0;
        background: $color-milk-500;
        box-shadow: 0 0 48px -24px $color-grey-200;
        border-radius: 38px 0 38px 38px;
        border: 4px solid $color-milk-200;

        @media (max-width: 480px) {
            top: -12px;
            left: -20px;
            right: -16px;
            z-index: 4;
            width: auto !important;
            padding-block-start: 68px;
            border-radius: 38px;
        }
    }

    &__list {
        overflow: hidden;
        width: 100%;
        min-height: 68px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        border-radius: 0 0 34px 34px;
        border-top: .5px solid $color-milk-300;
    }

    &__option {
        width: 100%;
        padding: 8px 28px;
        display: block;
        font-size: 20px;
        line-height: 1.5em;
        color: $color-milk-200;
        text-align: left;

        &:last-child:not(:first-child) {
            margin-block-end: 8px;
        }

        &:hover {
            background: $color-milk-600;
        }

        &:focus-visible {
            background: $color-grey-300;
        }
    }
}
</style>