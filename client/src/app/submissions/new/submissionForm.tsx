/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    GitBranch,
    Globe,
    User,
    FileCode,
    Loader2,
    ArrowRight
} from "lucide-react";
import { submitAssignment } from "@/app/lib/api";

const BASE =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function SubmissionForm({
    assignmentId,
}: {
    assignmentId: string;
}) {
    const router = useRouter();

    const [form, setForm] = useState({
        assignmentId,
        studentName: "",
        liveUrl: "",
        githubUrl: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit() {
        try {
            setLoading(true);
            setError("");

            const res = await submitAssignment(form);
            setLoading(false);

            router.push(`/submissions/${(res?.data?._id)?.toString()}`);
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        } 
    }

    return (
        <div className="max-w-2xl">

            <div className="rounded-3xl border border-gray-200 bg-white shadow-2xl shadow-gray-200/40">

                <div className="border-b border-gray-100 p-8">

                    <h2 className="text-2xl font-semibold">
                        Project Information
                    </h2>

                    <p className="mt-2 text-gray-500">
                        Fill in all required information before submitting.
                    </p>

                </div>

                <div className="space-y-7 p-8">

                    <Input
                        icon={<FileCode size={18} />}
                        label="Assignment ID"
                        value={form.assignmentId}
                        mono
                        onChange={(v:any) =>
                            setForm({
                                ...form,
                                assignmentId: v,
                            })
                        }
                    />

                    <Input
                        icon={<User size={18} />}
                        label="Student Name"
                        value={form.studentName}
                        placeholder="Rafsan Siddiqui"
                        onChange={(v:any) =>
                            setForm({
                                ...form,
                                studentName: v,
                            })
                        }
                    />

                    <Input
                        icon={<Globe size={18} />}
                        label="Live Project URL"
                        value={form.liveUrl}
                        placeholder="https://student.netlify.app"
                        onChange={(v:any) =>
                            setForm({
                                ...form,
                                liveUrl: v,
                            })
                        }
                    />

                    <Input
                        icon={<GitBranch size={18} />}
                        label="GitHub Repository"
                        value={form.githubUrl}
                        placeholder="https://github.com/user/project"
                        onChange={(v:any) =>
                            setForm({
                                ...form,
                                githubUrl: v,
                            })
                        }
                    />

                    {error && (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-600">
                            {error}
                        </div>
                    )}

                    <button
                        disabled={
                            loading ||
                            !form.assignmentId ||
                            !form.liveUrl ||
                            !form.githubUrl
                        }
                        onClick={handleSubmit}
                        className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-black font-medium text-white transition-all hover:scale-[1.01] hover:bg-gray-900 disabled:opacity-40"
                    >
                        {loading ? (
                            <>
                                <Loader2
                                    className="animate-spin"
                                    size={20}
                                />
                                Submitting...
                            </>
                        ) : (
                            <>
                                Submit Assignment
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>

                </div>

            </div>

        </div>
    );
}

function Input({
    label,
    value,
    onChange,
    placeholder,
    icon,
    mono,
}: any) {
    return (
        <div>

            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                {icon}
                {label}
            </label>

            <input
                value={value}
                placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
                className={`w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 outline-none transition-all focus:border-black focus:bg-white focus:ring-4 focus:ring-gray-100 ${
                    mono ? "font-mono" : ""
                }`}
            />

        </div>
    );
}