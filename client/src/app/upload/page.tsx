'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Upload, ArrowRight, Loader2, AlertCircle, CheckCircle, FilePlus, ChevronRight, Layers, Trash2, Plus, Info, Globe, GitFork, User, PlayCircle, Sparkles } from 'lucide-react'
import { AssignmentJSON, Assignment } from '@/types'
import AssignmentPreview from '@/components/upload/preview'
import { createAssignment, fetchAssignmentsList, updateAssignment, deleteAssignment, reEnrichAssignment } from '../lib/api'
import Editor from "@monaco-editor/react"
import Link from 'next/link'
import { useToast } from '@/components/Toast'

interface UploadFormInputs {
  assignmentJSON: string
}

export default function UploadPage() {
  const { toast } = useToast()
  const {
    setValue,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UploadFormInputs>({
    mode: 'onChange',
    defaultValues: {
      assignmentJSON: '',
    },
  })

  const jsonText = watch('assignmentJSON')
  const [parsedAssignment, setParsedAssignment] = useState<AssignmentJSON | null>(null)
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [assignmentId, setAssignmentId] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [step, setStep] = useState<'input' | 'preview' | 'progress'>('input')

  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loadingAssignments, setLoadingAssignments] = useState(true)

  // Mode select: 'json' or 'form'
  const [mode, setMode] = useState<'form' | 'json'>('form')

  // Edit action state: if editing an existing assignment
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null)
  const [reEnrichLoading, setReEnrichLoading] = useState(false)

  // Direct Input Form State
  const [formBatch, setFormBatch] = useState('14')
  const [formNo, setFormNo] = useState('1')
  const [formTitle, setFormTitle] = useState('Assignment 1 - DevConf 2026')
  const [formFigma, setFormFigma] = useState('https://www.figma.com/design/8HvvXM2FypH529ucwlvZDv/DevConf2026')
  const [formRequirements, setFormRequirements] = useState<Array<{
    id: string;
    section: string;
    reqKey: string;
    description: string;
    number: string; // weight/marks
    checkType: string;
    automationTier: number;
    selectors: string;
    correct: boolean;
    message: string;
  }>>([
    { id: '1', section: 'Navbar', reqKey: 'req-1', description: "Logo aligned to the left containing the text 'DEVCONF 2026'", number: '1', checkType: 'static-ui', automationTier: 1, selectors: 'nav .logo, header .logo', correct: false, message: 'not okay.' },
    { id: '2', section: 'Navbar', reqKey: 'req-2', description: "Menu items centered (Speakers, Schedule, Tracks, Venue, Blog)", number: '2', checkType: 'static-ui', automationTier: 1, selectors: 'nav ul, header ul', correct: false, message: 'not okay.' },
    { id: '3', section: 'Challenge-Section', reqKey: 'req-challenge-1', description: "Highlight three pricing tier cards on hover visually", number: '10', checkType: 'css-property', automationTier: 1, selectors: '.pricing-card', correct: false, message: 'not okay.' },
  ])

  const refreshAssignments = async () => {
    setLoadingAssignments(true)
    try {
      const data = await fetchAssignmentsList()
      setAssignments(data)
    } catch (err) {
      console.error('Failed to load assignments:', err)
    } finally {
      setLoadingAssignments(false)
    }
  }

  useEffect(() => {
    refreshAssignments()
  }, [])

  // JSON Template example
  const loadJsonTemplate = () => {
    const template = {
      assignmentMeta: {
        title: "Assignment 1 - DevConf 2026 UI",
        batch: 14,
        type: "static-ui",
        version: 1
      },
      figmaUrl: "https://www.figma.com/design/8HvvXM2FypH529ucwlvZDv/DevConf2026",
      requirements: {
        "Navbar": {
          "req-1": {
            "description": "Logo aligned to the left containing the text 'DEVCONF 2026'",
            "number": "1",
            "correct": false,
            "message": "not okay.",
            "checkType": "static-ui",
            "automationTier": 1,
            "selectors": ["nav .logo", "header .logo"]
          },
          "req-2": {
            "description": "Menu items centered (Speakers, Schedule, Tracks, Venue, Blog)",
            "number": "2",
            "correct": false,
            "message": "not okay.",
            "checkType": "static-ui",
            "automationTier": 1,
            "selectors": ["nav ul", "header ul"]
          }
        },
        "Challenge-Section": {
          "req-challenge-1": {
            "description": "Highlight three pricing tier cards on hover visually",
            "number": "10",
            "correct": false,
            "message": "not okay.",
            "checkType": "css-property",
            "automationTier": 1,
            "selectors": [".pricing-card"]
          }
        }
      }
    }
    setValue('assignmentJSON', JSON.stringify(template, null, 2))
  }

  const handleAddFormRow = (isChallenge: boolean) => {
    const newId = String(Date.now() + Math.random())
    const sectionName = isChallenge ? 'Challenge-Section' : 'Navbar'
    const keyPrefix = isChallenge ? 'req-challenge-' : 'req-'
    
    setFormRequirements([
      ...formRequirements,
      {
        id: newId,
        section: sectionName,
        reqKey: `${keyPrefix}${formRequirements.length + 1}`,
        description: '',
        number: isChallenge ? '10' : '1',
        checkType: 'static-ui',
        automationTier: 1,
        selectors: '',
        correct: false,
        message: 'not okay.'
      }
    ])
  }

  const handleRemoveFormRow = (id: string) => {
    setFormRequirements(formRequirements.filter(r => r.id !== id))
  }

  const handleUpdateFormRow = (id: string, field: string, val: any) => {
    setFormRequirements(formRequirements.map(r => r.id === id ? { ...r, [field]: val } : r))
  }

  // Load existing assignment for update
  const handleLoadAssignment = (id: string) => {
    const found = assignments.find(a => a._id === id)
    if (!found) return

    setEditingAssignmentId(found._id)
    setFormBatch(String(found.batch))
    setFormNo(String(found.assignmentNo))
    setFormTitle(found.title)
    setFormFigma(found.figmaUrl || '')

    const reqs = found.originalRequirements || found.enrichedRequirements || {}
    const parsedRows: any[] = []
    let counter = 1

    Object.entries(reqs).forEach(([sectionName, sectionReqs]: [string, any]) => {
      Object.entries(sectionReqs).forEach(([reqKey, req]: [string, any]) => {
        parsedRows.push({
          id: String(counter++),
          section: sectionName,
          reqKey,
          description: req.description || '',
          number: String(req.number || req.marks || 1),
          checkType: req.checkType || 'static-ui',
          automationTier: req.automationTier ?? 1,
          selectors: Array.isArray(req.selectors) ? req.selectors.join(', ') : '',
          correct: req.correct ?? false,
          message: req.message || 'not okay.'
        })
      })
    })

    if (parsedRows.length > 0) {
      setFormRequirements(parsedRows)
    }

    // Also set JSON text for json mode switcher fallback
    const formattedJson = {
      assignmentMeta: {
        title: found.title,
        batch: found.batch,
        type: "static-ui",
        version: found.version || 1
      },
      figmaUrl: found.figmaUrl || "",
      requirements: reqs
    }
    setValue('assignmentJSON', JSON.stringify(formattedJson, null, 2))
  }

  // Delete Assignment action
  const handleDeleteAssignment = async (id: string) => {
    // Proceed directly - toast feedback after
    try {
      await deleteAssignment(id)
      toast('Assignment successfully deleted', 'success')
      
      // Clear fields if we deleted the current active one
      if (editingAssignmentId === id) {
        setEditingAssignmentId(null)
        setFormBatch('14')
        setFormNo('1')
        setFormTitle('')
        setFormFigma('')
        setFormRequirements([
          { id: '1', section: 'Navbar', reqKey: 'req-1', description: '', number: '1', checkType: 'static-ui', automationTier: 1, selectors: '', correct: false, message: 'not okay.' }
        ])
      }
      
      refreshAssignments()
    } catch (err: any) {
      toast('Delete failed: ' + err.message, 'error')
    }
  }

  const handleReEnrich = async (id: string) => {
    // Proceed directly - re-enrichment is non-destructive (can be re-run)
    setReEnrichLoading(true)
    try {
      await reEnrichAssignment(id)
      toast('Re-enrichment complete! AI rules have been regenerated.', 'success')
      refreshAssignments()
    } catch (err: any) {
      toast('Re-enrich failed: ' + err.message, 'error')
    } finally {
      setReEnrichLoading(false)
    }
  }

  // Convert Direct Form Inputs to JSON schema format
  const handleParseFormInputs = () => {
    setParseErrors([])
    const errs: string[] = []

    const batchNum = Number(formBatch)
    const assignmentNum = Number(formNo)

    if (!formBatch || isNaN(batchNum) || batchNum <= 0) errs.push("Batch must be a positive number")
    if (!formNo || isNaN(assignmentNum) || assignmentNum <= 0) errs.push("Assignment number must be a positive number")
    if (!formTitle.trim()) errs.push("Assignment Title is required")

    const structuredRequirements: Record<string, any> = {}
    let mainTotal = 0
    let challengeTotal = 0

    formRequirements.forEach((row, idx) => {
      const sec = row.section.trim() || 'General'
      const key = row.reqKey.trim() || `req-${idx + 1}`
      const weight = Number(row.number) || 0

      if (!row.description.trim()) {
        errs.push(`Row ${idx + 1}: Description is empty`)
      }

      if (!structuredRequirements[sec]) {
        structuredRequirements[sec] = {}
      }

      const selectorList = row.selectors
        ? row.selectors.split(',').map(s => s.trim()).filter(Boolean)
        : []

      structuredRequirements[sec][key] = {
        description: row.description.trim(),
        number: weight,
        correct: row.correct ?? false,
        message: row.message || "not okay.",
        checkType: row.checkType || "static-ui",
        automationTier: Number(row.automationTier) || 1,
        selectors: selectorList,
        requiredState: null,
        confidence: 0.95
      }

      if (sec.toLowerCase().includes('challenge') || key.toLowerCase().includes('challenge')) {
        challengeTotal += weight
      } else {
        mainTotal += weight
      }
    })

    // ─── Mark total validation ─────────────────────────────────────────────────
    if (mainTotal !== 50) {
      errs.push(`Main requirements total must be exactly 50 marks (current: ${mainTotal}). Adjust the "number" fields in non-challenge rows.`)
    }
    if (challengeTotal !== 10) {
      errs.push(`Challenge requirements total must be exactly 10 marks (current: ${challengeTotal}). Section or key name must contain "challenge".`)
    }
    if (mainTotal + challengeTotal !== 60) {
      errs.push(`Grand total must be 60 (main 50 + challenge 10). Current total: ${mainTotal + challengeTotal}.`)
    }
    // ───────────────────────────────────────────────────────────────────────────


    if (errs.length > 0) {
      setParseErrors(errs)
      return
    }

    const finalAssignment: AssignmentJSON = {
      assignmentNo: assignmentNum,
      batch: batchNum,
      title: formTitle.trim(),
      figmaUrl: formFigma.trim(),
      originalRequirements: structuredRequirements
    }

    // Pass the active DB object ID to the preview structure for onSubmit updating
    if (editingAssignmentId) {
      (finalAssignment as any)._id = editingAssignmentId
    }

    setParsedAssignment(finalAssignment)
    setStep("preview")
  }

  const handleParseJSON = () => {
    setParseErrors([])
    try {
      let parsed: any = JSON.parse(jsonText)
      const errs: string[] = []

      // Map format if detected
      if (parsed && parsed.assignmentMeta && parsed.requirements) {
        const meta = parsed.assignmentMeta
        let assignmentNo = meta.assignmentNo || meta.number
        if (!assignmentNo && meta.title) {
          const match = meta.title.match(/Assignment\s+(\d+)/i)
          if (match) assignmentNo = parseInt(match[1], 10)
        }
        parsed = {
          assignmentNo: assignmentNo || 1,
          batch: meta.batch,
          title: meta.title,
          figmaUrl: parsed.figmaUrl || "",
          originalRequirements: parsed.requirements,
        }
      }

      if (parsed.assignmentNo === undefined || parsed.assignmentNo === null) {
        errs.push("Root: 'assignmentNo' is required")
      }
      if (parsed.batch === undefined || parsed.batch === null) {
        errs.push("Root: 'batch' is required")
      }
      if (!parsed.title || typeof parsed.title !== "string" || !parsed.title.trim()) {
        errs.push("Root: 'title' is required")
      }

      if (!parsed.originalRequirements || typeof parsed.originalRequirements !== "object") {
        errs.push("Root: 'originalRequirements' is required")
      }

      if (errs.length > 0) {
        setParseErrors(errs)
        setParsedAssignment(null)
        return
      }

      // Convert marks values to number
      const cleanedRequirements: Record<string, any> = {}
      let mainTotal = 0
      let challengeTotal = 0

      for (const [sectionName, reqs] of Object.entries(parsed.originalRequirements)) {
        cleanedRequirements[sectionName] = {}
        for (const [reqKey, req] of Object.entries(reqs as Record<string, any>)) {
          const weight = Number((req as any).number || (req as any).marks || 1)
          
          cleanedRequirements[sectionName][reqKey] = {
            ...req,
            number: weight,
            correct: (req as any).correct ?? false,
            message: (req as any).message ?? "not okay.",
            checkType: (req as any).checkType || "static-ui",
            automationTier: (req as any).automationTier ?? 1,
            selectors: (req as any).selectors || []
          }

          if (sectionName.toLowerCase().includes('challenge') || reqKey.toLowerCase().includes('challenge')) {
            challengeTotal += weight
          } else {
            mainTotal += weight
          }
        }
      }

      // ─── Mark total validation ─────────────────────────────────────────────
      if (mainTotal !== 50) {
        errs.push(`Main requirements total must be exactly 50 marks (current: ${mainTotal}). Adjust the "number" fields in non-challenge sections.`)
      }
      if (challengeTotal !== 10) {
        errs.push(`Challenge requirements total must be exactly 10 marks (current: ${challengeTotal}). Section or key name must contain "challenge".`)
      }
      if (mainTotal + challengeTotal !== 60) {
        errs.push(`Grand total must be 60 (main 50 + challenge 10). Current total: ${mainTotal + challengeTotal}.`)
      }
      // ──────────────────────────────────────────────────────────────────────

      if (errs.length > 0) {
        setParseErrors(errs)
        setParsedAssignment(null)
        return
      }

      const finalAssignment: AssignmentJSON = {
        assignmentNo: parsed.assignmentNo,
        batch: parsed.batch,
        title: parsed.title,
        figmaUrl: parsed.figmaUrl || "",
        originalRequirements: cleanedRequirements,
      }

      if (editingAssignmentId) {
        (finalAssignment as any)._id = editingAssignmentId
      }

      setParsedAssignment(finalAssignment)
      setStep("preview")
    } catch (err) {
      setParseErrors([
        err instanceof SyntaxError ? `Invalid JSON: ${err.message}` : "Failed to parse JSON",
      ])
      setParsedAssignment(null)
    }
  }

  const onSubmit = async () => {
    if (!parsedAssignment) return
    setSubmitError(null)

    try {
      let result;
      // If assignment contains _id key, update it instead of creating new
      if ((parsedAssignment as any)._id) {
        const id = (parsedAssignment as any)._id
        const updatePayload = { ...parsedAssignment }
        delete (updatePayload as any)._id
        result = await updateAssignment(id, updatePayload)
        setAssignmentId(id)
      } else {
        result = await createAssignment(parsedAssignment)
        setAssignmentId(result.assignmentId)
      }
      setStep("progress")
      refreshAssignments()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to save assignment")
    }
  }

  // Split form requirements
  const mainRequirements = formRequirements.filter(
    r => !(r.section || '').toLowerCase().includes('challenge') && !(r.reqKey || '').toLowerCase().includes('challenge')
  )
  const challengeRequirements = formRequirements.filter(
    r => (r.section || '').toLowerCase().includes('challenge') || (r.reqKey || '').toLowerCase().includes('challenge')
  )

  const renderRequirementRow = (row: any) => (
    <div key={row.id} className="bg-slate-50/50 p-4 border border-slate-200 rounded-2xl relative group space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-3xs font-extrabold text-slate-400 uppercase tracking-wider mb-1">Section</label>
          <input
            type="text"
            value={row.section}
            onChange={e => handleUpdateFormRow(row.id, 'section', e.target.value)}
            placeholder="e.g. Navbar"
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-blue-500 transition"
          />
        </div>

        <div>
          <label className="block text-3xs font-extrabold text-slate-400 uppercase tracking-wider mb-1">Key</label>
          <input
            type="text"
            value={row.reqKey}
            onChange={e => handleUpdateFormRow(row.id, 'reqKey', e.target.value)}
            placeholder="e.g. req-1"
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-blue-500 transition"
          />
        </div>

        <div>
          <label className="block text-3xs font-extrabold text-slate-400 uppercase tracking-wider mb-1">Check Type</label>
          <select
            value={row.checkType}
            onChange={e => handleUpdateFormRow(row.id, 'checkType', e.target.value)}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-blue-500 transition"
          >
            <option value="static-ui">static-ui</option>
            <option value="ui-count">ui-count</option>
            <option value="ui-position">ui-position</option>
            <option value="css-property">css-property</option>
            <option value="alt-text">alt-text</option>
            <option value="href">href</option>
            <option value="needsClarification">needsClarification</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-3xs font-extrabold text-slate-400 uppercase tracking-wider mb-1">Tier</label>
            <select
              value={row.automationTier}
              onChange={e => handleUpdateFormRow(row.id, 'automationTier', Number(e.target.value))}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-blue-500 transition"
            >
              <option value={1}>Tier 1</option>
              <option value={2}>Tier 2</option>
              <option value={3}>Tier 3</option>
            </select>
          </div>
          <div>
            <label className="block text-3xs font-extrabold text-slate-400 uppercase tracking-wider mb-1">Marks</label>
            <input
              type="number"
              value={row.number}
              onChange={e => handleUpdateFormRow(row.id, 'number', e.target.value)}
              placeholder="Marks"
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none text-center focus:border-blue-500 transition"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-3xs font-extrabold text-slate-400 uppercase tracking-wider mb-1">Description / Rules Criteria</label>
          <input
            type="text"
            value={row.description}
            onChange={e => handleUpdateFormRow(row.id, 'description', e.target.value)}
            placeholder="e.g. Logo aligned to the left..."
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-blue-500 transition"
          />
        </div>

        <div>
          <label className="block text-3xs font-extrabold text-slate-400 uppercase tracking-wider mb-1">CSS Selectors (Comma separated)</label>
          <input
            type="text"
            value={row.selectors}
            onChange={e => handleUpdateFormRow(row.id, 'selectors', e.target.value)}
            placeholder="e.g. nav .logo, header .logo"
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-blue-500 transition"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-3xs font-extrabold text-slate-400 uppercase tracking-wider mb-1">Feedback Message</label>
          <input
            type="text"
            value={row.message}
            onChange={e => handleUpdateFormRow(row.id, 'message', e.target.value)}
            placeholder="e.g. not okay."
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-blue-500 transition"
          />
        </div>
        <div className="flex items-center pt-5">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={row.correct}
              onChange={e => handleUpdateFormRow(row.id, 'correct', e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Correct by default</span>
          </label>
        </div>
      </div>

      <button
        type="button"
        onClick={() => handleRemoveFormRow(row.id)}
        disabled={formRequirements.length <= 1}
        className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-white border border-slate-300 shadow-sm text-slate-300 hover:text-red-500 transition flex items-center justify-center opacity-0 group-hover:opacity-100 disabled:opacity-0"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <main className="flex-1 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-8">
          
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Upload Assignment Spec</h1>
            <p className="text-slate-600 mt-2">Submit or modify assignment configurations via form fields or direct JSON</p>
          </div>

          {/* Selector Dropdown to load/edit or delete */}
          {step === 'input' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm mb-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-blue-600" />
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Select Assignment to Edit or Delete</h2>
                </div>
                {editingAssignmentId && (
                  <button
                    onClick={() => {
                      setEditingAssignmentId(null);
                      setFormBatch('14');
                      setFormNo('1');
                      setFormTitle('');
                      setFormFigma('');
                      setFormRequirements([
                        { id: '1', section: 'Navbar', reqKey: 'req-1', description: '', number: '1', checkType: 'static-ui', automationTier: 1, selectors: '', correct: false, message: 'not okay.' }
                      ]);
                    }}
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    Clear Active Selection (Create New)
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <select
                    value={editingAssignmentId || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val) {
                        handleLoadAssignment(val);
                      }
                    }}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-500"
                  >
                    <option value="">-- Choose an assignment --</option>
                    {assignments.map((a) => (
                      <option key={a._id} value={a._id}>
                        Batch {a.batch} — {a.title}
                      </option>
                    ))}
                  </select>
                </div>
                {editingAssignmentId && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleReEnrich(editingAssignmentId)}
                      disabled={reEnrichLoading}
                      className="h-11 px-5 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 font-semibold text-sm transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {reEnrichLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      Re-enrich AI Rules
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteAssignment(editingAssignmentId)}
                      className="h-11 px-5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-semibold text-sm transition flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="h-4 w-4" /> Delete Assignment Spec
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mode Switcher */}
          {step === 'input' && (
            <div className="flex bg-slate-200/60 p-1 rounded-xl w-72 mb-6">
              <button
                type="button"
                onClick={() => setMode('form')}
                className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                  mode === 'form' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Direct Inputs Uploader
              </button>
              <button
                type="button"
                onClick={() => setMode('json')}
                className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                  mode === 'json' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Manual JSON Editor
              </button>
            </div>
          )}

          {/* Step Progress Indicators */}
          <div className="flex items-center gap-4 mb-8">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition ${
              step === 'input' ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'
            }`}>
              1
            </div>
            <div className="flex-1 h-0.5 bg-slate-200" />
            <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition ${
              step === 'preview' ? 'bg-blue-600 text-white' : step === 'progress' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              2
            </div>
            <div className="flex-1 h-0.5 bg-slate-200" />
            <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition ${
              step === 'progress' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              3
            </div>
          </div>

          {/* Form Step */}
          {step === 'input' && (
            <div className="space-y-6">
              {mode === 'form' ? (
                /* DIRECT INPUTS MODE */
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Layers className="h-5 w-5 text-blue-600" />
                    <h2 className="text-lg font-bold text-slate-900">
                      {editingAssignmentId ? 'Update Assignment details' : 'Assignment Details'}
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Batch Number</label>
                      <input
                        type="number"
                        value={formBatch}
                        onChange={e => setFormBatch(e.target.value)}
                        placeholder="e.g. 14"
                        className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-700 outline-none focus:border-blue-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Assignment Number</label>
                      <input
                        type="number"
                        value={formNo}
                        onChange={e => setFormNo(e.target.value)}
                        placeholder="e.g. 1"
                        className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-700 outline-none focus:border-blue-500 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Title</label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={e => setFormTitle(e.target.value)}
                      placeholder="e.g. Assignment 1 - DevConf 2026"
                      className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-700 outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Figma URL</label>
                    <input
                      type="text"
                      value={formFigma}
                      onChange={e => setFormFigma(e.target.value)}
                      placeholder="https://www.figma.com/design/..."
                      className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-700 outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  {/* Requirements List Split */}
                  <div className="space-y-6 pt-4 border-t border-slate-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <h3 className="text-base font-bold text-slate-800 tracking-tight">Assignment Requirements Specs</h3>
                      
                      {/* Live indicators */}
                      <div className="flex gap-2">
                        {(() => {
                          let mainVal = 0
                          let challengeVal = 0
                          formRequirements.forEach(r => {
                            const sec = (r.section || '').toLowerCase()
                            const key = (r.reqKey || '').toLowerCase()
                            const weight = Number(r.number) || 0
                            if (sec.includes('challenge') || key.includes('challenge')) {
                              challengeVal += weight
                            } else {
                              mainVal += weight
                            }
                          })

                          const mainOk = mainVal === 50
                          const challengeOk = challengeVal === 10
                          const totalOk = (mainVal + challengeVal) === 60

                          return (
                            <>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${
                                mainOk ? 'bg-green-50 border-green-200 text-green-700' : 'bg-amber-50 border-amber-200 text-amber-700'
                              }`}>
                                Main: {mainVal} / 50 {mainOk ? '✓' : '⚠️'}
                              </span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${
                                challengeOk ? 'bg-green-50 border-green-200 text-green-700' : 'bg-amber-50 border-amber-200 text-amber-700'
                              }`}>
                                Challenge: {challengeVal} / 10 {challengeOk ? '✓' : '⚠️'}
                              </span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${
                                totalOk ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-red-50 border-red-200 text-red-700'
                              }`}>
                                Total: {mainVal + challengeVal} / 60 {totalOk ? '✓' : '✗'}
                              </span>
                            </>
                          )
                        })()}
                      </div>
                    </div>

                    {/* SECTION A: MAIN REQUIREMENTS */}
                    <div className="space-y-4 border-l-4 border-blue-500 pl-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider">Main Requirements (Must equal 50 marks)</h4>
                      </div>

                      <div className="space-y-4">
                        {mainRequirements.length > 0 ? (
                          mainRequirements.map(renderRequirementRow)
                        ) : (
                          <p className="text-xs text-slate-400 italic">No main requirements added yet.</p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddFormRow(false)}
                        className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3.5 py-2 rounded-xl transition"
                      >
                        <Plus className="h-4 w-4" /> Add Main Requirement Spec
                      </button>
                    </div>

                    {/* SECTION B: CHALLENGE REQUIREMENTS */}
                    <div className="space-y-4 border-l-4 border-amber-500 pl-4 pt-4 border-t border-slate-100">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider">Challenge Requirements (Must equal 10 marks)</h4>
                      </div>

                      <div className="space-y-4">
                        {challengeRequirements.length > 0 ? (
                          challengeRequirements.map(renderRequirementRow)
                        ) : (
                          <p className="text-xs text-slate-400 italic">No challenge requirements added yet.</p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddFormRow(true)}
                        className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 px-3.5 py-2 rounded-xl transition"
                      >
                        <Plus className="h-4 w-4" /> Add Challenge Requirement Spec
                      </button>
                    </div>
                  </div>

                  {parseErrors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <p className="text-sm font-bold text-red-900 mb-2">Errors:</p>
                      <ul className="space-y-1">
                        {parseErrors.map((error, idx) => (
                          <li key={idx} className="text-xs text-red-700 font-semibold">• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleParseFormInputs}
                    className="w-full flex justify-center gap-2 rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 transition"
                  >
                    Preview & Verify Specifications <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                /* MANUAL JSON EDITOR MODE */
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <FilePlus className="h-5 w-5 text-blue-600" />
                      <h2 className="text-lg font-bold text-slate-900">Assignment JSON Specification</h2>
                    </div>
                    <button
                      type="button"
                      onClick={loadJsonTemplate}
                      className="text-xs font-bold text-blue-600 hover:underline"
                    >
                      Load Template Example
                    </button>
                  </div>

                  <div className="space-y-3">
                    <Editor
                      height="380px"
                      defaultLanguage="json"
                      theme="light"
                      value={watch("assignmentJSON")}
                      onChange={(value) => setValue("assignmentJSON", value || "")}
                      options={{ minimap: { enabled: false } }}
                    />

                    {/* JSON Format Hint / Example */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-wider">
                        <Info className="h-4 w-4 text-blue-600" />
                        <span>JSON Format Example / Demo:</span>
                      </div>
                      <pre className="text-3xs font-mono text-slate-500 max-h-36 overflow-y-auto bg-white p-3 rounded-lg border border-slate-100">
{`{
  "assignmentMeta": {
    "title": "Assignment 1 - DevConf 2026 UI",
    "batch": 14,
    "type": "static-ui"
  },
  "figmaUrl": "https://www.figma.com/design/...",
  "requirements": {
    "Navbar": {
      "req-1": {
        "description": "Logo aligned to the left containing the text 'DEVCONF 2026'",
        "number": "1",
        "correct": false,
        "message": "not okay."
      }
    }
  }
}`}
                      </pre>
                    </div>

                    {parseErrors.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <p className="text-sm font-bold text-red-900 mb-2">Errors:</p>
                        <ul className="space-y-1">
                          {parseErrors.map((error, idx) => (
                            <li key={idx} className="text-xs text-red-700 font-semibold">• {error}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleParseJSON}
                      className="w-full flex justify-center gap-2 rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 transition"
                    >
                      Parse & Preview Requirements <ArrowRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Preview step */}
          {step === 'preview' && parsedAssignment && (
            <div className="space-y-6">
              <AssignmentPreview assignment={parsedAssignment} />

              {submitError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-red-900">Submission Error</p>
                  <p className="text-sm text-red-700 mt-1">{submitError}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('input')}
                  className="flex-1 cursor-pointer rounded-xl border border-slate-300 py-3 font-semibold hover:bg-slate-50 transition"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={onSubmit}
                  disabled={isSubmitting}
                  className="cursor-pointer flex-1 flex justify-center gap-2 rounded-xl bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-700 transition"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-5 h-5" />
                      {editingAssignmentId ? 'Update Assignment' : 'Submit Assignment'}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Progress / Success step */}
          {step === 'progress' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center max-w-xl mx-auto space-y-6">
              <div className="mx-auto rounded-full bg-emerald-100 p-4 w-16 h-16 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {editingAssignmentId ? 'Assignment Updated Successfully!' : 'Assignment Created Successfully!'}
                </h2>
                <p className="text-slate-500 mt-2">The assignment requirements have been registered and saved to the database.</p>
              </div>

              {assignmentId && (
                <div className="bg-slate-50 border rounded-lg p-3 text-sm font-mono text-slate-600">
                  ID: {assignmentId}
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setStep('input')
                    setEditingAssignmentId(null)
                    setValue('assignmentJSON', '')
                    setParsedAssignment(null)
                    setAssignmentId(null)
                  }}
                  className="flex-1 rounded-xl border border-slate-300 py-3 font-semibold hover:bg-slate-50 transition"
                >
                  Create Another
                </button>
                <Link
                  href="/assignments"
                  className="flex-1 inline-flex justify-center items-center gap-2 rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 transition"
                >
                  View Submissions <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
