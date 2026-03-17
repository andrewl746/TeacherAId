# TeacherAId: AI-Powered Classroom Insight Engine

## Overview

TeacherAId is an AI-powered classroom analytics system designed to help teachers understand **how students are reasoning about problems**, not just whether answers are correct.

The system analyzes student submissions, identifies **misconceptions and reasoning patterns**, and generates **actionable teaching insights** at both the **individual student level** and the **entire class level**.

Instead of grading alone, TeacherAId acts as an **AI teaching assistant** that surfaces learning patterns, highlights common errors, and suggests targeted reteaching strategies.

---

# Core Idea

Traditional educational systems track:

* Correct vs. incorrect answers
* Scores
* Completion rates

TeacherAId goes deeper by identifying:

* *why* a student made an error
* *what concept* they misunderstood
* *which misconceptions are spreading in a class*

The system continuously builds a **learning memory** of the classroom and uses it to generate insights for teachers.

---

# Key Features

## 1. AI Submission Analysis

When a student submits an answer, the system:

1. Evaluates correctness
2. Identifies the **misconception** behind the mistake
3. Extracts the **reasoning pattern** the student used
4. Generates **evidence** from the student's own words

This works for any subject, whether thats Python, C++, Math, Biology, or anything else.

---

## 2. Student Learning Memory

TeacherAId maintains a **persistent memory of student misconceptions** in Firestore.

For each student, the system tracks:

* recurring misconceptions
* reasoning patterns
* evidence examples
* submission history

This allows teachers to see **how a student's understanding evolves over time**.

---

## 3. Classroom Learning Memory

The system aggregates errors across the entire class, enabling:

* identifying **class-wide misconceptions**
* detecting **emerging vs persistent issues**
* measuring **how many students are affected**

---

## 4. AI Teacher Insights

The system generates **teacher-friendly summaries** of what is happening in the classroom, including reteach suggestions and intervention recommendations for individual students.

---

## 5. Adaptive Question Generation

The teacher dashboard tracks the class's weakest concept and automatically surfaces it when generating new questions, so the AI prioritises areas where students are struggling most.

---

# Dashboard Capabilities

## Teacher Portal

* Question bank (create questions manually or generate them with AI)
* Student view (per-student submissions, misconceptions, and AI intervention suggestions)
* Class analytics (charts showing error distribution by concept, top misconceptions, reteach suggestions, and per-student breakdown)

## Student Portal

* Class dashboard (join multiple teachers, see all questions per class)
* Question answering (submit answers with reasoning, get instant AI feedback)
* Review (go back and view previous answers and AI analysis)

---

# Architecture

## Frontend

Plain HTML, CSS, and JavaScript. Runs entirely in the browser.

## Auth and Database

* **Firebase Authentication** (email/password and Google sign-in)
* **Firestore** (stores questions, submissions, enrolments, and feedback history with row-level security rules)

## AI

* **Claude (Anthropic)** via a **Cloudflare Worker proxy** (handles submission classification, question generation, class insights, and student intervention suggestions)
* The Anthropic API key lives only in the Cloudflare Worker environment variable, never in the browser

## Security

* Firestore security rules enforce ownership on every read and write
* Submissions are immutable (nobody can edit or delete them after creation)
* Cloudflare Worker rate limits requests to 20 per minute per IP
* Firebase App Check verifies requests come from the actual app

---

# Supported Subjects

TeacherAId can be used for any subject. The AI analysis works for any topic where students can explain their reasoning in writing (e.g., programming, math, science, humanities).

---

# Why This Matters

Teachers often lack visibility into **how students are thinking**.

TeacherAId helps bridge this gap by providing:

* explainable AI feedback
* actionable classroom insights
* student reasoning analysis

The goal is to help teachers **teach more effectively using AI-powered learning analytics**.
