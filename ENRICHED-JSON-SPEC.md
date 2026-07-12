# Enriched JSON Specification — AACS Devengers

## Overview

The AI Intent Parser reads each requirement's `description` field and adds
structured fields to it. The original fields (`description`, `number`,
`correct`, `message`) are **never modified**. The enriched result is stored
in `assignments.enrichedRequirements` in MongoDB.

When an instructor updates the JSON via `PATCH /api/assignments/:id`, the
`enrichedRequirements` field is cleared and re-enrichment is triggered
automatically.

---

## MongoDB storage

```
assignments collection
├── assignmentNo: 1
├── batch: 12
├── title: "Focus App UI"
├── status: "active"
├── version: 1
├── originalRequirements: { ...exact instructor JSON... }
└── enrichedRequirements: { ...same shape + added fields... }
```

Queried by:

- `GET /api/assignments?batch=12&assignmentNo=1`
- `GET /api/assignments/batch/12/assignment/1`
- `GET /api/assignments/:id`

---

## Added fields per requirement

| Field            | Type           | Description                      |
| ---------------- | -------------- | -------------------------------- |
| `checkType`      | string enum    | Category of check                |
| `automationTier` | 1 \| 2 \| 3    | Which engine handles this        |
| `selectors`      | string[]       | CSS selectors tried in order     |
| `requiredState`  | object \| null | App state needed before checking |
| `confidence`     | 0.0–1.0        | Parser confidence in this rule   |

---

## checkType enum values

| Value                | Tier | Meaning                                   |
| -------------------- | ---- | ----------------------------------------- |
| `ui-element`         | 1    | Element must exist in DOM                 |
| `ui-count`           | 1    | Specific number of elements expected      |
| `ui-position`        | 1    | Element at left / center / right          |
| `functional-auth`    | 2    | Requires logged-in session to check       |
| `functional-crud`    | 2    | Requires DB data and user interaction     |
| `conditional-logic`  | 3    | Visible only under specific app state     |
| `visual-figma`       | 3    | Compare screenshot to Figma reference     |
| `needsClarification` | —    | Parser could not determine rule — flagged |

---

## Confidence routing

| Confidence                 | Outcome                           |
| -------------------------- | --------------------------------- |
| ≥ 0.75 (default threshold) | Auto-committed to result          |
| < 0.75                     | Routed to instructor review queue |
| `needsClarification`       | Always routed to review queue     |

Threshold is configurable per assignment via `confidenceThreshold` field.

---

## Full example — Assignment 1 (Tier 1 only)

### Original instructor JSON (stored in `originalRequirements`)

```json
{
  "Navbar": {
    "req-1": {
      "description": "logo/website name on the left",
      "number": "2",
      "correct": true,
      "message": "not okay."
    },
    "req-2": {
      "description": "Signup button on the right",
      "number": "2",
      "correct": true,
      "message": "not okay."
    }
  },
  "Banner-Section": {
    "req-1": {
      "description": "Background Image",
      "number": "4",
      "correct": true,
      "message": "not okay."
    },
    "req-2": {
      "description": "Heading in the center",
      "number": "3",
      "correct": true,
      "message": "not okay."
    },
    "req-3": {
      "description": "Stay Focused button in the center",
      "number": "3",
      "correct": true,
      "message": "not okay."
    }
  }
}
```

### Enriched output (stored in `enrichedRequirements`)

```json
{
  "Navbar": {
    "req-1": {
      "description": "logo/website name on the left",
      "number": "2",
      "correct": true,
      "message": "not okay.",
      "checkType": "ui-position",
      "automationTier": 1,
      "selectors": ["nav img", "nav svg", "nav .logo", "nav a:first-child", "header .logo", ".navbar-brand"],
      "requiredState": null,
      "confidence": 0.92
    },
    "req-2": {
      "description": "Signup button on the right",
      "number": "2",
      "correct": true,
      "message": "not okay.",
      "checkType": "ui-position",
      "automationTier": 1,
      "selectors": [
        "nav button",
        "nav a.signup",
        "nav .btn-signup",
        "header button",
        "a[href*='signup']",
        "a[href*='register']"
      ],
      "requiredState": null,
      "confidence": 0.89
    }
  },
  "Banner-Section": {
    "req-1": {
      "description": "Background Image",
      "number": "4",
      "correct": true,
      "message": "not okay.",
      "checkType": "ui-element",
      "automationTier": 1,
      "selectors": [".banner", ".hero", "section:first-of-type", "[class*='banner']", "[class*='hero']"],
      "requiredState": null,
      "confidence": 0.85
    },
    "req-2": {
      "description": "Heading in the center",
      "number": "3",
      "correct": true,
      "message": "not okay.",
      "checkType": "ui-position",
      "automationTier": 1,
      "selectors": [".banner h1", ".hero h1", "section:first-of-type h1", "[class*='banner'] h1"],
      "requiredState": null,
      "confidence": 0.88
    },
    "req-3": {
      "description": "Stay Focused button in the center",
      "number": "3",
      "correct": true,
      "message": "not okay.",
      "checkType": "ui-position",
      "automationTier": 1,
      "selectors": [
        ".banner button",
        ".hero button",
        ".banner a.btn",
        "[class*='banner'] button",
        "button:contains('Stay Focused')",
        "a:contains('Stay Focused')"
      ],
      "requiredState": null,
      "confidence": 0.83
    }
  }
}
```

---

## Full example — Assignment 11 (Tier 1 + Tier 2 + Tier 3)

```json
{
  "Layout-Structure": {
    "req-1": {
      "description": "Navbar (Not Logged In): Show Logo, Home, All Scholarships, Login, and Register Button.",
      "number": "2",
      "correct": true,
      "message": "not okay.",
      "checkType": "ui-element",
      "automationTier": 1,
      "selectors": [
        "nav .logo",
        "nav img",
        "nav a[href='/']",
        "nav a[href*='scholarship']",
        "nav a:contains('Login')",
        "nav button:contains('Register')"
      ],
      "requiredState": null,
      "confidence": 0.91
    },
    "req-2": {
      "description": "Navbar (Logged In): Show Logo, Home, All Scholarships, and User Profile Image with a dropdown.",
      "number": "2",
      "correct": true,
      "message": "not okay.",
      "checkType": "functional-auth",
      "automationTier": 2,
      "selectors": ["nav img.avatar", "nav .user-profile", "nav .dropdown", ".navbar .profile-img"],
      "requiredState": { "authRole": "student" },
      "confidence": 0.88
    }
  },
  "Dashboard-Student": {
    "req-1": {
      "description": "My Applications: Table of applied scholarships.",
      "number": "5",
      "correct": true,
      "message": "not okay.",
      "checkType": "functional-crud",
      "automationTier": 2,
      "selectors": ["table", ".applications-table", "[class*='application'] table"],
      "requiredState": { "authRole": "student", "hasApplications": true },
      "confidence": 0.84
    },
    "sub_req_14": {
      "description": "Action 'Pay': Visible only if status is 'pending' AND payment status is 'unpaid'.",
      "number": "1",
      "correct": true,
      "message": "not okay.",
      "checkType": "conditional-logic",
      "automationTier": 3,
      "selectors": ["button[data-action='pay']", ".pay-btn", "button:contains('Pay')", "a:contains('Pay')"],
      "requiredState": {
        "authRole": "student",
        "applicationStatus": "pending",
        "paymentStatus": "unpaid"
      },
      "confidence": 0.61
    }
  },
  "Challenges": {
    "req-1": {
      "description": "JWT/Firebase Token Verification: Secure APIs with middleware.",
      "number": "3",
      "correct": true,
      "message": "not okay.",
      "checkType": "needsClarification",
      "automationTier": 3,
      "selectors": [],
      "requiredState": null,
      "confidence": 0.28
    }
  }
}
```

---

## Instructor update flow

```
Instructor edits requirements JSON
           ↓
PATCH /api/assignments/:id
  { originalRequirements: { ...new JSON... }, updatedBy: "instructor" }
           ↓
Server validates JSON shape
           ↓
Saves to assignments.originalRequirements
Clears assignments.enrichedRequirements
Bumps assignments.version by 1
Sets assignments.status = "draft"
           ↓
Re-triggers AI Intent Parser (background job)
           ↓
New enrichedRequirements saved to MongoDB
Status set back to "active"
```

---

## Key rules

1. `originalRequirements` is the instructor's source of truth — never auto-modified
2. `enrichedRequirements` is always derived — safe to clear and regenerate
3. When instructor updates JSON → version bumps, enrichment re-runs automatically
4. `needsClarification` results always go to review queue, never auto-committed
5. Tier 3 results never auto-commit regardless of confidence score
