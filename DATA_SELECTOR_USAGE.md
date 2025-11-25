# Data Selector Component - Usage Guide

## Overview

The Data Selector component provides a user-friendly interface for selecting data by:
- **Date Range**: Today, This Month, or Custom range
- **Accounts**: Filter by specific accounts (all selected by default)
- **Platforms**: Filter by specific platforms (all selected by default)

---

## Features

### ✅ Date Range Options

1. **Today** - All data from today (current date)
2. **This Month** - All data from the first day of the current month to today
3. **Custom** - Select any date range with start and end dates

### ✅ Account & Platform Filtering

- Select/deselect individual accounts
- Select/deselect individual platforms
- "Select All" / "Deselect All" buttons
- Visual indicators showing selection count

### ✅ User Experience

- Smooth animations with Framer Motion
- Help tooltips
- Loading states
- Error handling
- Summary display

---

## Usage Example

```jsx
import DataSelector from './components/DataSelector';
import DataViewer from './components/DataViewer';
import { useDataFetch } from './hooks/useDataFetch';
import { fetchData, exportDataToCSV, getAccounts, getPlatforms } from './api/dataApi';
import { useState, useEffect } from 'react';

function DataPage() {
    const [accounts, setAccounts] = useState([]);
    const [platforms, setPlatforms] = useState([]);
    const { data, loading, error, fetchData, reset } = useDataFetch(fetchData);

    // Load accounts and platforms
    useEffect(() => {
        Promise.all([getAccounts(), getPlatforms()])
            .then(([accs, plats]) => {
                setAccounts(accs);
                setPlatforms(plats);
            })
            .catch(console.error);
    }, []);

    const handleDataRequest = async (requestParams) => {
        await fetchData(requestParams);
    };

    const handleExport = async () => {
        if (!data) return;
        
        try {
            const blob = await exportDataToCSV(data.requestParams);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `data-export-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Export failed:', err);
        }
    };

    return (
        <div className="space-y-6">
            <DataSelector
                accounts={accounts}
                platforms={platforms}
                onDataRequest={handleDataRequest}
                isLoading={loading}
            />
            
            <DataViewer
                data={data}
                loading={loading}
                error={error}
                onRefresh={() => fetchData(data?.requestParams)}
                onExport={handleExport}
            />
        </div>
    );
}
```

---

## API Integration

### Backend Endpoint Expected

```python
# POST /api/data
{
    "start_date": "2024-11-24",
    "end_date": "2024-11-24",
    "accounts": ["account1", "account2"],
    "platforms": ["platform1", "platform2"],
    "range_type": "today"  # or "this_month" or "custom"
}

# Response
{
    "summary": {
        "total_records": 1234,
        "total_accounts": 5,
        "total_platforms": 3
    },
    "records": [
        { "id": 1, "account": "...", "platform": "...", ... },
        ...
    ]
}
```

---

## Component Props

### DataSelector

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `accounts` | `Array` | No | Array of account objects `{id, name}` or strings |
| `platforms` | `Array` | No | Array of platform objects `{id, name}` or strings |
| `onDataRequest` | `Function` | Yes | Callback with `{dateRange, accounts, platforms, rangeType}` |
| `isLoading` | `Boolean` | No | Loading state |

### DataViewer

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `data` | `Object` | No | Data object with `summary` and `records` |
| `loading` | `Boolean` | No | Loading state |
| `error` | `String` | No | Error message |
| `onRefresh` | `Function` | No | Refresh callback |
| `onExport` | `Function` | No | Export callback |

---

## Request Parameters Format

```javascript
{
    dateRange: {
        start: "2024-11-24",  // YYYY-MM-DD
        end: "2024-11-24"     // YYYY-MM-DD
    },
    accounts: ["account1", "account2"],
    platforms: ["platform1", "platform2"],
    rangeType: "today"  // "today" | "this_month" | "custom"
}
```

---

## Styling

The component uses the existing design system:
- `glass-card` class for cards
- `btn-primary` for buttons
- Tailwind CSS for styling
- Framer Motion for animations

---

## Next Steps

1. **Backend Integration**: Create the `/api/data` endpoint
2. **Account/Platform Loading**: Implement `getAccounts()` and `getPlatforms()`
3. **Data Formatting**: Customize `DataViewer` for your data structure
4. **Export Functionality**: Implement CSV/JSON export

---

**The component is ready to use! Just integrate with your backend API.** 🚀

