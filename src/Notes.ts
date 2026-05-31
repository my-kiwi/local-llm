export const Notes = (): string => {
  return `
    <textarea id="notepad" placeholder="Start typing..."></textarea>
  `;
};

const DB_NAME = 'NotesDB';
const STORE_NAME = 'notes';
const NOTE_ID = 'main-note';

// Request persistent storage
async function requestPersistentStorage(): Promise<void> {
  if (navigator.storage && navigator.storage.persist) {
    const isPersisted = await navigator.storage.persisted();
    if (!isPersisted) {
      await navigator.storage.persist();
    }
  }
}

// Initialize IndexedDB
function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

// Load note from IndexedDB
async function loadNote(): Promise<string> {
  try {
    const db = await initDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(NOTE_ID);

      request.onsuccess = () => {
        resolve(request.result || '');
      };
      request.onerror = () => {
        resolve('');
      };
    });
  } catch {
    console.error('Failed to load note from IndexedDB');
    return '';
  }
}

// Save note to IndexedDB
async function saveNote(content: string): Promise<void> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(content, NOTE_ID);

      request.onsuccess = () => {
        resolve();
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Failed to save note to IndexedDB:', error);
  }
}

// Initialize the app
async function init(): Promise<void> {
  // Request persistent storage first
  await requestPersistentStorage();

  const textarea = document.getElementById('notepad') as HTMLTextAreaElement;

  if (!textarea) {
    console.error('Notepad textarea not found');
    return;
  }

  // Load existing note
  textarea.value = await loadNote();

  // Save on input with debouncing to avoid excessive storage writes
  let saveTimeout: ReturnType<typeof setTimeout>;
  textarea.addEventListener('input', () => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      saveNote(textarea.value).catch((error) => {
        console.error('Auto-save failed:', error);
      });
    }, 500);
  });

  // Also save when leaving the page
  window.addEventListener('beforeunload', () => {
    saveNote(textarea.value).catch((error) => {
      console.error('Save on unload failed:', error);
    });
  });

  // Focus the textarea automatically
  textarea.focus();
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
