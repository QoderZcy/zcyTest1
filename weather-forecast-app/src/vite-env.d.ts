/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENWEATHER_API_KEY: string
  readonly VITE_AMAP_API_KEY: string
  readonly VITE_QWEATHER_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}