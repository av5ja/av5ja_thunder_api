import type { ApiReferenceConfiguration } from '@scalar/hono-api-reference'
import { lowerCase, startCase } from 'lodash'
import info from '@/../package.json'

export const reference: Partial<ApiReferenceConfiguration> = {
  url: '/specification',
  defaultHttpClient: {
    targetKey: 'node',
    clientKey: 'axios'
  },
  layout: 'modern',
  hideDownloadButton: true,
  darkMode: true,
  metaData: {
    title: startCase(lowerCase(info.name))
  },
  theme: 'default',
  defaultOpenAllTags: false,
  tagsSorter: 'alpha'
}

export const specification = {
  openapi: '3.0.0',
  info: {
    title: startCase(lowerCase(info.name)),
    version: info.version,
    description: info.description,
    license: {
      name: info.license
    }
  }
}
