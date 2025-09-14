import React from 'react'

interface MarkdownTextProps {
  children: string
  className?: string
}

/**
 * Simple markdown renderer for chat messages that handles:
 * - **bold text**
 * - Line breaks and paragraphs
 * - Numbered and bulleted lists
 * - Code formatting
 */
export default function MarkdownText({ children, className = '' }: MarkdownTextProps) {
  if (!children) return null

  const renderMarkdown = (text: string): React.ReactNode[] => {
    const lines = text.split('\n')
    const elements: React.ReactNode[] = []
    let listItems: string[] = []
    let listType: 'ul' | 'ol' | null = null
    let paragraphContent: string[] = []

    const flushParagraph = (index: number) => {
      if (paragraphContent.length > 0) {
        const content = paragraphContent.join('\n').trim()
        if (content) {
          elements.push(
            <p key={`p-${index}`} className="mb-3 last:mb-0">
              {renderInlineMarkdown(content)}
            </p>
          )
        }
        paragraphContent = []
      }
    }

    const flushList = (index: number) => {
      if (listItems.length > 0) {
        const ListComponent = listType === 'ol' ? 'ol' : 'ul'
        elements.push(
          <ListComponent key={`list-${index}`} className={`mb-3 last:mb-0 ${listType === 'ol' ? 'list-decimal' : 'list-disc'} list-inside space-y-1`}>
            {listItems.map((item, itemIndex) => (
              <li key={itemIndex} className="leading-relaxed">
                {renderInlineMarkdown(item)}
              </li>
            ))}
          </ListComponent>
        )
        listItems = []
        listType = null
      }
    }

    lines.forEach((line, index) => {
      const trimmedLine = line.trim()

      // Handle numbered lists
      const numberedMatch = trimmedLine.match(/^\d+\.\s*(.+)$/)
      if (numberedMatch) {
        flushParagraph(index)
        if (listType !== 'ol') {
          flushList(index)
          listType = 'ol'
        }
        listItems.push(numberedMatch[1])
        return
      }

      // Handle bulleted lists
      const bulletMatch = trimmedLine.match(/^[-*]\s*(.+)$/)
      if (bulletMatch) {
        flushParagraph(index)
        if (listType !== 'ul') {
          flushList(index)
          listType = 'ul'
        }
        listItems.push(bulletMatch[1])
        return
      }

      // Handle headings (simple ## format)
      const headingMatch = trimmedLine.match(/^##\s*(.+)$/)
      if (headingMatch) {
        flushParagraph(index)
        flushList(index)
        elements.push(
          <h3 key={`h-${index}`} className="font-semibold text-gray-900 mb-2 mt-4 first:mt-0">
            {renderInlineMarkdown(headingMatch[1])}
          </h3>
        )
        return
      }

      // Empty line - paragraph break
      if (!trimmedLine) {
        flushParagraph(index)
        flushList(index)
        return
      }

      // Regular text line
      flushList(index)
      paragraphContent.push(line)
    })

    // Flush remaining content
    flushParagraph(lines.length)
    flushList(lines.length)

    return elements
  }

  const renderInlineMarkdown = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = []
    let currentIndex = 0

    // Split by bold patterns
    const boldRegex = /\*\*([^*]+)\*\*/g
    let match

    while ((match = boldRegex.exec(text)) !== null) {
      // Add text before the bold
      if (match.index > currentIndex) {
        const beforeText = text.slice(currentIndex, match.index)
        parts.push(...renderWithCode(beforeText, parts.length))
      }

      // Add bold text
      parts.push(
        <strong key={`bold-${parts.length}`} className="font-semibold">
          {match[1]}
        </strong>
      )

      currentIndex = match.index + match[0].length
    }

    // Add remaining text
    if (currentIndex < text.length) {
      const remainingText = text.slice(currentIndex)
      parts.push(...renderWithCode(remainingText, parts.length))
    }

    return parts
  }

  const renderWithCode = (text: string, baseIndex: number): React.ReactNode[] => {
    const parts: React.ReactNode[] = []
    let currentIndex = 0

    // Handle inline code `text`
    const codeRegex = /`([^`]+)`/g
    let match

    while ((match = codeRegex.exec(text)) !== null) {
      // Add text before the code
      if (match.index > currentIndex) {
        const beforeText = text.slice(currentIndex, match.index)
        if (beforeText) {
          parts.push(beforeText)
        }
      }

      // Add code text
      parts.push(
        <code key={`code-${baseIndex}-${parts.length}`} className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">
          {match[1]}
        </code>
      )

      currentIndex = match.index + match[0].length
    }

    // Add remaining text
    if (currentIndex < text.length) {
      const remainingText = text.slice(currentIndex)
      if (remainingText) {
        parts.push(remainingText)
      }
    }

    return parts.length > 0 ? parts : [text]
  }

  return (
    <div className={`markdown-content ${className}`}>
      {renderMarkdown(children)}
    </div>
  )
}