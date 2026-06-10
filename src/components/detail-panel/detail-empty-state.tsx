export function DetailEmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center p-4 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
