import { openDB, IDBPDatabase } from 'idb'

const DB_NAME = 'wavefiber-mobile'
const DB_VERSION = 1
const VOICE_STORE = 'voice-recordings'

interface CachedRecording {
  id: string
  complaintId: string
  blob: Blob
  duration: number
  createdAt: string
  synced: boolean
}

async function getDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(VOICE_STORE)) {
        const store = db.createObjectStore(VOICE_STORE, { keyPath: 'id' })
        store.createIndex('complaintId', 'complaintId')
        store.createIndex('synced', 'synced')
      }
    }
  })
}

export async function saveRecordingLocally(
  complaintId: string,
  blob: Blob,
  duration: number
): Promise<string> {
  const db = await getDB()
  const id = `rec-${Date.now()}-${Math.random().toString(36).slice(2)}`
  const record: CachedRecording = {
    id, complaintId, blob, duration,
    createdAt: new Date().toISOString(),
    synced: false
  }
  await db.put(VOICE_STORE, record)
  return id
}

export async function getLocalRecording(id: string): Promise<CachedRecording | undefined> {
  const db = await getDB()
  return db.get(VOICE_STORE, id)
}

export async function getUnsyncedRecordings(): Promise<CachedRecording[]> {
  const db = await getDB()
  const all = await db.getAll(VOICE_STORE)
  return all.filter(r => !r.synced)
}

export async function markRecordingSynced(id: string): Promise<void> {
  const db = await getDB()
  const record = await db.get(VOICE_STORE, id)
  if (record) {
    record.synced = true
    await db.put(VOICE_STORE, record)
  }
}
