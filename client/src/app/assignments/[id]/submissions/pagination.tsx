"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface Props {
  page: number;
  totalPages: number;
}

export default function Pagination({ page, totalPages }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const changePage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));

    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex items-center justify-between mt-6">
      <p className="text-sm text-gray-500">
        Page <span className="font-semibold">{page}</span> of{" "}
        <span className="font-semibold">{totalPages}</span>
      </p>

      <div className="flex gap-2">
        <button
          disabled={page === 1}
          onClick={() => changePage(page - 1)}
          className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40 hover:bg-gray-100 transition"
        >
          Previous
        </button>

        <button
          disabled={page === totalPages}
          onClick={() => changePage(page + 1)}
          className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40 hover:bg-gray-100 transition"
        >
          Next
        </button>
      </div>
    </div>
  );
}