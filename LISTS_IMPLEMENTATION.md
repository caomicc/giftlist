# Multiple Lists Implementation

This implementation adds support for multiple lists per user with public/private visibility settings, perfect for scenarios like creating lists for babies who can't make their own accounts.

## Features Implemented

### 1. Multiple Lists Per User
- Users can create multiple named lists (e.g., "Baby Emma's List", "My Wishlist")
- Each list has a name, optional description, and privacy setting
- Lists are owned by users and contain gift items

### 2. Privacy Settings
- **Public Lists (default)**: List owner can see if items have been purchased (but not by whom)
- **Private Lists**: List owner cannot see purchase status at all
- Other family members can always see purchase status to avoid duplicate purchases

### 3. Database Schema
- New `lists` table with privacy controls
- Updated `gift_items` table with `list_id` foreign key
- Maintains all existing gift card functionality

## Usage Scenario: Baby Lists

1. **Parent creates baby list**: Sarah creates "Baby Emma's List" 
2. **Set to private**: Sarah sets the list as private so she can't see if gifts were purchased
3. **Add gifts**: Sarah adds items Emma needs (clothes, toys, etc.)
4. **Family purchases**: Other family members can see the list and purchase items
5. **Parent can't spoil surprise**: Sarah can't see which items have been purchased

## API Endpoints Added

### Lists Management
- `GET /api/lists` - Get all lists for current user
- `POST /api/lists` - Create new list
- `GET /api/lists/[id]` - Get specific list
- `PUT /api/lists/[id]` - Update list (name, description, privacy)
- `DELETE /api/lists/[id]` - Delete list (only if empty)

### Updated Gift Items
- Updated to require `list_id` when creating items
- Enhanced with privacy logic in responses
- Maintains backward compatibility

## Files Created/Modified

### New Files
- `scripts/neon/08-add-lists-support.sql` - Database migration
- `migrate-lists.js` - Migration runner script
- `app/api/lists/route.ts` - Lists CRUD API
- `app/api/lists/[id]/route.ts` - Individual list API
- `hooks/useListData.ts` - List management hook
- `hooks/useGiftListData.ts` - Combined list and gift management with privacy

### Modified Files
- `lib/neon.ts` - Added List type and updated GiftItem type
- `app/api/gift-items/route.ts` - Enhanced with list support and privacy logic
- `hooks/useGiftData.ts` - Updated to require list_id for new items

## Migration Steps

1. **Run the migration**:
   ```bash
   node migrate-lists.js
   ```

2. **Verify migration**:
   - Check that existing users have default lists created
   - Existing gift items should be assigned to default lists
   - New tables and constraints should be in place

## Privacy Logic Implementation

The privacy logic is implemented in multiple layers:

1. **Database Level**: Lists have `is_public` boolean field
2. **API Level**: Gift items query includes list privacy information
3. **Frontend Level**: `useGiftListData` hook applies privacy rules:
   - If list is private AND current user is owner → hide purchase status
   - Otherwise → show purchase status

## Technical Details

### List Schema
```sql
CREATE TABLE lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES users(id),
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Privacy Rules
- **Public list (is_public=true)**: Owner sees "✓ Purchased" but not who purchased it
- **Private list (is_public=false)**: Owner sees nothing about purchase status
- **Other users**: Always see purchase status to coordinate purchases

This implementation solves the baby list problem while maintaining all existing functionality and adding powerful new features for family gift coordination.