import React from 'react'
import { PDFViewer } from './PDFViewer'

interface MarkdownTextProps {
  children: string
  className?: string
}

/**
 * Simple markdown renderer for chat messages that handles:
 * - **bold text**
 * - ## H2 and ### H3 headings
 * - Horizontal rules (---)
 * - Line breaks and paragraphs
 * - Numbered and bulleted lists (-, *, •)
 * - Code formatting
 * - Markdown tables
 */
export default function MarkdownText({ children, className = '' }: MarkdownTextProps) {
  if (!children) return null


  const renderMarkdown = (text: string): React.ReactNode[] => {
    const lines = text.split('\n')
    const elements: React.ReactNode[] = []
    let listItems: string[] = []
    let listType: 'ul' | 'ol' | null = null
    let paragraphContent: string[] = []
    let tableLines: string[] = []

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

    const flushTable = (index: number) => {
      if (tableLines.length > 1) {
        // First line is headers
        const headerLine = tableLines[0]
        const dataRows = tableLines.slice(2) // Skip header and separator line

        // Parse headers
        const headers = headerLine.split('|').map(h => h.trim()).filter(h => h !== '')

        // Parse data rows
        const rows = dataRows.map(row =>
          row.split('|').map(cell => cell.trim()).filter(cell => cell !== '')
        )

        if (headers.length > 0 && rows.length > 0) {
          elements.push(
            <div key={`table-${index}`} className="mb-4 overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-300 bg-white rounded-lg shadow-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {headers.map((header, headerIndex) => (
                      <th key={headerIndex} className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-900">
                        {renderInlineMarkdown(header)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="border border-gray-300 px-4 py-2 text-sm text-gray-900">
                          {renderInlineMarkdown(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }

        tableLines = []
      }
    }

    lines.forEach((line, index) => {
      const trimmedLine = line.trim()

      // Handle table rows (starts with |)
      if (trimmedLine.startsWith('|') && trimmedLine.endsWith('|')) {
        flushParagraph(index)
        flushList(index)
        tableLines.push(trimmedLine)
        return
      }

      // Handle table separator line (|---|---|)
      if (trimmedLine.match(/^\|[\s\-:]+\|$/)) {
        tableLines.push(trimmedLine)
        return
      }

      // If we were building a table and hit a non-table line, flush it
      if (tableLines.length > 0) {
        flushTable(index)
      }

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

      // Handle bulleted lists (supports -, *, •)
      const bulletMatch = trimmedLine.match(/^[-*•]\s*(.+)$/)
      if (bulletMatch) {
        flushParagraph(index)
        if (listType !== 'ul') {
          flushList(index)
          listType = 'ul'
        }
        listItems.push(bulletMatch[1])
        return
      }

      // Handle h2 headings (## format)
      const h2Match = trimmedLine.match(/^##\s*(.+)$/)
      if (h2Match) {
        flushParagraph(index)
        flushList(index)
        flushTable(index)
        elements.push(
          <h2 key={`h2-${index}`} className="text-lg font-semibold text-gray-900 mb-3 mt-5 first:mt-0">
            {renderInlineMarkdown(h2Match[1])}
          </h2>
        )
        return
      }

      // Handle h3 headings (### format)
      const h3Match = trimmedLine.match(/^###\s*(.+)$/)
      if (h3Match) {
        flushParagraph(index)
        flushList(index)
        flushTable(index)
        elements.push(
          <h3 key={`h3-${index}`} className="text-base font-semibold text-gray-900 mb-2 mt-4 first:mt-0">
            {renderInlineMarkdown(h3Match[1])}
          </h3>
        )
        return
      }

      // Handle single # headings (# format) - fallback for h1
      const h1Match = trimmedLine.match(/^#\s*(.+)$/)
      if (h1Match) {
        flushParagraph(index)
        flushList(index)
        flushTable(index)
        elements.push(
          <h1 key={`h1-${index}`} className="text-xl font-bold text-gray-900 mb-4 mt-6 first:mt-0">
            {renderInlineMarkdown(h1Match[1])}
          </h1>
        )
        return
      }

      // Handle PDF links (🔗PDF: /api/offers/xxx/pdf or 📄 Angebot: /api/offers/xxx/pdf)
      const pdfMatch = trimmedLine.match(/^(?:🔗PDF:|📄\s*Angebot:)\s*(\S+)$/)
      if (pdfMatch) {
        flushParagraph(index)
        flushList(index)
        flushTable(index)
        const pdfUrl = pdfMatch[1]
        // Extract offer ID from URL and generate filename
        let filename = 'angebot.pdf'
        if (pdfUrl.includes('/offers/')) {
          const offerId = pdfUrl.split('/')[3]
          // We'll let the PDFViewer component fetch the offer number from the API
          filename = `offer-${offerId}.pdf` // temporary, will be updated by component
        }
        elements.push(
          <PDFViewer
            key={`pdf-${index}`}
            url={pdfUrl}
            filename={filename}
            className="mb-4"
          />
        )
        return
      }

      // Handle horizontal rules (---)
      if (trimmedLine === '---') {
        flushParagraph(index)
        flushList(index)
        flushTable(index)
        elements.push(
          <hr key={`hr-${index}`} className="border-gray-300 my-4" />
        )
        return
      }

      // Empty line - paragraph break
      if (!trimmedLine) {
        flushParagraph(index)
        flushList(index)
        flushTable(index)
        return
      }

      // Regular text line
      flushList(index)
      paragraphContent.push(line)
    })

    // Flush remaining content
    flushParagraph(lines.length)
    flushList(lines.length)
    flushTable(lines.length)

    return elements
  }

  const renderInlineMarkdown = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = []
    let currentIndex = 0

    // Split by bold patterns - handle both ** and single * for bold
    const boldRegex = /\*\*([^*]+)\*\*|\*([^*]+)\*/g
    let match

    while ((match = boldRegex.exec(text)) !== null) {
      // Add text before the bold
      if (match.index > currentIndex) {
        const beforeText = text.slice(currentIndex, match.index)
        parts.push(...renderWithCode(beforeText, parts.length))
      }

      // Add bold text (match[1] for **, match[2] for single *)
      const boldText = match[1] || match[2]
      parts.push(
        <strong key={`bold-${parts.length}`} className="font-semibold">
          {boldText}
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

    // Handle markdown links [text](url) first, then inline code
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
    let match

    while ((match = linkRegex.exec(text)) !== null) {
      // Add text before the link
      if (match.index > currentIndex) {
        const beforeText = text.slice(currentIndex, match.index)
        parts.push(...renderCodeInText(beforeText, baseIndex + parts.length))
      }

      // Add link
      parts.push(
        <a
          key={`link-${baseIndex}-${parts.length}`}
          href={match[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          {match[1]}
        </a>
      )

      currentIndex = match.index + match[0].length
    }

    // Add remaining text
    if (currentIndex < text.length) {
      const remainingText = text.slice(currentIndex)
      parts.push(...renderCodeInText(remainingText, baseIndex + parts.length))
    }

    return parts.length > 0 ? parts : renderCodeInText(text, baseIndex)
  }

  const renderCodeInText = (text: string, baseIndex: number): React.ReactNode[] => {
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