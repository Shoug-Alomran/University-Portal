import { useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged, signOut, type User } from 'firebase/auth'
import { addDoc, collection } from 'firebase/firestore'
import './App.css'
import AuthScreen from './AuthScreen'
import { ensureDemoTask } from './demoTask'
import { auth, db, isFirebaseConfigured } from './firebase'

type Role = 'Student' | 'Instructor' | 'Administrator'
type Course = { code: string; title: string; instructor: string; credits: number; seats: number; capacity: number; time: string; color: string; enrolled?: boolean }

const courses: Course[] = [
  { code: 'CS 241', title: 'Data Structures', instructor: 'Dr. Sarah Chen', credits: 3, seats: 4, capacity: 30, time: 'Sun · 10:00–11:20', color: 'blue', enrolled: true },
  { code: 'MATH 220', title: 'Linear Algebra', instructor: 'Prof. Mark Wilson', credits: 3, seats: 8, capacity: 35, time: 'Tue · 09:00–10:20', color: 'violet', enrolled: true },
  { code: 'ENG 105', title: 'Academic Writing', instructor: 'Dr. Aisha Rahman', credits: 2, seats: 0, capacity: 25, time: 'Thu · 12:00–13:20', color: 'orange' },
  { code: 'DES 130', title: 'Design Thinking', instructor: 'L. Foster', credits: 3, seats: 12, capacity: 30, time: 'Mon · 13:00–14:20', color: 'pink' },
]
const navByRole: Record<Role, string[]> = { Student: ['Overview', 'Course catalog', 'My schedule', 'Grades'], Instructor: ['Overview', 'My courses', 'Students', 'Gradebook'], Administrator: ['Overview', 'Accounts', 'Courses', 'Analytics'] }

function App() {
  const [role, setRole] = useState<Role>('Student')
  const [activeNav, setActiveNav] = useState('Overview')
  const [enrolled, setEnrolled] = useState(() => new Set(courses.filter((course) => course.enrolled).map((course) => course.code)))
  const [toast, setToast] = useState('')
  const [user, setUser] = useState<User | null | undefined>(() => isFirebaseConfigured ? undefined : null)
  const usedCredits = useMemo(() => courses.filter((course) => enrolled.has(course.code)).reduce((total, course) => total + course.credits, 0), [enrolled])

  useEffect(() => {
    if (!auth) return
    return onAuthStateChanged(auth, setUser)
  }, [])

  useEffect(() => {
    if (!user) return

    let active = true
    ensureDemoTask(user.uid)
      .then((ownerId) => {
        if (active && ownerId) setToast('Firestore demo task is ready')
      })
      .catch((error: unknown) => {
        console.error('Could not create the Firestore demo task:', error)
        if (active) setToast('Signed in, but Firestore blocked the demo task')
      })

    return () => {
      active = false
    }
  }, [user])

  if (user === undefined) {
    return <main className="auth-loading">Loading your portal…</main>
  }

  if (!user) {
    return <AuthScreen />
  }

  const displayName = user.displayName || user.email?.split('@')[0] || 'Portal user'
  const initials = displayName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
  const switchRole = (nextRole: Role) => { setRole(nextRole); setActiveNav('Overview'); setToast(`Viewing the ${nextRole.toLowerCase()} workspace`) }
  const addCourse = async () => {
    if (!db || !user) return

    try {
      await addDoc(collection(db, 'courses'), {
        code: 'CS 450',
        title: 'Cloud Computing',
        instructor: 'Dr. Noor Ali',
        credits: 3,
        capacity: 30,
        createdBy: user.uid,
      })
      setToast('Course added successfully')
    } catch (error: unknown) {
      console.error('Failed to add course to Firestore:', error)
      setToast('Could not add course. Open DevTools Console to investigate.')
    }
  }
  const toggleEnrollment = (course: Course) => {
    const next = new Set(enrolled)
    if (next.has(course.code)) { next.delete(course.code); setToast(`${course.code} was dropped from your schedule`) }
    else if (course.seats === 0) setToast(`${course.code} is currently full`)
    else if (usedCredits + course.credits > 18) setToast('This would exceed your 18-credit limit')
    else { next.add(course.code); setToast(`${course.code} was added to your schedule`) }
    setEnrolled(next)
  }
  return <main className="shell"><aside className="sidebar"><a className="brand" href="#top" onClick={() => setActiveNav('Overview')}><span className="brand-mark">U</span><span>univ.<b>portal</b></span></a><div className="role-switcher" aria-label="Preview role">{(Object.keys(navByRole) as Role[]).map((item) => <button className={role === item ? 'role active' : 'role'} onClick={() => switchRole(item)} key={item}>{item}</button>)}</div><nav>{navByRole[role].map((item, index) => <button key={item} className={activeNav === item ? 'nav-item selected' : 'nav-item'} onClick={() => setActiveNav(item)}><span className="nav-icon">{['◫', '▤', '◷', '✦'][index]}</span>{item}</button>)}</nav><div className="sidebar-bottom"><button className="nav-item"><span className="nav-icon">?</span>Help center</button><div className="profile"><span className="avatar">{initials}</span><span><b>{displayName}</b><small>{role}</small></span><button className="sign-out" onClick={() => auth && signOut(auth)}>Sign out</button></div></div></aside><section className="content" id="top"><header className="topbar"><div className="crumb">{role} <span>/</span> {activeNav}</div><div className="top-actions"><button className="round-button" aria-label="Notifications">♧<i /></button><button className="round-button" aria-label="Settings">⚙</button></div></header>{toast && <div className="toast" role="status">{toast}<button onClick={() => setToast('')} aria-label="Dismiss">×</button></div>}{role === 'Student' && <StudentView activeNav={activeNav} usedCredits={usedCredits} enrolled={enrolled} onToggle={toggleEnrollment} />}{role === 'Instructor' && <InstructorView activeNav={activeNav} setToast={setToast} />}{role === 'Administrator' && <AdminView activeNav={activeNav} setToast={setToast} onAddCourse={addCourse} />}</section></main>
}

function StudentView({ activeNav, usedCredits, enrolled, onToggle }: { activeNav: string; usedCredits: number; enrolled: Set<string>; onToggle: (course: Course) => void }) { const shownCourses = activeNav === 'My schedule' ? courses.filter((course) => enrolled.has(course.code)) : courses; return <div className="page"><section className="welcome"><div><p className="eyebrow">FALL 2026 · WEEK 7</p><h1>Good morning, Alex <span>✦</span></h1><p className="subtle">Here’s what’s happening with your semester.</p></div><button className="primary">View my schedule <span>→</span></button></section><section className="stats-grid"><Stat icon="◫" value={`${usedCredits} / 18`} label="Credits enrolled" color="purple" /><Stat icon="✓" value="2" label="Active courses" color="green" /><Stat icon="◷" value="68%" label="Semester complete" color="orange" /></section>{activeNav === 'Grades' ? <Grades /> : <><section className="section-heading"><div><p className="eyebrow">{activeNav === 'Course catalog' ? 'DISCOVER' : 'YOUR COURSES'}</p><h2>{activeNav === 'Course catalog' ? 'Course catalog' : 'Continue learning'}</h2></div><button className="text-button">View all <span>→</span></button></section><div className="course-grid">{shownCourses.map((course) => <CourseCard course={course} key={course.code} enrolled={enrolled.has(course.code)} onToggle={onToggle} />)}</div></>}</div> }
function Stat({ icon, value, label, color }: { icon: string; value: string; label: string; color: string }) { return <article className="stat"><span className={`stat-icon ${color}`}>{icon}</span><div><strong>{value}</strong><p>{label}</p></div></article> }
function CourseCard({ course, enrolled, onToggle }: { course: Course; enrolled: boolean; onToggle: (course: Course) => void }) { const full = course.seats === 0; return <article className="course-card"><div className={`course-art ${course.color}`}><span>{course.code}</span><b>{course.title.split(' ').map((word) => word[0]).join('').slice(0, 3)}</b><div className="art-orbit" /></div><div className="course-info"><div className="course-title"><span>{course.code}</span><em>{enrolled ? 'Enrolled' : full ? 'Full' : `${course.seats} seats left`}</em></div><h3>{course.title}</h3><p>{course.instructor}</p><div className="course-meta"><span>◷ {course.time}</span><span>{course.credits} credits</span></div><button className={enrolled ? 'outline course-action' : 'primary course-action'} onClick={() => onToggle(course)}>{enrolled ? 'Drop course' : full ? 'Join waitlist' : 'Enroll now'}</button></div></article> }
function Grades() { return <section className="grades-panel"><div className="section-heading"><div><p className="eyebrow">ACADEMIC RECORD</p><h2>Current grades</h2></div><button className="text-button">Download transcript</button></div><table><thead><tr><th>Course</th><th>Assessment</th><th>Grade</th><th>Updated</th></tr></thead><tbody><tr><td><b>CS 241</b><br /><small>Data Structures</small></td><td>Midterm examination</td><td><span className="grade a">A−</span></td><td>Oct 14, 2026</td></tr><tr><td><b>MATH 220</b><br /><small>Linear Algebra</small></td><td>Problem set 5</td><td><span className="grade b">B+</span></td><td>Oct 12, 2026</td></tr></tbody></table></section> }
function InstructorView({ activeNav, setToast }: { activeNav: string; setToast: (value: string) => void }) { return <div className="page"><section className="welcome"><div><p className="eyebrow">INSTRUCTOR WORKSPACE</p><h1>Your teaching at a glance</h1><p className="subtle">Manage your courses and support your students.</p></div><button className="primary" onClick={() => setToast('Gradebook opened for CS 241')}>Open gradebook <span>→</span></button></section><section className="stats-grid"><Stat icon="◫" value="2" label="Courses this term" color="purple" /><Stat icon="♙" value="54" label="Enrolled students" color="green" /><Stat icon="✓" value="81%" label="Grades submitted" color="orange" /></section><section className="grades-panel"><div className="section-heading"><div><p className="eyebrow">MY COURSES</p><h2>{activeNav === 'Students' ? 'Student roster' : 'Course activity'}</h2></div><button className="text-button" onClick={() => setToast('Course details are ready to edit')}>Edit course</button></div><table><thead><tr><th>Course</th><th>Enrollment</th><th>Next session</th><th>Action</th></tr></thead><tbody><tr><td><b>CS 241</b><br /><small>Data Structures</small></td><td>28 / 30 students</td><td>Sunday, 10:00</td><td><button className="inline-link" onClick={() => setToast('Roster opened')}>View roster</button></td></tr><tr><td><b>CS 318</b><br /><small>Database Systems</small></td><td>26 / 30 students</td><td>Monday, 14:00</td><td><button className="inline-link" onClick={() => setToast('Roster opened')}>View roster</button></td></tr></tbody></table></section></div> }
function AdminView({ activeNav, setToast, onAddCourse }: { activeNav: string; setToast: (value: string) => void; onAddCourse: () => Promise<void> }) { return <div className="page"><section className="welcome"><div><p className="eyebrow">ADMINISTRATION</p><h1>University operations</h1><p className="subtle">An overview of enrollment, capacity, and account activity.</p></div><button className="primary" onClick={onAddCourse}>Add a course <span>+</span></button></section><section className="stats-grid"><Stat icon="♙" value="2,481" label="Active students" color="purple" /><Stat icon="◫" value="186" label="Courses this term" color="green" /><Stat icon="◷" value="78%" label="Average fill rate" color="orange" /></section><section className="analytics"><article className="chart-card"><div className="section-heading"><div><p className="eyebrow">ENROLLMENT</p><h2>Weekly activity</h2></div><button className="text-button">This term⌄</button></div><div className="chart"><span style={{ height: '38%' }} /><span style={{ height: '54%' }} /><span style={{ height: '46%' }} /><span style={{ height: '72%' }} /><span style={{ height: '89%' }} /><span style={{ height: '65%' }} /><span style={{ height: '78%' }} /></div><div className="chart-labels"><span>Week 1</span><span>Week 3</span><span>Week 5</span><span>Week 7</span></div></article><article className="attention"><p className="eyebrow">NEEDS ATTENTION</p><h2>Capacity alerts</h2><div className="alert-row"><span>!</span><p><b>ENG 105</b><small>25 of 25 seats filled</small></p><button onClick={() => setToast('Capacity settings opened')}>Review</button></div><div className="alert-row"><span>!</span><p><b>14 students</b><small>Review student records</small></p><button onClick={() => setToast('Student credit limits opened')}>Review</button></div></article></section><p className="active-context">Currently viewing: {activeNav}</p></div> }
export default App
