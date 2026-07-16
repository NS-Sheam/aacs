/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import {
  ChevronDown,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface ResultItem {
  _id: string;
  reqKey: string;
  description: string;
  marks: number;
  status: string;
  correct: boolean;
  message: string;
  automationTier: number;
  confidence: number;
  autoCommitted: boolean;
  evidence?: {
    selectorUsed?: string;
  };
}

const Requirementtab = ({
  reqSections,
}: {
  reqSections: [string, ResultItem[]][];
}) => {
  const [expandedSections, setExpandedSections] = React.useState<string[]>([]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((item) => item !== section)
        : [...prev, section]
    );
  };

  return (
    <div className="space-y-4">
      {reqSections?.map(([section, sectionChecks]) => {
        const isExpanded = expandedSections.includes(section);

        const passedCount = sectionChecks.filter(
          (item) => item.correct
        ).length;

        const percentage =
          sectionChecks.length > 0
            ? Math.round((passedCount / sectionChecks.length) * 100)
            : 0;

        return (
          <div
            key={section}
            className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all"
          >
            {/* Header */}
            <button
              onClick={() => toggleSection(section)}
              className="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-4">
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                />

                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">
                    {section}
                  </h3>

                  <p className="text-sm text-gray-500 mt-1">
                    <span className="text-green-600 font-semibold">
                      {passedCount}
                    </span>
                    {" / "}
                    {sectionChecks.length} passed
                  </p>
                </div>
              </div>


              {/* Percentage */}
              <div
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  percentage === 100
                    ? "bg-green-100 text-green-700"
                    : percentage >= 50
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {percentage}%
              </div>
            </button>


            {/* Details */}
            {isExpanded && (
              <div className="border-t border-gray-100 bg-gray-50">
                {sectionChecks.map((check, index) => (
                  <div
                    key={check._id}
                    className={`px-6 py-5 flex gap-4 ${
                      index !== sectionChecks.length - 1
                        ? "border-b border-gray-200"
                        : ""
                    }`}
                  >
                    {/* Status */}
                    <div className="mt-1">
                      {check.correct ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>


                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex justify-between gap-4">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {check.reqKey}
                          </h4>

                          <p className="text-sm text-gray-500 mt-1">
                            {check.description}
                          </p>

                          {check.message && (
                            <p
                              className={`text-sm mt-2 ${
                                check.correct
                                  ? "text-green-600"
                                  : "text-red-500"
                              }`}
                            >
                              {check.message}
                            </p>
                          )}

                          <div className="flex gap-3 mt-3 text-xs text-gray-400">
                            <span>
                              Confidence:{" "}
                              {Math.round(check.confidence * 100)}%
                            </span>

                            <span>
                              Automation Tier: {check.automationTier}
                            </span>

                            {check.autoCommitted && (
                              <span className="text-blue-600">
                                Auto Checked
                              </span>
                            )}
                          </div>
                        </div>


                        {/* Marks */}
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">
                            {check.marks}
                          </div>
                          <div className="text-xs text-gray-400">
                            points
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Requirementtab;