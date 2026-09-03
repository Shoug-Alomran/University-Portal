import { signInAnonymously } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db, isFirebaseConfigured } from './firebase'

let setupPromise: Promise<string | null> | null = null

async function createWorkshopTask() {
  if (!isFirebaseConfigured || !auth || !db) return null

  const user = auth.currentUser ?? (await signInAnonymously(auth)).user

  await setDoc(
    doc(db, 'tasks', 'workshop-demo-task'),
    {
      title: 'Finish project outline',
      course: 'CS 101',
      dueDate: '2026-09-10',
      completed: false,
      ownerId: user.uid,
    },
    { merge: true },
  )

  return user.uid
}

export function ensureDemoTask() {
  setupPromise ??= createWorkshopTask()
  return setupPromise
}
