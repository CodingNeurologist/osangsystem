'use client'

import { useState, useEffect } from 'react'
import { ExternalLink, FileText } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import MarkdownRenderer from '@/components/common/MarkdownRenderer'
import { getSignedStorageUrl } from '@/utils/storageUrl'
import type { EducationalContent } from '@/types'

interface ContentDetailProps {
  content: EducationalContent
}

export default function ContentDetail({ content }: ContentDetailProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)

  useEffect(() => {
    if (content.category === 'PDF' && content.file_url) {
      setPdfLoading(true)
      getSignedStorageUrl('educational-files', content.file_url).then((url) => {
        setPdfUrl(url)
        setPdfLoading(false)
      })
    }
  }, [content])

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary">{content.category}</Badge>
            {content.visibility === 'public' && (
              <Badge variant="outline">전체공개</Badge>
            )}
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            {content.title}
          </h2>
          {content.summary && (
            <p className="text-sm text-muted-foreground mt-1">
              {content.summary}
            </p>
          )}
        </div>

        {/* PDF */}
        {content.category === 'PDF' && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
            <FileText className="h-8 w-8 text-orange-600" />
            <div className="flex-1">
              <p className="text-sm font-medium">PDF 파일</p>
              <p className="text-xs text-muted-foreground">
                새 탭에서 열립니다
              </p>
            </div>
            {pdfLoading ? (
              <Button disabled size="sm">
                로딩 중...
              </Button>
            ) : pdfUrl ? (
              <Button asChild size="sm">
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  PDF 열기
                </a>
              </Button>
            ) : (
              <Button disabled size="sm">
                파일 없음
              </Button>
            )}
          </div>
        )}

        {/* 유튜브 */}
        {content.category === '유튜브' && content.file_url && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
            <div className="flex-1">
              <p className="text-sm font-medium">YouTube 영상</p>
              {content.body && (
                <p className="text-xs text-muted-foreground">{content.body}</p>
              )}
            </div>
            <Button
              size="sm"
              onClick={() => {
                const a = document.createElement('a')
                a.href = content.file_url!
                a.target = '_blank'
                a.rel = 'noopener noreferrer'
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
              }}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              유튜브에서 보기
            </Button>
          </div>
        )}

        {/* 마크다운 본문 */}
        {content.category !== 'PDF' &&
          content.category !== '유튜브' &&
          content.body && <MarkdownRenderer content={content.body} />}

        {/* 태그 */}
        {content.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-2">
            {content.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* 면책 */}
        <p className="text-[11px] text-muted-foreground/70 pt-4 border-t">
          본 내용은 일반적인 건강 정보 제공 목적이며, 의사의 진단·치료를
          대체하지 않습니다.
        </p>
      </CardContent>
    </Card>
  )
}
