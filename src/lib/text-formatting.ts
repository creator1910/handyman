/**
 * Formats text by cleaning LaTeX expressions and preserving markdown formatting
 */
export function formatChatText(text: string): string {
  if (!text) return text
  
  return text
    // Remove LaTeX display math delimiters \[ and \]
    .replace(/\\\[/g, '')
    .replace(/\\\]/g, '')
    // Remove LaTeX inline math delimiters \( and \)
    .replace(/\\\(/g, '')
    .replace(/\\\)/g, '')
    // Replace LaTeX spacing commands with regular spaces
    .replace(/\\,/g, ' ')
    .replace(/\\ /g, ' ')
    .replace(/\\:/g, ' ')
    .replace(/\\;/g, ' ')
    .replace(/\\\s+/g, ' ')
    // Replace LaTeX text commands
    .replace(/\\text\{([^}]+)\}/g, '$1')
    // Replace common LaTeX symbols with Unicode equivalents
    .replace(/\\times/g, '×')
    .replace(/\\cdot/g, '·')
    .replace(/\\div/g, '÷')
    .replace(/\\pm/g, '±')
    .replace(/\\approx/g, '≈')
    .replace(/\\leq/g, '≤')
    .replace(/\\geq/g, '≥')
    .replace(/\\ne/g, '≠')
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\gamma/g, 'γ')
    .replace(/\\delta/g, 'δ')
    .replace(/\\pi/g, 'π')
    .replace(/\\mu/g, 'μ')
    .replace(/\\sigma/g, 'σ')
    // Clean up multiple spaces but preserve line breaks
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .trim()
}

/**
 * Formats numbers and currencies in German style
 */
export function formatGermanNumber(text: string): string {
  if (!text) return text
  
  return text
    // Replace decimal points with commas for German number format
    .replace(/(\d+)\.(\d+)/g, '$1,$2')
    // Add proper spacing around currency symbols
    .replace(/(\d+)\s*€/g, '$1 €')
    .replace(/€\s*(\d+)/g, '€ $1')
}

/**
 * Enhanced text processing for German craftsmen context
 */
export function processHandwerkerText(text: string): string {
  if (!text) return text
  
  let processed = formatChatText(text)
  processed = formatGermanNumber(processed)
  
  return processed
    // Improve common craftsmen abbreviations
    .replace(/\bm²\b/g, ' m²')
    .replace(/\bm2\b/g, ' m²')
    .replace(/\bqm\b/g, ' m²')
    .replace(/\blfm\b/g, ' lfm')
    .replace(/\blaufmeter\b/g, ' Laufmeter')
    .replace(/\bh\b(?=\s|$)/g, ' h')
    .replace(/\bstd\b/g, ' Std.')
    // Clean up spacing
    .replace(/\s+/g, ' ')
    .trim()
}