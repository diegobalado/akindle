// Background service worker
console.log('Background script iniciado');

// Por ahora está vacío, pero podemos usarlo para futuras funcionalidades 

// Escuchar mensajes del popup
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background script recibió mensaje:', message);
  return true;
});

// Escuchar cuando se carga una pestaña
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    console.log('Pestaña cargada:', tabId, tab.url);
  }
}); 