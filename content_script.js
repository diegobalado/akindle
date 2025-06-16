// Este script se inyecta en la página para extraer el contenido y generar el EPUB
console.log('Content script cargado en:', window.location.href);

// Verificar que Readability esté disponible
if (typeof Readability === 'undefined') {
  console.error('Readability no está disponible en el contexto global');
  // Intentar cargar Readability desde el script
  const script = document.createElement('script');
  script.src = browser.runtime.getURL('readability.js');
  script.onload = () => {
    console.log('Readability cargado correctamente');
  };
  script.onerror = (error) => {
    console.error('Error al cargar Readability:', error);
  };
  (document.head || document.documentElement).appendChild(script);
}

function downloadEPUB(blob, filename) {
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    
    // Mostrar notificación
    const notification = document.createElement('div');
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.background = '#4CAF50';
    notification.style.color = 'white';
    notification.style.padding = '15px';
    notification.style.borderRadius = '4px';
    notification.style.zIndex = '10000';
    notification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    notification.textContent = 'Descargando ' + filename + '...';
    document.body.appendChild(notification);
    
    // Iniciar descarga
    a.click();
    
    // Limpiar después de 3 segundos
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      document.body.removeChild(notification);
    }, 3000);
  } catch (error) {
    console.error('Error en downloadEPUB:', error);
    throw error;
  }
}

async function generateEPUB(article) {
  try {
    if (!window.JSZip) {
      throw new Error('JSZip no está disponible');
    }
    
    const zip = new JSZip();
    
    // Archivos mínimos para EPUB
    zip.file('mimetype', 'application/epub+zip');
    zip.file('META-INF/container.xml', '<?xml version="1.0"?>' +
      '<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">' +
      '<rootfiles>' +
      '<rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>' +
      '</rootfiles>' +
      '</container>');

    // content.opf y toc.ncx básicos
    zip.file('OEBPS/content.opf', '<?xml version="1.0" encoding="UTF-8"?>' +
      '<package xmlns="http://www.idpf.org/2007/opf" version="2.0" unique-identifier="BookId">' +
      '<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">' +
      '<dc:title>' + article.title + '</dc:title>' +
      '<dc:language>es</dc:language>' +
      '<dc:identifier id="BookId">id-' + Date.now() + '</dc:identifier>' +
      '</metadata>' +
      '<manifest>' +
      '<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>' +
      '<item id="content" href="content.html" media-type="application/xhtml+xml"/>' +
      '</manifest>' +
      '<spine toc="ncx">' +
      '<itemref idref="content"/>' +
      '</spine>' +
      '</package>');

    zip.file('OEBPS/toc.ncx', '<?xml version="1.0" encoding="UTF-8"?>' +
      '<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">' +
      '<head>' +
      '<meta name="dtb:uid" content="id-' + Date.now() + '"/>' +
      '</head>' +
      '<docTitle>' +
      '<text>' + article.title + '</text>' +
      '</docTitle>' +
      '<navMap>' +
      '<navPoint id="navPoint-1" playOrder="1">' +
      '<navLabel>' +
      '<text>' + article.title + '</text>' +
      '</navLabel>' +
      '<content src="content.html"/>' +
      '</navPoint>' +
      '</navMap>' +
      '</ncx>');

    // Contenido principal
    zip.file('OEBPS/content.html', '<?xml version="1.0" encoding="UTF-8"?>' +
      '<html xmlns="http://www.w3.org/1999/xhtml">' +
      '<head>' +
      '<title>' + article.title + '</title>' +
      '</head>' +
      '<body>' +
      '<h1>' + article.title + '</h1>' +
      article.content +
      '</body>' +
      '</html>');

    const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip' });
    await downloadEPUB(blob, article.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.epub');
  } catch (error) {
    console.error('Error en generateEPUB:', error);
    throw error;
  }
}

// Escuchar mensajes del popup
browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'extract_and_convert') {
    try {
      // Verificar que Readability esté disponible
      if (typeof Readability === 'undefined') {
        throw new Error('Readability no está disponible. Por favor, recarga la página e intenta de nuevo.');
      }
      
      const article = new Readability(document.cloneNode(true)).parse();
      
      if (article && article.content) {
        generateEPUB(article).then(() => {
          sendResponse({ success: true });
        }).catch(error => {
          console.error('Error al generar EPUB:', error);
          sendResponse({ success: false, error: error.message });
        });
      } else {
        console.error('No se pudo extraer el contenido del artículo');
        sendResponse({ success: false, error: 'No se pudo extraer el contenido del artículo' });
      }
    } catch (e) {
      console.error('Error al procesar el artículo:', e);
      sendResponse({ success: false, error: e.message });
    }
    return true; // Indica que la respuesta es asíncrona
  }
}); 