// Separate esbuild entry, included per page with:
//   <%= javascript_include_tag 'datetime_pickers', data: { 'datetime-pickers': [{ selector: '#id', options: {} }] } %>
// Uses attributes from the current <script> tag, so it must stay a classic (non-module) script.

import flatpickr from 'flatpickr'
import { MandarinTraditional } from 'flatpickr/dist/l10n/zh-tw'

const script = document.currentScript
const props = script && script.getAttribute('data-datetime-pickers')
if (props == null) throw new Error('<script> tag must have attribute "data-datetime-pickers"')

const datetimePickers = JSON.parse(props)
datetimePickers.forEach(({ selector, options }) => {
  const dom = document.querySelector(selector)
  if (!dom) return
  const opts = { locale: MandarinTraditional, enableTime: true, ...options }
  flatpickr(dom, opts)
})
