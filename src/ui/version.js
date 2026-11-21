export const APP_VERSION = __APP_VERSION__;
export const versionedStorageKey = name => `mltt.${import.meta.env.DEV ? 'dev' : APP_VERSION}.${name}`;
