export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">404 - Page Not Found</h2>
        <p className="text-muted-foreground mb-4">This page does not exist.</p>
        <a href="/" className="text-primary underline">Go Home</a>
      </div>
    </div>
  );
}
