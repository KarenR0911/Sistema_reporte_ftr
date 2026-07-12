import { openDB, deleteDB, type IDBPDatabase } from 'idb'

const DB_NAME = 'sistema-reporte-ftr'
const DB_VERSION = 3

type StoreName = 'misiones' | 'insumos' | 'transporte' | 'personal' | 'atendidos' | 'necesidades' | 'usuarios'

interface DeletedRecord {
  id: string
  store: string
  deleted_at: string
}

let dbInstance: IDBPDatabase | null = null

function createStores(db: IDBPDatabase) {
  const stores = ['misiones', 'insumos', 'transporte', 'personal', 'atendidos', 'necesidades', 'usuarios']
  for (const name of stores) {
    if (!db.objectStoreNames.contains(name)) {
      db.createObjectStore(name, { keyPath: 'id' })
    }
  }
  if (!db.objectStoreNames.contains('_deleted')) {
    db.createObjectStore('_deleted', { keyPath: 'id' })
  }
}

export async function getDB(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance

  try {
    dbInstance = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db, _oldVersion, _newVersion, transaction) {
        createStores(db)
      },
    })
  } catch (err) {
    if (err instanceof Error && err.name === 'VersionError') {
      await deleteDB(DB_NAME)
      dbInstance = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          createStores(db)
        },
      })
    } else {
      throw err
    }
  }

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

export async function addDeletedId(store: string, id: string): Promise<void> {
  const db = await getDB()
  await db.put('_deleted', { id: `${store}:${id}`, store, deleted_at: new Date().toISOString() } as never)
}

export async function getDeletedIds(): Promise<DeletedRecord[]> {
  const db = await getDB()
  return db.getAll('_deleted')
}

export async function clearDeletedId(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('_deleted', id)
}

export async function clearAllDeleted(): Promise<void> {
  const db = await getDB()
  const all = await db.getAll('_deleted')
  for (const item of all) {
    await db.delete('_deleted', item.id)
  }
}

export type { StoreName, DeletedRecord }
