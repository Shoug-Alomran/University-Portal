import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
  type Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'

type StudyTask = {
  id: string
  title: string
  course: string
  dueDate: string
  completed: boolean
  createdAt?: Timestamp
}

export default function TaskTracker({ ownerId }: { ownerId: string }) {
  const [tasks, setTasks] = useState<StudyTask[]>([])
  const [title, setTitle] = useState('')
  const [course, setCourse] = useState('CS 101')
  const [dueDate, setDueDate] = useState('2026-09-10')
  const [loading, setLoading] = useState(Boolean(db))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(db ? '' : 'Firebase is not configured.')

  useEffect(() => {
    if (!db) return

    const taskQuery = query(collection(db, 'tasks'), where('ownerId', '==', ownerId))
    return onSnapshot(
      taskQuery,
      (snapshot) => {
        const nextTasks = snapshot.docs
          .map((taskDocument) => ({ id: taskDocument.id, ...taskDocument.data() }) as StudyTask)
          .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
        setTasks(nextTasks)
        setLoading(false)
        setError('')
      },
      (snapshotError) => {
        console.error('Failed to load study tasks:', snapshotError)
        setError('Could not load your tasks. Check the Firestore rules.')
        setLoading(false)
      },
    )
  }, [ownerId])

  const completedCount = useMemo(() => tasks.filter((task) => task.completed).length, [tasks])

  async function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!db || !title.trim() || !course.trim() || !dueDate) return

    setSaving(true)
    setError('')
    try {
      await addDoc(collection(db, 'tasks'), {
        title: title.trim(),
        course: course.trim(),
        dueDate,
        completed: false,
        ownerId,
        createdAt: new Date(),
      })
      setTitle('')
    } catch (writeError) {
      console.error('Failed to add study task:', writeError)
      setError('Could not save the task. Check the Firestore rules.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleTask(task: StudyTask) {
    if (!db) return
    try {
      await updateDoc(doc(db, 'tasks', task.id), { completed: !task.completed })
    } catch (writeError) {
      console.error('Failed to update study task:', writeError)
      setError('Could not update the task.')
    }
  }

  async function removeTask(taskId: string) {
    if (!db) return
    try {
      await deleteDoc(doc(db, 'tasks', taskId))
    } catch (writeError) {
      console.error('Failed to delete study task:', writeError)
      setError('Could not delete the task.')
    }
  }

  return (
    <section className="task-workspace">
      <div className="task-hero">
        <div>
          <p className="eyebrow">STUDY PLANNER</p>
          <h1>My study tasks</h1>
          <p className="subtle">Your tasks are securely saved and synced through Firestore.</p>
        </div>
        <div className="task-progress">
          <strong>{completedCount}/{tasks.length}</strong>
          <span>completed</span>
        </div>
      </div>

      <div className="task-layout">
        <form className="task-form" onSubmit={addTask}>
          <p className="eyebrow">NEW TASK</p>
          <h2>Add a study task</h2>
          <label>Task title<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Finish project outline" required /></label>
          <label>Course<input value={course} onChange={(event) => setCourse(event.target.value)} placeholder="CS 101" required /></label>
          <label>Due date<input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} required /></label>
          <button className="primary" disabled={saving}>{saving ? 'Saving…' : 'Add task'}</button>
        </form>

        <div className="task-list-panel">
          <div className="task-list-heading"><div><p className="eyebrow">PERSISTENT DATA</p><h2>Upcoming tasks</h2></div><span className="sync-badge">● Live sync</span></div>
          {error && <p className="task-error" role="alert">{error}</p>}
          {loading ? <p className="task-empty">Loading your tasks…</p> : tasks.length === 0 ? <p className="task-empty">No tasks yet. Add your first study task.</p> : (
            <div className="task-list">
              {tasks.map((task) => (
                <article className={task.completed ? 'task-row completed' : 'task-row'} key={task.id}>
                  <button className="task-check" onClick={() => toggleTask(task)} aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}>{task.completed ? '✓' : ''}</button>
                  <div><h3>{task.title}</h3><p><span>{task.course}</span> Due {task.dueDate}</p></div>
                  <button className="task-delete" onClick={() => removeTask(task.id)} aria-label="Delete task">×</button>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
