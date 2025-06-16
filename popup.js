// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
  console.log('Popup script iniciado');
  
  // Elementos del DOM
  const convertBtn = document.getElementById('convert-btn');
  const statusDiv = document.getElementById('status');
  const kindleEmailInput = document.getElementById('kindle-email');

  if (!convertBtn) {
    console.error('No se encontró el botón de convertir');
    return;
  }
  console.log('Botón de convertir encontrado');

  if (!statusDiv) {
    console.error('No se encontró el div de estado');
    return;
  }
  console.log('Div de estado encontrado');

  if (!kindleEmailInput) {
    console.error('No se encontró el input de email');
    return;
  }
  console.log('Input de email encontrado');

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
    console.log('Botón de convertir clickeado');
    
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
      console.log('Consultando pestaña activa...');
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      console.log('Pestañas encontradas:', tabs);
      
      if (!tabs || tabs.length === 0) {
        throw new Error('No se encontró ninguna pestaña activa');
      }
      
      const tab = tabs[0];
      console.log('Pestaña activa:', tab.id, tab.url);
      
      // Enviar mensaje al content script
      console.log('Enviando mensaje al content script...');
      browser.tabs.sendMessage(tab.id, { 
        action: 'extract_and_convert',
        kindleEmail: email
      })
        .then(response => {
          console.log('Respuesta recibida:', response);
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