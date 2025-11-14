# 🎯 Quick Reference: Enterprise UI Patterns

## Floating Action Button Pattern

```tsx
{
  selectedItems.size > 0 && (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className="fixed bottom-8 right-8 z-50"
    >
      <button className="relative group">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full blur-xl opacity-60 group-hover:opacity-80 transition-opacity animate-pulse" />

        {/* Button */}
        <div className="relative flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full shadow-enterprise-2xl hover:shadow-enterprise-2xl hover:scale-105 transition-all duration-300">
          <Icon className="w-5 h-5 text-white" />
          <span className="font-semibold text-white">Action ({count})</span>

          {/* Badge */}
          <div className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg border-2 border-slate-900 animate-bounce">
            {count}
          </div>
        </div>
      </button>
    </motion.div>
  )
}
```

## Enterprise Card Pattern

```tsx
<div className="bg-slate-800/50 rounded-2xl p-6 shadow-enterprise border border-slate-700/50 backdrop-blur-sm">
  {/* Content */}
</div>
```

## Search Input Pattern

```tsx
<div className="relative">
  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
  <Input
    type="text"
    placeholder="Search..."
    className="pl-12 h-12 border-slate-600 bg-slate-900/50 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20"
  />
</div>
```

## Custom Select Pattern

```tsx
<div className="relative">
  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
  <select className="appearance-none pl-10 pr-10 py-3 h-12 border border-slate-600 bg-slate-900/50 text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer min-w-[160px]">
    <option>Option 1</option>
  </select>
</div>
```

## Enterprise Table Pattern

```tsx
<table className="w-full">
  <thead className="bg-gradient-to-r from-blue-600 to-indigo-600">
    <tr>
      <th className="text-left p-5 font-semibold text-white text-sm tracking-wide">Column Name</th>
    </tr>
  </thead>
  <tbody className="bg-slate-900/50">
    <tr className="border-b border-slate-700/30 hover:bg-slate-800/60 transition-colors group">
      <td className="p-5 text-slate-200 font-medium text-sm">Content</td>
    </tr>
  </tbody>
</table>
```

## Button Patterns

```tsx
// Primary Action
<Button className="h-11 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-enterprise hover:shadow-enterprise-lg transition-all border-0">

// Secondary Action
<Button className="h-11 px-5 border-slate-600 bg-slate-800/80 hover:bg-slate-700 hover:border-blue-500 text-slate-200 hover:text-white transition-all">

// Icon Action
<button className="p-2.5 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-all hover:scale-110 border border-transparent hover:border-blue-500/30">
```

## Loading State

```tsx
<div className="flex flex-col items-center gap-3">
  <div className="w-12 h-12 border-4 border-blue-900 border-t-blue-500 rounded-full animate-spin" />
  <p className="font-medium text-slate-400">Loading...</p>
</div>
```

## Empty State

```tsx
<div className="flex flex-col items-center gap-2">
  <Icon className="w-16 h-16 text-slate-600" />
  <p className="font-medium text-lg text-slate-300">Primary Message</p>
  <p className="text-sm text-slate-500">Secondary Message</p>
</div>
```

## Badge Pattern

```tsx
<span className="inline-flex px-3 py-1.5 bg-blue-500/20 text-blue-300 rounded-full text-xs font-semibold border border-blue-500/30">
  Badge Text
</span>
```

## Avatar Circle

```tsx
<div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-xs">
  {user.name.charAt(0).toUpperCase()}
</div>
```

## Color Gradients by Page

```tsx
// Dashboard
gradient = 'from-blue-600 via-indigo-600 to-violet-600'

// Students
gradient = 'from-blue-600 via-indigo-600 to-purple-600'

// Subjects
gradient = 'from-purple-600 via-violet-600 to-indigo-600'

// Records
gradient = 'from-emerald-600 via-teal-600 to-cyan-600'

// Email History
gradient = 'from-orange-600 via-amber-600 to-yellow-600'
```

## Standard Heights

- Search Input: `h-12` (48px)
- Button: `h-11` (44px)
- Select: `h-12` (48px)
- Date Input: `h-12` (48px)

## Standard Spacing

- Card Padding: `p-6` (24px)
- Table Cell: `p-5` (20px)
- Button Padding: `px-5` (20px)
- Icon Margin: `mr-2` (8px)
- Component Gap: `gap-3` or `gap-4`

## Text Colors

- Primary: `text-slate-100`
- Secondary: `text-slate-200`
- Tertiary: `text-slate-300`
- Muted: `text-slate-400`
- Disabled: `text-slate-500`
