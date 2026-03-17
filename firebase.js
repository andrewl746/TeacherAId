// ── firebase.js ─────────────────────────────────────────────
// STEP: Replace the firebaseConfig object below with yours from Firebase Console
// Firebase Console → Project Settings → Your Apps → Web → SDK setup and configuration

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
         signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup }
  from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc, addDoc, collection,
         query, where, getDocs, orderBy, updateDoc, deleteDoc, serverTimestamp }
  from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// ── PASTE YOUR FIREBASE CONFIG HERE ─────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyByPlvvRG4L_ca73DOoXioEFnTYWmfx_aE",
  authDomain: "teacheraid-bffce.firebaseapp.com",
  databaseURL: "https://teacheraid-bffce-default-rtdb.firebaseio.com",
  projectId: "teacheraid-bffce",
  storageBucket: "teacheraid-bffce.firebasestorage.app",
  messagingSenderId: "1071740897637",
  appId: "1:1071740897637:web:bab73b5faa7d66a22bf98c",
  measurementId: "G-PEM9NQW1G6"
};
// ────────────────────────────────────────────────────────────

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// ── Auth helpers ─────────────────────────────────────────────
async function registerUser(email, password, name, role) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await setDoc(doc(db, 'users', cred.user.uid), { name, email, role, createdAt: serverTimestamp() });
  return cred.user;
}

async function loginUser(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

async function loginWithGoogle(role, name) {
  const cred = await signInWithPopup(auth, googleProvider);
  const userRef = doc(db, 'users', cred.user.uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    await setDoc(userRef, {
      name: name || cred.user.displayName || 'User',
      email: cred.user.email,
      role,
      createdAt: serverTimestamp()
    });
  }
  return cred.user;
}

async function logoutUser() {
  await signOut(auth);
  window.location.href = 'index.html';
}

async function getCurrentUserProfile() {
  const user = auth.currentUser;
  if (!user) return null;
  const snap = await getDoc(doc(db, 'users', user.uid));
  return snap.exists() ? { uid: user.uid, ...snap.data() } : null;
}

function requireAuth(redirectTo = 'index.html') {
  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, user => {
      unsub();
      if (user) resolve(user);
      else { window.location.href = redirectTo; reject(); }
    });
  });
}

// ── Question helpers ─────────────────────────────────────────
async function createQuestion(teacherUid, teacherName, data) {
  const ref = await addDoc(collection(db, 'questions'), {
    teacherUid,
    teacherName,
    concept:       data.concept     || '',
    subject:       data.subject     || 'Programming',
    prompt:        data.prompt      || '',
    codeSnippet:   data.codeSnippet || '',
    correctAnswer: data.correctAnswer || '',
    active:        true,
    createdAt:     serverTimestamp()
  });
  return ref.id;
}

async function getTeacherQuestions(teacherUid) {
  const q = query(collection(db, 'questions'), where('teacherUid', '==', teacherUid), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function setActiveQuestion(questionId, teacherUid) {
  await updateDoc(doc(db, 'questions', questionId), { active: true });
}

async function deleteQuestion(questionId) {
  await deleteDoc(doc(db, 'questions', questionId));
}

// ── Submission helpers ───────────────────────────────────────
async function saveSubmission(data) {
  const ref = await addDoc(collection(db, 'submissions'), {
    ...data,
    createdAt: serverTimestamp()
  });
  return ref.id;
}

async function getStudentSubmissions(studentUid) {
  const q = query(collection(db, 'submissions'), where('studentUid', '==', studentUid), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function getSubmissionsForTeacher(teacherUid) {
  const q = query(collection(db, 'submissions'), where('teacherUid', '==', teacherUid), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function getSubmissionsForQuestion(questionId) {
  const q = query(collection(db, 'submissions'), where('questionId', '==', questionId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── Student–Teacher enrolment ────────────────────────────────
async function enrolStudentWithTeacher(studentUid, teacherUid) {
  const ref = doc(db, 'enrolments', `${studentUid}_${teacherUid}`);
  await setDoc(ref, { studentUid, teacherUid, createdAt: serverTimestamp() }, { merge: true });
}

async function getStudentTeachers(studentUid) {
  const q = query(collection(db, 'enrolments'), where('studentUid', '==', studentUid));
  const snap = await getDocs(q);
  const teacherUids = snap.docs.map(d => d.data().teacherUid);
  const teachers = [];
  for (const uid of teacherUids) {
    const userSnap = await getDoc(doc(db, 'users', uid));
    if (userSnap.exists()) teachers.push({ uid, ...userSnap.data() });
  }
  return teachers;
}

async function getTeacherStudents(teacherUid) {
  const q = query(collection(db, 'enrolments'), where('teacherUid', '==', teacherUid));
  const snap = await getDocs(q);
  const studentUids = snap.docs.map(d => d.data().studentUid);
  const students = [];
  for (const uid of studentUids) {
    const userSnap = await getDoc(doc(db, 'users', uid));
    if (userSnap.exists()) students.push({ uid, ...userSnap.data() });
  }
  return students;
}

async function findTeacherByName(name) {
  const q = query(collection(db, 'users'), where('role', '==', 'teacher'), where('name', '==', name));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { uid: d.id, ...d.data() };
}

// ── Feedback history ─────────────────────────────────────────
async function getFeedbackHistory(teacherUid) {
  const snap = await getDoc(doc(db, 'feedbackHistory', teacherUid));
  return snap.exists() ? (snap.data().history || []) : [];
}

async function saveFeedbackHistory(teacherUid, history) {
  await setDoc(doc(db, 'feedbackHistory', teacherUid), { history }, { merge: true });
}

// ── Exports ──────────────────────────────────────────────────
export {
  auth, db, onAuthStateChanged,
  registerUser, loginUser, loginWithGoogle, logoutUser,
  getCurrentUserProfile, requireAuth,
  createQuestion, getTeacherQuestions, setActiveQuestion, deleteQuestion,
  saveSubmission, getStudentSubmissions, getSubmissionsForTeacher, getSubmissionsForQuestion,
  enrolStudentWithTeacher, getStudentTeachers, getTeacherStudents, findTeacherByName,
  getFeedbackHistory, saveFeedbackHistory
};