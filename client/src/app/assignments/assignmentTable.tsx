'use client';

import { useState } from 'react';
import { Cpu, ShieldAlert, BadgeInfo, Layers, Edit, Save, X, Loader2, CheckCircle2 } from "lucide-react";
import { updateAssignment } from '../lib/api';

interface AssignmentTableProps {
  data: any[];
}

const AssignmentTable = ({ data }: AssignmentTableProps) => {
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    description: '',
    automationTier: 1,
    checkType: 'static-ui',
    number: 1,
  });
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const startEdit = (item: any) => {
    setEditingItem(item);
    setEditForm({
      description: item.description,
      automationTier: item.automationTier,
      checkType: item.checkType,
      number: item.number,
    });
    setSuccessMsg('');
    setErrorMsg('');
  };

  const cancelEdit = () => {
    setEditingItem(null);
  };

  const saveEdit = async () => {
    if (!editingItem) return;
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      // 1. Fetch full assignment to reconstruct
      const res = await fetch(`/api/v1/assignments/${editingItem.assignmentId}`);
      if (!res.ok) throw new Error("Failed to fetch assignment detail");
      const { data: assignment } = await res.json();

      // 2. Clone requirements
      const requirements = JSON.parse(JSON.stringify(assignment.enrichedRequirements || assignment.originalRequirements || {}));

      // 3. Update the specific requirement key
      if (requirements[editingItem.section] && requirements[editingItem.section][editingItem.reqKey]) {
        requirements[editingItem.section][editingItem.reqKey] = {
          ...requirements[editingItem.section][editingItem.reqKey],
          description: editForm.description,
          automationTier: Number(editForm.automationTier),
          checkType: editForm.checkType,
          number: Number(editForm.number),
        };
      }

      // 4. Save to server
      await updateAssignment(editingItem.assignmentId, {
        originalRequirements: requirements,
      });

      setSuccessMsg(`Successfully updated: ${editingItem.reqKey}!`);
      
      // Update local state item values
      editingItem.description = editForm.description;
      editingItem.automationTier = Number(editForm.automationTier);
      editingItem.checkType = editForm.checkType;
      editingItem.number = Number(editForm.number);

      setTimeout(() => {
        setEditingItem(null);
        setSuccessMsg('');
      }, 1000);

    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update requirement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-semibold">{successMsg}</p>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 flex items-center gap-2">
          <BadgeInfo className="h-5 w-5 text-red-600 shrink-0" />
          <p className="text-sm font-semibold">{errorMsg}</p>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                  Assignment
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                  Section & Key
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                  Description
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500">
                  Tier
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500">
                  Type
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500">
                  Weight
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 w-24">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white">
              {data.length ? (
                data.map((item, index) => {
                  const isEditing = editingItem?._id === item._id;
                  const isTier1 = (isEditing ? Number(editForm.automationTier) : item.automationTier) === 1;
                  const isTier3 = (isEditing ? Number(editForm.automationTier) : item.automationTier) === 3;

                  return (
                    <tr
                      key={item._id}
                      className={`hover:bg-slate-50/50 transition-colors ${isEditing ? 'bg-blue-50/20' : ''}`}
                    >
                      {/* Assignment Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">
                          Assignment {item.assignmentNo}
                        </div>
                        <div className="text-xs text-slate-500">
                          Batch {item.batch}
                        </div>
                      </td>

                      {/* Section & Key */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                          <Layers className="h-4 w-4 text-slate-400" />
                          <span className="capitalize">{item.section}</span>
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          {item.reqKey}
                        </div>
                      </td>

                      {/* Description */}
                      <td className="px-6 py-4 text-sm text-slate-600 max-w-sm">
                        {isEditing ? (
                          <textarea
                            value={editForm.description}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                            rows={2}
                          />
                        ) : (
                          <>
                            <div className="font-medium text-slate-800 line-clamp-2">
                              {item.description}
                            </div>
                            {item.message && (
                              <div className="text-xs text-slate-400 mt-0.5 italic truncate">
                                Feedback: "{item.message}"
                              </div>
                            )}
                          </>
                        )}
                      </td>

                      {/* Automation Tier */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {isEditing ? (
                          <select
                            value={editForm.automationTier}
                            onChange={(e) => setEditForm({ ...editForm, automationTier: Number(e.target.value) })}
                            className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs outline-none"
                          >
                            <option value={1}>Tier 1 (Auto)</option>
                            <option value={3}>Tier 3 (Manual)</option>
                          </select>
                        ) : (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            isTier1 ? 'bg-blue-50 border-blue-200 text-blue-700' :
                            isTier3 ? 'bg-amber-50 border-amber-200 text-amber-700' :
                            'bg-slate-50 border-slate-200 text-slate-700'
                          }`}>
                            {isTier1 ? (
                              <>
                                <Cpu className="h-3 w-3" /> Tier 1 (Auto)
                              </>
                            ) : (
                              <>
                                <ShieldAlert className="h-3 w-3" /> Tier 3 (Manual)
                              </>
                            )}
                          </span>
                        )}
                      </td>

                      {/* Check Type */}
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-mono text-slate-600">
                        {isEditing ? (
                          <select
                            value={editForm.checkType}
                            onChange={(e) => setEditForm({ ...editForm, checkType: e.target.value })}
                            className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs outline-none"
                          >
                            <option value="static-ui">static-ui</option>
                            <option value="ui-count">ui-count</option>
                            <option value="ui-position">ui-position</option>
                            <option value="css-property">css-property</option>
                            <option value="alt-text">alt-text</option>
                            <option value="href">href</option>
                            <option value="needsClarification">needsClarification</option>
                          </select>
                        ) : (
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs border border-slate-200">
                            {item.checkType || 'static-ui'}
                          </span>
                        )}
                      </td>

                      {/* Weight (Marks) */}
                      <td className="px-6 py-4 whitespace-nowrap text-center font-bold text-slate-900 text-sm">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editForm.number}
                            onChange={(e) => setEditForm({ ...editForm, number: Number(e.target.value) })}
                            className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-center text-xs outline-none"
                          />
                        ) : (
                          `${item.number || 1} pt`
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {isEditing ? (
                          <div className="flex justify-center gap-1.5">
                            <button
                              onClick={saveEdit}
                              disabled={saving}
                              className="h-8 w-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition disabled:opacity-50"
                              title="Save Changes"
                            >
                              {saving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Save className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="h-8 w-8 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition"
                              title="Cancel"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(item)}
                            className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-500 hover:text-blue-600 flex items-center justify-center transition border border-slate-200"
                            title="Edit Requirement"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-16 text-center"
                  >
                    <BadgeInfo className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-lg font-semibold text-slate-700">
                      No requirements found
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      Try changing your filters or search keywords.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {data.length > 0 && (
          <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
            <p className="text-sm text-slate-600">
              Showing{" "}
              <span className="font-semibold text-slate-900">
                {data.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-900">
                {data.length}
              </span>{" "}
              requirements
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignmentTable;