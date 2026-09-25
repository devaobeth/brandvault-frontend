type ErrorStateProps = {
  message?: string
}

export function ErrorState({ message = 'Something went wrong.' }: ErrorStateProps) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </div>
  )
}
