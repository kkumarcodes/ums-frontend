// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
export const extractYoutubeUsername = (youtubeURL?: string) => {
  if (!youtubeURL) return undefined
  if (youtubeURL.toLowerCase().includes('user/')) {
    return youtubeURL.split('user/')[1].split('/')[0]
  }
  const latterURL = youtubeURL.split('youtube.com/')[1]
  const fragment = latterURL.split('/')[0]
  if (!['channel', 'playlist'].includes(fragment.toLowerCase())) return fragment
  return undefined
}
