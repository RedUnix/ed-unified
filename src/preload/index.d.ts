import type { EdToolAppApi } from './index'

declare global {
  interface Window {
    edToolApp: EdToolAppApi
  }
}
