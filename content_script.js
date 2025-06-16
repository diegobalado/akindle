// Este script se inyecta en la página para extraer el contenido y generar el EPUB\n\nfunction downloadEPUB(blob, filename) {\n  const url = URL.createObjectURL(blob);\n  const a = document.createElement('a');\n  a.href = url;\n  a.download = filename;\n  document.body.appendChild(a);\n  a.click();\n  setTimeout(() => {\n    document.body.removeChild(a);\n    URL.revokeObjectURL(url);\n  }, 100);\n}\n\nasync function generateEPUB(article) {\n  const zip = new JSZip();\n  
  // Archivos mínimos para EPUB\n  zip.file('mimetype', 'application/epub+zip');\n  zip.file('META-INF/container.xml', `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`);\n\n  // content.opf y toc.ncx básicos\n  zip.file('OEBPS/content.opf', `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="2.0" unique-identifier="BookId">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${article.title}</dc:title>
    <dc:language>es</dc:language>
    <dc:identifier id="BookId">id-${Date.now()}</dc:identifier>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="content" href="content.html" media-type="application/xhtml+xml"/>
  </manifest>
  <spine toc="ncx">
    <itemref idref="content"/>
  </spine>
</package>`);\n  zip.file('OEBPS/toc.ncx', `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="id-${Date.now()}"/>
  </head>
  <docTitle>
    <text>${article.title}</text>
  </docTitle>
  <navMap>
    <navPoint id="navPoint-1" playOrder="1">
      <navLabel>
        <text>${article.title}</text>
      </navLabel>
      <content src="content.html"/>
    </navPoint>
  </navMap>
</ncx>`);\n\n  // Contenido principal\n  zip.file('OEBPS/content.html', `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <title>${article.title}</title>
  </head>
  <body>
    <h1>${article.title}</h1>
    ${article.content}
  </body>
</html>`);\n\n  const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip' });\n  downloadEPUB(blob, `${article.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.epub`);\n}\n\nchrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {\n  if (msg.action === 'extract_and_convert') {\n    try {\n      const article = new Readability(document.cloneNode(true)).parse();\n      if (article && article.content) {\n        generateEPUB(article).then(() => {\n          sendResponse({ success: true });\n        }).catch(error => {\n          sendResponse({ success: false, error: error.message });\n        });\n      } else {\n        sendResponse({ success: false, error: 'No se pudo extraer el contenido del artículo' });\n      }\n    } catch (e) {\n      sendResponse({ success: false, error: e.message });\n    }\n    return true; // Indica que la respuesta es asíncrona\n  }\n}); 