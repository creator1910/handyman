import { useState } from 'react'

interface PDFViewerProps {
  url: string
  filename?: string
  className?: string
}

export function PDFViewer({ url, filename, className = '' }: PDFViewerProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleDownload = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename || 'angebot.pdf'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      window.URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      console.error('Error downloading PDF:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleView = () => {
    window.open(url, '_blank')
  }

  return (
    <div className={`border border-gray-200 rounded-lg p-4 bg-gray-50 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 6V4a2 2 0 00-2-2H6a2 2 0 00-2 2v2H2v2h2v10a2 2 0 002 2h12a2 2 0 002-2V8h2V6h-2zM6 4h12v2H6V4zm12 14H6V8h12v10z"/>
            <path d="M8 10h8v2H8zM8 14h6v2H8z"/>
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 truncate">
            {filename || 'Angebot PDF'}
          </h4>
          <p className="text-xs text-gray-500 mt-1">
            PDF-Dokument bereit zum Download
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleView}
            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Anzeigen
          </button>

          <button
            onClick={handleDownload}
            disabled={isLoading}
            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-orange-500 border border-transparent rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                Lädt...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}