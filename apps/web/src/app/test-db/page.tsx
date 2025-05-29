'use client';

import { TestDatabase } from '@/components/TestDatabase';

export default function TestDatabasePage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Database Test Page</h1>
        <TestDatabase />
      </div>
    </div>
  );
} 