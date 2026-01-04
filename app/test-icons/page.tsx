'use client';

import CategoryIcon from '@/components/marketplace/CategoryIcon';

export default function TestIconsPage() {
  const categories = [
    'All',
    'Dorm & Decor',
    'Clothing & Accessories',
    'Fun & Craft',
    'Transportation',
    'Giveaways',
    'Tech & Gadgets',
    'Books',
    'Other',
  ];

  return (
    <div className="min-h-screen bg-white p-8">
      <h1 className="text-3xl font-bold mb-8">Icon Test Page</h1>

      <div className="space-y-4">
        {categories.map((category) => (
          <div key={category} className="flex items-center gap-4 p-4 border rounded">
            <CategoryIcon category={category} size={32} className="text-black" />
            <span className="font-medium">{category}</span>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h2 className="font-bold mb-2">Debug Info:</h2>
        <p>If you see icons above, phosphor-react is working!</p>
        <p>Icons should be black line SVGs with regular weight.</p>
      </div>
    </div>
  );
}
