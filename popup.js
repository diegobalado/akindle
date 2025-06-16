// Elementos del DOM
const convertBtn = document.getElementById('convert-btn');
const statusDiv = document.getElementById('status');

// Convertir a EPUB
convertBtn.addEventListener('click', async () => {
  statusDiv.textContent = 'Extrayendo artículo...';
  
  // Obtener la pestaña activa
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];
  
  // Enviar mensaje al content script
  browser.tabs.sendMessage(tab.id, { action: 'extract_and_convert' })
    .then(response => {
      if (response && response.success) {
        statusDiv.textContent = '¡EPUB generado y descargado!';
      } else {
        statusDiv.textContent = response?.error || 'Error al procesar la página.';
      }
    })
    .catch(error => {
      statusDiv.textContent = 'Error al procesar la página: ' + error.message;
    });
}); 