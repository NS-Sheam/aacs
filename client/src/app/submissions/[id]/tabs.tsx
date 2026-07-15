/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import Requirementtab from "./requirementTab";
import GithubTab from "./githubTab";

const Tabs = ({ reqSections, git }: { reqSections: any; git: any }) => {
  const [activeTab, setActiveTab] = React.useState<"results" | "github">(
    "results"
  );

  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="flex items-center gap-2 p-1 mb-5 bg-gray-100 rounded-xl w-fit border border-gray-200 shadow-sm">
        {(["results", "github"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              relative px-5 py-2.5 text-sm font-medium rounded-lg 
              transition-all duration-300
              ${
                activeTab === tab
                  ? "bg-white text-gray-900 shadow-sm ring-1 ring-gray-200"
                  : "text-gray-500 hover:text-gray-800 hover:bg-white/60"
              }
            `}
          >
            <span className="flex items-center gap-2">
              {tab === "github" ? (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.2 11.4.6.1.82-.26.82-.58v-2.04c-3.34.73-4.04-1.62-4.04-1.62-.55-1.4-1.33-1.77-1.33-1.77-1.09-.75.08-.74.08-.74 1.2.09 1.83 1.24 1.83 1.24 1.07 1.83 2.8 1.3 3.48.99.1-.77.42-1.3.76-1.6-2.66-.3-5.46-1.33-5.46-5.92 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.53.12-3.18 0 0 1-.32 3.3 1.23a11.4 11.4 0 016 0c2.3-1.55 3.3-1.23 3.3-1.23.66 1.65.25 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.6-2.8 5.61-5.47 5.91.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.83.58A12 12 0 0024 12.5C24 5.87 18.63.5 12 .5z" />
                  </svg>
                  GitHub Activity
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Requirements
                </>
              )}
            </span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="w-full">
        {activeTab === "results" && (
          <Requirementtab reqSections={reqSections} />
        )}

        {activeTab === "github" && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <GithubTab githubSection={git} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Tabs;