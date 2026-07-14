import { camelCase, isArray, isDate, isObject, reduce } from 'lodash'

// biome-ignore lint/suspicious/noExplicitAny: recursive helper walks arbitrary JSON
export const camelcaseKeys = (obj: any): object => {
  if (!isObject(obj)) {
    return obj
  }
  if (isArray(obj)) {
    return obj.map((v) => camelcaseKeys(v))
  }
  if (isDate(obj)) {
    return obj
  }
  return reduce(
    obj,
    (r, v, k) => {
      return {
        ...r,
        [camelCase(k)]: camelcaseKeys(v)
      }
    },
    {}
  )
}
