import JSZip from 'jszip'
import { slugify, downloadBlob } from './downloadHelper'

interface EpubChapter {
  title: string
  content: string   // HTML content
  id: string
}

interface EpubOptions {
  title: string
  author?: string
  language?: string
  description?: string
  coverColor?: string   // hex color for generated cover
  chapters: EpubChapter[]
}

export async function buildAndDownloadEpub(options: EpubOptions): Promise<void> {
  const zip = new JSZip()
  const lang = options.language ?? 'en'
  const uniqueId = `recoil-${Date.now()}`
  const bookSlug = slugify(options.title)

  // mimetype — MUST be first file, uncompressed
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' })

  // META-INF/container.xml
  zip.file('META-INF/container.xml', `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`)

  // Chapter files
  const chapterManifestItems: string[] = []
  const chapterSpineItems: string[] = []

  options.chapters.forEach((chapter, index) => {
    const chapterId = `chapter-${index + 1}`
    const filename = `OEBPS/${chapterId}.xhtml`
    const xhtmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="${lang}">
<head>
<meta http-equiv="Content-Type" content="application/xhtml+xml; charset=UTF-8"/>
<title>${chapter.title}</title>
<link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
<h1>${chapter.title}</h1>
${chapter.content}
</body>
</html>`
    zip.file(filename, xhtmlContent)
    chapterManifestItems.push(
      `<item id="${chapterId}" href="${chapterId}.xhtml" media-type="application/xhtml+xml"/>`
    )
    chapterSpineItems.push(`<itemref idref="${chapterId}"/>`)
  })

  // OEBPS/styles.css
  zip.file('OEBPS/styles.css', `
body { font-family: Georgia, serif; line-height: 1.7; margin: 1em 2em; color: #222; }
h1 { font-size: 1.6em; margin-bottom: 0.5em; }
h2 { font-size: 1.3em; margin-top: 1.5em; }
p { margin-bottom: 0.8em; }
blockquote { border-left: 3px solid #666; padding-left: 1em; color: #555; font-style: italic; }
`)

  // OEBPS/nav.xhtml (navigation document)
  const navItems = options.chapters.map((ch, i) =>
    `<li><a href="chapter-${i + 1}.xhtml">${ch.title}</a></li>`
  ).join('\n        ')

  zip.file('OEBPS/nav.xhtml', `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${lang}">
<head><title>Table of Contents</title></head>
<body>
  <nav epub:type="toc" id="toc">
    <h2>Table of Contents</h2>
    <ol>
        ${navItems}
    </ol>
  </nav>
</body>
</html>`)

  // OEBPS/content.opf — package document
  zip.file('OEBPS/content.opf', `<?xml version="1.0" encoding="UTF-8"?>
<package version="3.0" xmlns="http://www.idpf.org/2007/opf" unique-identifier="uid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="uid">${uniqueId}</dc:identifier>
    <dc:title>${options.title}</dc:title>
    <dc:creator>${options.author ?? 'Recoil'}</dc:creator>
    <dc:language>${lang}</dc:language>
    <dc:description>${options.description ?? ''}</dc:description>
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d{3}Z/, 'Z')}</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="css" href="styles.css" media-type="text/css"/>
    ${chapterManifestItems.join('\n    ')}
  </manifest>
  <spine>
    ${chapterSpineItems.join('\n    ')}
  </spine>
</package>`)

  // Generate and download
  const blob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/epub+zip',
    compression: 'DEFLATE',
  })

  downloadBlob(`${bookSlug}.epub`, blob, 'application/epub+zip')
}
