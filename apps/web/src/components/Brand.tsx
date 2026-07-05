// Shared brand lockup: gradient exam-sheet mark + wordmark.
export default function Brand() {
  return (
    <>
      <span className="brand-mark">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M6 3h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path d="M13 3v5h5" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
          <path
            d="m8.5 14 2 2 3.5-4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="brand-name">ExamForge</span>
    </>
  );
}
