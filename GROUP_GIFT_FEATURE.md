# Group Gift Feature

## Overview
The group gift functionality allows users to mark gifts as "group gifts" and enables family members to express interest in participating. This helps coordinate who wants to contribute to larger or more expensive gifts.

## How It Works

### For Gift Owners (List Creators)
1. When adding or editing a gift, you can check the "This is a group gift" checkbox
2. A purple "Group Gift" badge will appear on the item
3. You can see how many people are interested in participating (but your own interest is hidden from the count)
4. This helps you understand if there's enough interest for a group purchase

### For Family Members (Gift Viewers)
1. When viewing a gift marked as a group gift, you'll see a "Group Gift" badge
2. Click the "Interested in Group Gift?" button to express your interest
3. Once clicked, the button changes to "Interested" (blue) and you can click again to remove your interest
4. You can see how many other people are interested by clicking on the badge showing the count
5. The list owner's interest (if they express any) is hidden from the count to avoid bias

## Key Features
- **Privacy**: Gift owners don't see who specifically is interested (just the count), maintaining the surprise element
- **Coordination**: Helps family members coordinate without spoiling the surprise
- **Flexible**: Works alongside regular gifts, gift cards, and all other features
- **Non-committal**: Expressing interest doesn't commit you to purchasing - it's just a signal

## Database Schema

### `gift_items` table
- Added `is_group_gift` BOOLEAN column (default: FALSE)

### `gift_interest` table (new)
- `id`: Unique identifier
- `gift_item_id`: Reference to the gift item
- `user_id`: Reference to the user expressing interest
- `created_at`: Timestamp
- Unique constraint on (gift_item_id, user_id) to prevent duplicate interests

## API Endpoints

### GET `/api/gift-interest?gift_item_id={id}`
Retrieves all users interested in a specific gift item.

**Response:**
```json
{
  "interests": [
    {
      "id": "...",
      "gift_item_id": "...",
      "user_id": "...",
      "user_name": "John Doe",
      "user_email": "john@example.com",
      "created_at": "2025-11-15T..."
    }
  ]
}
```

### POST `/api/gift-interest`
Express interest in a group gift.

**Request:**
```json
{
  "gift_item_id": "...",
  "user_id": "..."
}
```

**Response:**
```json
{
  "interest": {
    "id": "...",
    "gift_item_id": "...",
    "user_id": "...",
    "user_name": "...",
    "user_email": "...",
    "created_at": "..."
  }
}
```

### DELETE `/api/gift-interest?gift_item_id={id}&user_id={id}`
Remove interest in a group gift.

**Response:**
```json
{
  "success": true
}
```

## Migration

To apply the database changes, run:

```bash
node run-group-gift-migration.js
```

This will:
1. Add the `is_group_gift` column to the `gift_items` table
2. Create the `gift_interest` table
3. Add necessary indexes for performance
4. Attempt to add foreign key constraints (will gracefully handle if data types don't match)

**Note:** The migration uses `IF NOT EXISTS` and `ADD COLUMN IF NOT EXISTS` to ensure it's safe to run on existing databases. No data will be lost.

## Components

### `GroupGiftInterest`
A new component that displays:
- For non-owners: A button to express/remove interest
- For everyone: A count of interested users (excluding the owner if they're interested)
- When clicked, shows names of interested users

### Updated Components
- `GiftItem`: Now displays the group gift badge and interest component
- `AddGiftForm`: Added checkbox to mark gifts as group gifts
- `EditGiftDialog`: Added checkbox to toggle group gift status

## UI Elements

### Badges
- Purple "Group Gift" badge with Users icon appears on group gift items
- Badge shows count of interested users (clickable to see details)

### Buttons
- "Interested in Group Gift?" (secondary) - for expressing interest
- "Interested" (blue) - shown when user has already expressed interest

### Colors
- Purple theme for group gift elements (badge, checkbox section background)
- Blue for active "interested" state

## Security
- Users can only add/remove interest for themselves
- Authentication required for all gift interest operations
- Owner's interest is hidden from other family members to maintain surprise

## Use Cases
1. **Expensive Gifts**: Coordinate on big-ticket items like furniture, electronics, etc.
2. **Baby Shower Gifts**: Multiple family members can coordinate on larger baby items
3. **Birthday Parties**: Group together for special birthday surprises
4. **Holidays**: Coordinate on major holiday gifts

## Compatibility
- Works with existing gift card functionality
- Compatible with public/private list settings
- Maintains all existing gift item features (archive, purchase tracking, etc.)
