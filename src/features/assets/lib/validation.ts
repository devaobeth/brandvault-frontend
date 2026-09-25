/** Client rules aligned with backend FormRequests for assets/folders. */

export const NAME_MAX = 255
export const TAG_MAX_COUNT = 20
export const TAG_MAX_LENGTH = 64
export const TEXT_MAX = 1000
/** Laravel `max:10240` is kilobytes. */
export const ASSET_MAX_BYTES = 10 * 1024 * 1024

const ASSET_EXT =
  /\.(jpe?g|png|webp|gif|svg|mp4|webm|mov|pdf|docx?|txt|rtf|ttf|otf|woff2?)$/i

export function parseTags(tagsText: string): string[] {
  return tagsText
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

export function validateName(value: string, label = 'Name'): string | undefined {
  const trimmed = value.trim()
  if (!trimmed) {
    return `${label} is required.`
  }
  if (trimmed.length > NAME_MAX) {
    return `${label} must be ${NAME_MAX} characters or fewer.`
  }
  return undefined
}

export function validateAssetFile(
  file: File | null,
  options: { required: boolean },
): string | undefined {
  if (!file) {
    return options.required ? 'Please choose a file to upload.' : undefined
  }
  if (file.size > ASSET_MAX_BYTES) {
    return 'File must be 10MB or smaller.'
  }
  if (!ASSET_EXT.test(file.name)) {
    return 'Unsupported file type. Use image, video, document, or font formats allowed by the API.'
  }
  return undefined
}

export function validateTags(tags: string[]): string | undefined {
  if (tags.length > TAG_MAX_COUNT) {
    return `At most ${TAG_MAX_COUNT} tags are allowed.`
  }
  const tooLong = tags.find((tag) => tag.length > TAG_MAX_LENGTH)
  if (tooLong) {
    return `Each tag must be ${TAG_MAX_LENGTH} characters or fewer.`
  }
  return undefined
}

export function validateOptionalLongText(
  value: string,
  label: string,
): string | undefined {
  if (value.trim().length > TEXT_MAX) {
    return `${label} must be ${TEXT_MAX} characters or fewer.`
  }
  return undefined
}

export function validateRequiredLongText(
  value: string,
  label: string,
): string | undefined {
  if (!value.trim()) {
    return `${label} is required.`
  }
  return validateOptionalLongText(value, label)
}
