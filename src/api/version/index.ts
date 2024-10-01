import { HTTPMethod } from '@/enums/method'
import { LookupModel, VersionModel } from '@/models/version.dto'
import type { Bindings } from '@/utils/bindings'
import { OpenAPIHono as Hono, createRoute, z } from '@hono/zod-openapi'
import { HTTPException } from 'hono/http-exception'
import type { StatusCode } from 'hono/utils/http-status'

export const app = new Hono<{ Bindings: Bindings }>()

const get_game_version = async (): Promise<string> => {
  const url: URL = new URL('https://leanny.github.io/splat3/versions.json')
  const response = await fetch(url.href)
  if (!response.ok) {
    throw new HTTPException(response.status as StatusCode, { message: response.statusText })
  }
  return z
    .array(z.string())
    .parse(await response.json())
    .slice(-1)[0]
    .split('')
    .join('.')
}

const get_hash = async (): Promise<string> => {
  const url: URL = new URL('https://api.lp1.av5ja.srv.nintendo.net')
  const response = await fetch(url.href)
  const pattern: RegExp = /static\/js\/main.([a-f0-9]{8})/
  if (!response.ok) {
    throw new HTTPException(response.status as StatusCode, { message: response.statusText })
  }
  const text: string = await response.text()
  const match: RegExpMatchArray | null = text.match(pattern)
  if (match === null) {
    throw new HTTPException(404, { message: 'Not Found' })
  }
  return match[1]
}

export const get_revision = async (): Promise<string> => {
  const hash: string = await get_hash()
  const url: URL = new URL(`static/js/main.${hash}.js`, 'https://api.lp1.av5ja.srv.nintendo.net')
  const response = await fetch(url.href)
  if (!response.ok) {
    throw new HTTPException(response.status as StatusCode, { message: response.statusText })
  }
  const text: string = await response.text()
  const version: string = (() => {
    const pattern: RegExp = /`(\d\.\d\.\d)-/
    const match: RegExpMatchArray | null = text.match(pattern)
    if (match === null) {
      throw new HTTPException(404, { message: 'Not Found' })
    }
    return match[1]
  })()
  const revision: string = (() => {
    const pattern: RegExp = /REACT_APP_REVISION:"([a-f0-9]{40})"/
    const match: RegExpMatchArray | null = text.match(pattern)
    if (match === null) {
      throw new HTTPException(404, { message: 'Not Found' })
    }
    return match[1]
  })()
  return `${version}-${revision.slice(0, 8)}`
}

const get_version = async (): Promise<LookupModel> => {
  const url: URL = new URL('lookup', 'https://itunes.apple.com')
  url.searchParams.append('id', '1234806557')
  const response = await fetch(url.href)
  if (!response.ok) {
    throw new HTTPException(response.status as StatusCode, { message: response.statusText })
  }
  return LookupModel.parse(await response.json())
}

app.openapi(
  createRoute({
    method: HTTPMethod.GET,
    path: '/',
    tags: ['情報'],
    summary: 'バージョン',
    description: 'Nintendo Switch OnlineとSplatNet3のバージョン情報を返します',
    responses: {
      200: {
        content: {
          'application/json': {
            schema: VersionModel
          }
        },
        description: 'バージョン'
      }
    }
  }),
  async (c) => {
    const [revision, version, game_version] = await Promise.all([get_revision(), get_version(), get_game_version()])
    return c.json(VersionModel.parse({ game: game_version, app: version.version, web: revision }))
  }
)
