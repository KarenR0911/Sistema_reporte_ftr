import { openDB, type IDBPDatabase } from 'idb'

const DB_NAME = 'sistema-reporte-ftr'
const DB_VERSION = 1

type StoreName = 'misiones' | 'insumos' | 'transporte' | 'personal' | 'atendidos' | 'necesidades' | 'usuarios'

let dbInstance: IDBPDatabase | null = null

export async function getDB(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance

  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('misiones')) {
        db.createObjectStore('misiones', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('insumos')) {
        db.createObjectStore('insumos', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('transporte')) {
        db.createObjectStore('transporte', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('personal')) {
        db.createObjectStore('personal', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('atendidos')) {
        db.createObjectStore('atendidos', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('necesidades')) {
        db.createObjectStore('necesidades', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('usuarios')) {
        db.createObjectStore('usuarios', { keyPath: 'id' })
      }
    },
  })

  return dbInstance
}

export async function getAll<T>(store: StoreName): Promise<T[]> {
  const db = await getDB()
  return db.getAll(store)
}

export async function getById<T>(store: StoreName, id: string): Promise<T | undefined> {
  const db = await getDB()
  return db.get(store, id)
}

export async function getByIndex<T>(store: StoreName, index: string, value: string): Promise<T[]> {
  const db = await getDB()
  return db.getAllFromIndex(store, index, value)
}

export async function addItem<T>(store: StoreName, item: T): Promise<void> {
  const db = await getDB()
  await db.add(store, item as never)
}

export async function putItem<T>(store: StoreName, item: T): Promise<void> {
  const db = await getDB()
  await db.put(store, item as never)
}

export async function deleteItem(store: StoreName, id: string): Promise<void> {
  const db = await getDB()
  await db.delete(store, id)
}

export async function getPending<T>(store: StoreName): Promise<T[]> {
  const db = await getDB()
  const all = await db.getAll(store)
  return all.filter((item: Record<string, unknown>) => item.status_sync === 'pending') as T[]
}

export async function markAsSynced(store: StoreName, id: string): Promise<void> {
  const db = await getDB()
  const item = await db.get(store, id)
  if (item) {
    item.status_sync = 'synced'
    await db.put(store, item)
  }
}

export type { StoreName }
