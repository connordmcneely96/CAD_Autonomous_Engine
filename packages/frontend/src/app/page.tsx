export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">CAD Autonomous Engine</h1>
        <p className="text-center text-lg text-muted-foreground">
          AI-powered CAD SaaS platform - Frontend is running
        </p>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">3D Viewer</h2>
            <p className="text-sm text-muted-foreground">
              Powered by Three.js and React Three Fiber
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">AI Assistant</h2>
            <p className="text-sm text-muted-foreground">Natural language CAD operations</p>
          </div>
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Cloud Processing</h2>
            <p className="text-sm text-muted-foreground">Scalable CAD engine backend</p>
          </div>
        </div>
      </div>
    </main>
  );
}
