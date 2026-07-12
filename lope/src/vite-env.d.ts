/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_INTERPRET_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
