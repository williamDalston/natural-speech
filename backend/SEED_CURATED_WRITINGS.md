# Seeding Curated Amazing Writings

This guide explains how to populate the database with curated amazing writings from literature, poetry, speeches, and essays.

## Overview

The seed script (`seed_curated_writings.py`) adds a collection of wonderful writings that users can browse through for inspiration. These include:

- **Poetry**: Works by Robert Frost, William Shakespeare, Walt Whitman, Edgar Allan Poe, T.S. Eliot, and more
- **Speeches**: Famous speeches by Martin Luther King Jr., Abraham Lincoln
- **Prose**: Excerpts from F. Scott Fitzgerald, Edgar Allan Poe
- **Essays**: Works by Thomas Jefferson, Virginia Woolf, Ralph Waldo Emerson

## Running the Seed Script

### Option 1: Direct Python Execution

```bash
cd backend
python seed_curated_writings.py
```

### Option 2: Using Python Module

```bash
cd backend
python -m seed_curated_writings
```

## What the Script Does

1. **Initializes the database** if it doesn't exist
2. **Checks for existing curated writings** - if any exist, it skips seeding to avoid duplicates
3. **Adds 15 curated writings** with:
   - Title
   - Author
   - Genre (Poetry, Speech, Prose, Essay)
   - Full content
   - Category set to "curated"

## Database Schema

The script uses the `Writing` model with the following fields:
- `id`: Auto-generated primary key
- `title`: Title of the writing
- `author`: Author name
- `content`: Full text content
- `category`: "curated" for seeded writings, "user" for user-created writings
- `genre`: Genre classification (Poetry, Speech, Prose, Essay)
- `created_at`: Timestamp
- `updated_at`: Timestamp

## Accessing Curated Writings

Once seeded, users can access curated writings through:

1. **API Endpoint**: `GET /api/writings/curated`
   - Optional query parameter: `genre` to filter by genre
   - Example: `/api/writings/curated?genre=Poetry`

2. **Frontend**: Navigate to the "Amazing Writing" tab in the sidebar

## Genres Available

- Poetry
- Speech
- Prose
- Essay

## Notes

- The script is idempotent - running it multiple times won't create duplicates
- Existing curated writings are preserved
- User-created writings are not affected
- The script logs all operations for debugging

## Troubleshooting

If you encounter issues:

1. **Database not found**: Make sure the database file exists or the DATABASE_URL is correctly configured
2. **Import errors**: Ensure all dependencies are installed (`pip install -r requirements.txt`)
3. **Permission errors**: Check that the database file is writable

## Adding More Curated Writings

To add more writings, edit `seed_curated_writings.py` and add entries to the `CURATED_WRITINGS` list with the following structure:

```python
{
    "title": "Title of the Writing",
    "author": "Author Name",
    "genre": "Poetry",  # or "Speech", "Prose", "Essay"
    "content": "Full text content here..."
}
```

Then run the script again. Note: The script will only add new entries if no curated writings exist, so you may need to manually add them or modify the script logic.

