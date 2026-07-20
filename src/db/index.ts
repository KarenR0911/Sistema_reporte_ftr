import { openDB, deleteDB, type IDBPDatabase } from 'idb'

const DB_NAME = 'sistema-reporte-ftr'
const DB_VERSION = 7

type StoreName = 'atendidos' | 'necesidades' | 'usuarios' | 'salidas' | 'misiones' | 'personal' | 'insumos'

interface DeletedRecord {
  id: string
  store: string
  deleted_at: string
}

let dbInstance: IDBPDatabase | null = null

function createStores(db: IDBPDatabase) {
  const stores = ['atendidos', 'necesidades', 'usuarios', 'salidas', 'misiones', 'personal', 'insumos']
  for (const name of stores) {
    if (!db.objectStoreNames.contains(name)) {
      db.createObjectStore(name, { keyPath: 'id' })
    }
  }
  if (!db.objectStoreNames.contains('_deleted')) {
    db.createObjectStore('_deleted', { keyPath: 'id' })
  }
}

function deleteObsoleteStores(db: IDBPDatabase) {
  const obsolete = ['transporte']
  for (const name of obsolete) {
    if (db.objectStoreNames.contains(name)) {
      db.deleteObjectStore(name)
    }
  }
}

export async function getDB(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance

  try {
    dbInstance = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db, _oldVersion, _newVersion) {
        deleteObsoleteStores(db)
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

export async function clearStore(store: StoreName): Promise<void> {
  const db = await getDB()
  await db.clear(store)
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

export type { StoreName, DeletedRecord }
