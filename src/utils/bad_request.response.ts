export const BadRequestResponse = (
  options:
    | {
        message: string
      }
    | undefined = undefined
) => {
  return {
    400: {
      description: options?.message || 'Bad Request.'
    }
  }
}
