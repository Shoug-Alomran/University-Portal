import { doc, setDoc } from 'firebase/firestore'
import { db, isFirebaseConfigured } from './firebase'

const pendingTasks = new Map<string, Promise<string | null>>()

async function createWorkshopTask(ownerId: string) {
  if (!isFirebaseConfigured || !db) return null

  await setDoc(
    doc(db, 'tasks', `workshop-demo-${ownerId}`),
    {
      title: 'Finish project outline',
      course: 'CS 101',
      dueDate: '2026-09-10',
      completed: false,
      ownerId,
    },
    { merge: true },
  )

  return ownerId
}

export function ensureDemoTask(ownerId: string) {
  const existing = pendingTasks.get(ownerId)
  if (existing) return existing

  const task = createWorkshopTask(ownerId)
  pendingTasks.set(ownerId, task)
  return task
}
