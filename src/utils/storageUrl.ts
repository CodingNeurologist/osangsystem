import { createClient } from '@/lib/supabase/client'

/**
 * Storage 경로에서 Signed URL을 생성하거나, 외부 URL은 그대로 반환
 */
export async function getSignedStorageUrl(
  bucket: string,
  urlOrPath: string,
  expiresIn = 3600
): Promise<string | null> {
  if (!urlOrPath) return null

  // 외부 URL (YouTube 등)은 그대로 반환
  if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {
    // Supabase Storage URL이면 경로 추출
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (supabaseUrl && urlOrPath.includes(supabaseUrl)) {
      const match = urlOrPath.match(/\/storage\/v1\/object\/(?:public|sign)\/[^/]+\/(.+)/)
      if (match) {
        urlOrPath = match[1]
      } else {
        return urlOrPath
      }
    } else {
      return urlOrPath
    }
  }

  // 상대 경로 → Signed URL 생성
  const supabase = createClient()
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(urlOrPath, expiresIn)

  if (error || !data?.signedUrl) return null
  return data.signedUrl
}
