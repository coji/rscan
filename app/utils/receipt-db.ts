// app/utils/receiptDb.ts

// 型定義
export type Receipt = {
  id: string
  image: string
  date: string
  amount: string
  store: string
  category: string
  timestamp: string
}

// IndexedDBの設定
export async function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ReceiptScannerDB', 1)

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains('receipts')) {
        db.createObjectStore('receipts', { keyPath: 'id' })
      }
    }

    request.onsuccess = (event: Event) =>
      resolve((event.target as IDBOpenDBRequest).result)
    request.onerror = (event: Event) =>
      reject((event.target as IDBOpenDBRequest).error)
  })
}

export async function saveReceipt(
  db: IDBDatabase,
  receipt: Receipt,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['receipts'], 'readwrite')
    const store = transaction.objectStore('receipts')
    const request = store.put(receipt)

    request.onsuccess = () => resolve()
    request.onerror = (event: Event) =>
      reject((event.target as IDBRequest).error)
  })
}

export async function getReceiptById(
  db: IDBDatabase,
  id: string,
): Promise<Receipt | null> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['receipts'], 'readonly')
    const store = transaction.objectStore('receipts')
    const request = store.get(id)

    request.onsuccess = (event) => {
      const result = (event.target as IDBRequest).result
      resolve(result || null)
    }
    request.onerror = (event) => reject((event.target as IDBRequest).error)
  })
}

export async function getAllReceipts(db: IDBDatabase): Promise<Receipt[]> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['receipts'], 'readonly')
    const store = transaction.objectStore('receipts')
    const request = store.getAll()

    request.onsuccess = (event) => resolve((event.target as IDBRequest).result)
    request.onerror = (event) => reject((event.target as IDBRequest).error)
  })
}
