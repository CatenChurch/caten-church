// Using attributes from current script tag
// 'data-dom': html selector for choose which input should become datetime-picker
// 'data-options': options for datetime-picker

import flatpickr from 'flatpickr/dist/flatpickr'
import i10n from 'flatpickr/dist/l10n/zh-tw'

const script = document.currentScript

document.addEventListener('turbolinks:load', () => {
  const dom = document.querySelector(script.getAttribute('data-dom'))
  const options = { locale: i10n.zh_tw, ...JSON.parse(script.getAttribute('data-options')) }
  flatpickr(dom, options)
})
