// Using attributes from current script tag
// 'data-datetime-pickers': an array contains { selector: '#selector', options: {} } collection

import flatpickr from 'flatpickr/dist/flatpickr'
import i10n from 'flatpickr/dist/l10n/zh-tw'

const script = document.currentScript
const props = script.getAttribute('data-datetime-pickers')
if (props == null) throw new Error('<script> tag must have attribute "data-datetime-pickers"')

const datetimePickers = JSON.parse(props)
datetimePickers.forEach(({ selector, options }) => {
  const dom = document.querySelector(selector)
  const opts = { locale: i10n.zh_tw, enableTime: true, ...options }
  flatpickr(dom, opts)
})
