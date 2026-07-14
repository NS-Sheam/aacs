'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Upload, ArrowRight, Loader2, AlertCircle,  } from 'lucide-react'
import { AssignmentJSON } from '@/types'
import AssignmentPreview from '@/components/upload/preview'
import { submitAssignment } from '../lib/api'
import Editor from "@monaco-editor/react";


interface UploadFormInputs {
  assignmentJSON: string
}

export default function UploadPage() {
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

  const handleParseJSON = () => {
  setParseErrors([])

  try {
    const parsed: AssignmentJSON = JSON.parse(jsonText)

    const errors: string[] = []

    if (!parsed.description?.trim()) {
      errors.push("Description is required")
    }

    if (typeof parsed.correct !== "boolean") {
      errors.push("Correct must be true or false")
    }

    if (typeof parsed.number !== "number") {
      errors.push("Number must be a number")
    }

    if (!parsed.message?.trim()) {
      errors.push("Message is required")
    }

    if (errors.length) {
      setParseErrors(errors)
      setParsedAssignment(null)
      return
    }

    setParsedAssignment(parsed)
    setStep("preview")
  } catch (err) {
    setParseErrors([
      err instanceof SyntaxError
        ? `Invalid JSON: ${err.message}`
        : "Failed to parse JSON",
    ])

    setParsedAssignment(null)
  }
}

const onSubmit = async () => {
  if (!parsedAssignment) return

  setSubmitError(null)

  try {
    const result = await submitAssignment(parsedAssignment)
    setAssignmentId(result.assignmentId)
    setStep("progress")
  } catch (error) {
    setSubmitError(
      error instanceof Error
        ? error.message
        : "Failed to submit assignment"
    )
  }
}

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <main className="flex-1 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Upload Assignment</h1>
            <p className="text-slate-600 mt-2">Submit a new assignment for automated checking</p>
          </div>

          <div className="flex items-center gap-4 mb-8">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
                step === 'input' ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'
              }`}
            >
              1
            </div>
            <div className="flex-1 h-1 bg-slate-200" />
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
                step === 'preview' ? 'bg-blue-600 text-white' : step === 'progress' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              2
            </div>
            <div className="flex-1 h-1 bg-slate-200" />
            
          </div>

          {step === 'input' && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
             

              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm border-slate-200 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Assignment JSON</h2>
                <div className="space-y-3">
                 

                  <Editor
                    height="400px"
                    defaultLanguage="json"
                    theme="light"
                    value={watch("assignmentJSON")}
                    onChange={(value) =>
                      setValue("assignmentJSON", value || "")
                    }
                  />
                  {errors.assignmentJSON && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.assignmentJSON.message}
                    </p>
                  )}

                  {parseErrors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm font-medium text-red-900 mb-2">JSON Validation Errors:</p>
                      <ul className="space-y-1">
                        {parseErrors.map((error, idx) => (
                          <li key={idx} className="text-sm text-red-700">
                            • {error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleParseJSON}
                    className="w-full flex justify-center  gap-2 rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 transition"
                  >
                    <Upload className="w-5 h-5" />
                    Parse & Preview
                  </button>
                </div>
              </div>
            </form>
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
                  onClick={() => handleSubmit(onSubmit)()}
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
                      Submit Assignment
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

         
        </div>
      </main>
    </div>
  )
}
