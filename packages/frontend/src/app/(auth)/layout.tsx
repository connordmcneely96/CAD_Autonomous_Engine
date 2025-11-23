export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-indigo-950 dark:to-purple-950 px-4 py-8 sm:p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            CAD Autonomous Engine
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            AI-powered CAD design platform
          </p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6 sm:p-8 border border-gray-200 dark:border-gray-800">
          {children}
        </div>
      </div>
    </div>
  );
}
