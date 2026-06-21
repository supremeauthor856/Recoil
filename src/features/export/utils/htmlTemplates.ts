import { xmlEscape } from './downloadHelper'

const BASE_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Georgia', 'Times New Roman', serif;
    background: #0f0f18;
    color: #e6e6f0;
    max-width: 760px;
    margin: 0 auto;
    padding: 40px 24px;
    line-height: 1.7;
  }
  h1 { font-size: 32px; font-weight: 700; color: #b97aff; margin-bottom: 8px; }
  h2 { font-size: 20px; font-weight: 600; color: #e6e6f0; margin: 28px 0 12px;
       border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 6px; }
  h3 { font-size: 16px; font-weight: 600; color: #8e8ea8; margin: 16px 0 8px; }
  p { margin-bottom: 12px; color: #c0c0d0; }
  .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em;
            color: #56566a; font-weight: 500; margin-bottom: 2px; }
  .value { font-size: 14px; color: #e6e6f0; margin-bottom: 12px; }
  .badge {
    display: inline-block; padding: 3px 10px; border-radius: 999px;
    font-size: 11px; font-weight: 500; margin-right: 6px; margin-bottom: 6px;
    background: rgba(123,94,167,0.15); color: #b97aff;
    border: 1px solid rgba(123,94,167,0.3);
  }
  .tag {
    display: inline-block; padding: 2px 8px; border-radius: 999px;
    font-size: 11px; background: rgba(255,255,255,0.05); color: #8e8ea8;
    margin-right: 4px; margin-bottom: 4px;
  }
  .section { margin-bottom: 32px; }
  .field-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 12px 24px;
    margin-bottom: 16px;
  }
  .list-items { list-style: none; }
  .list-items li::before { content: '— '; color: #56566a; }
  .list-items li { margin-bottom: 4px; color: #c0c0d0; font-size: 14px; }
  blockquote {
    border-left: 3px solid #7b5ea7; padding-left: 16px;
    margin: 12px 0; color: #8e8ea8; font-style: italic;
  }
  .meta { font-size: 11px; color: #3a3a50; margin-top: 40px; padding-top: 16px;
           border-top: 1px solid rgba(255,255,255,0.04); }
  @media print {
    body { background: white; color: black; }
    h1, h2, h3 { color: black; }
    .badge, .tag { background: #eee; color: #333; border-color: #ccc; }
    blockquote { border-color: #666; }
  }
`

// Build a complete standalone HTML page string
export function buildHTMLPage(title: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${xmlEscape(title)}</title>
<style>${BASE_STYLES}</style>
</head>
<body>
${bodyContent}
<div class="meta">Exported from Recoil on ${new Date().toLocaleDateString()}</div>
</body>
</html>`
}

// Convert an HTML page to XHTML (well-formed XML)
export function htmlToXHTML(htmlString: string): string {
  return htmlString
    .replace(/<!DOCTYPE html>/, '<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">')
    .replace(/<html lang="en">/, '<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">')
    .replace(/<br>/g, '<br/>')
    .replace(/<hr>/g, '<hr/>')
    .replace(/<img([^>]*)>/g, '<img$1/>')
    .replace(/<input([^>]*)>/g, '<input$1/>')
    .replace(/<meta([^>]*)>/g, '<meta$1/>')
    .replace(/<link([^>]*)>/g, '<link$1/>')
}
