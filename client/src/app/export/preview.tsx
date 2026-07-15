"use client";

import dynamic from "next/dynamic";

const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

interface JsonPreviewProps {
  data: unknown;
}

export default function JsonPreview({ data }: JsonPreviewProps) {
  return (
    <Editor
      height="650px"
      defaultLanguage="json"
      value={JSON.stringify(data, null, 2)}
      theme="light"
      options={{
        readOnly: true,
        minimap: { enabled: true },
        fontSize: 14,
        scrollBeyondLastLine: false,
        wordWrap: "on",
        automaticLayout: true,
        formatOnPaste: true,
        formatOnType: true,
        folding: true,
        renderWhitespace: "selection",
      }}
    />
  );
}