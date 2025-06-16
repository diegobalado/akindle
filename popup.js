// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
  // Elementos del DOM
  const convertBtn = document.getElementById('convert-btn');
  const statusDiv = document.getElementById('status');
  const kindleEmailInput = document.getElementById('kindle-email');

  if (!convertBtn || !statusDiv || !kindleEmailInput) {
    console.error('Error: No se encontraron elementos necesarios del DOM');
    return;
  }

  // Cargar email guardado
  browser.storage.local.get('kindleEmail').then(result => {
    if (result.kindleEmail) {
      kindleEmailInput.value = result.kindleEmail;
    }
  });

  // Guardar email cuando cambie
  kindleEmailInput.addEventListener('change', () => {
    const email = kindleEmailInput.value.trim();
    if (email) {
      browser.storage.local.set({ kindleEmail: email });
    }
  });

  // Convertir a EPUB
  convertBtn.addEventListener('click', async () => {
    // Validar email
    const email = kindleEmailInput.value.trim();
    if (!email) {
      statusDiv.textContent = 'Por favor, ingresa tu dirección de email de Kindle';
      return;
    }

    if (!email.endsWith('@kindle.com')) {
      statusDiv.textContent = 'Por favor, ingresa una dirección de email de Kindle válida';
      return;
    }

    statusDiv.textContent = 'Extrayendo artículo...';
    
    try {
      // Obtener la pestaña activa
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      
      if (!tabs || tabs.length === 0) {
        throw new Error('No se encontró ninguna pestaña activa');
      }
      
      const tab = tabs[0];
      
      // Enviar mensaje al content script
      browser.tabs.sendMessage(tab.id, { 
        action: 'extract_and_convert',
        kindleEmail: email
      })
        .then(response => {
          if (response && response.success) {
            statusDiv.innerHTML = `
              ¡EPUB generado!<br>
              <small>El archivo se ha enviado a ${email}</small>
            `;
          } else {
            statusDiv.textContent = response?.error || 'Error al procesar la página.';
          }
        })
        .catch(error => {
          console.error('Error al enviar mensaje:', error);
          statusDiv.textContent = 'Error al procesar la página: ' + error.message;
        });
    } catch (error) {
      console.error('Error en el proceso:', error);
      statusDiv.textContent = 'Error: ' + error.message;
    }
  });
}); 