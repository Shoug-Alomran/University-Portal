# University Portal

A React and TypeScript university portal demonstrating student, instructor, and administrator workflows for the ACM AI-Assisted Web Engineering Programming Jam.

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

## Connect Firebase

1. Open **Firebase Console → Project settings → General**.
2. Under **Your apps**, create or select a Web app.
3. Copy its Firebase configuration values into the matching entries in `.env`.
4. Open **Authentication → Sign-in method** and enable **Anonymous**.
5. Open **Firestore Database** and make sure the database has been created.
6. Restart the development server.

When the portal starts with Firebase configured, it automatically signs in anonymously and creates this document:

```text
tasks/workshop-demo-task
```

```json
{
  "title": "Finish project outline",
  "course": "CS 101",
  "dueDate": "2026-09-10",
  "completed": false,
  "ownerId": "the-current-firebase-user-uid"
}
```

The fixed document ID prevents duplicate demo documents. Reopening the app updates the same document.

## Verify the workshop screenshot

Open **Firebase Console → Firestore Database → Data → tasks → workshop-demo-task**. Keep the collection, document ID, and all five fields visible, then save the screenshot as:

```text
18-firestore-task-document-owner-id.png
```

## Commands

```bash
npm run dev
npm run build
npm run lint
npm run preview
```
