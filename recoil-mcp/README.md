# Recoil MCP Server (Model Context Protocol)

This directory contains a standalone, fully-featured **Model Context Protocol (MCP)** server implemented as a single, zero-dependency Cloudflare Worker. It binds directly to your Recoil app's D1 SQLite database to let Claude read, search, and update your worldbuilding and creative writing data in real time during a conversation.

---

## Features

- **23 Specialized Tools**: Fully exposes verses, characters (profiles, vibes, core wounds, symbolic identities), character relationships (12 tension & connection dimensions), lore worldbuilding, writing pieces, chapters, headcanons, story arcs, and foreshadowing entries.
- **Bi-directional Capability**: Allows LLMs to not only read and search but also create characters, add lore entries, save headcanons, and draft writing pieces on your behalf.
- **Secured Endpoint**: Uses a secret path URL authentication pattern (`/YOUR_SECRET/mcp`) to ensure only authorized clients can query or modify your creative database.
- **Zero-Dependency Single File**: Simple to install, requiring no bundlers or complex build chains. Just copy-paste into the Cloudflare Worker dashboard.

---

## Deployment & Setup Instructions

Follow these five simple steps to run your Recoil MCP server:

### Step 1: Create a Cloudflare Worker
1. Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Navigate to **Compute (Workers & Pages)** > **Create** > **Create Worker**.
3. Name your worker (e.g., `recoil-mcp`).
4. Click **Deploy** to create the worker shell.

### Step 2: Paste the Worker Code
1. Click **Edit Code** inside your new worker's dashboard.
2. Open `worker.js` (or delete all content from the default script).
3. Copy the entire contents of `recoil-mcp/worker.ts` and paste it into the editor.
4. Click **Save and Deploy**.

### Step 3: Bind to the Recoil D1 Database
Your MCP server must bind to the same D1 SQLite database that your main Recoil app uses:
1. In the Cloudflare Worker dashboard, go to the **Settings** tab.
2. Under **Variables and Bindings**, look for **D1 Database Bindings**.
3. Click **Add Binding**.
4. Set the **Variable Name** strictly to `DB`.
5. Select your Recoil D1 Database from the dropdown menu (usually named after your project).
6. Click **Save**.

### Step 4: Configure the Path Authentication Secret
Secure your server from crawlers and malicious requests:
1. In the same **Settings** tab under **Variables and Bindings**, look for **Environment Variables**.
2. Click **Add Variable**.
3. Name the variable `MCP_SECRET`.
4. Enter a secure, long random string of your choice (e.g., `my-recoil-magic-secret-99`). This will act as your password.
5. Click **Save** and deploy the changes.

---

## Connecting Clients (How to Use)

Your final MCP server endpoint will look like this:
```
https://recoil-mcp.<YOUR_CLOUDFLARE_SUBDOMAIN>.workers.dev/<YOUR_MCP_SECRET>/mcp
```

Here is how you can connect your favorite AI clients to it:

### 1. Claude Desktop App
Add this to your `claude_desktop_config.json` file:

- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "recoil": {
      "command": "curl",
      "args": [
        "-X", "POST",
        "-H", "Content-Type: application/json",
        "-d", "{\"jsonrpc\":\"2.0\",\"method\":\"tools/list\",\"id\":1}",
        "https://recoil-mcp.<YOUR_SUBDOMAIN>.workers.dev/<YOUR_MCP_SECRET>/mcp"
      ]
    }
  }
}
```
*(Or use a dedicated MCP HTTP proxy bridge such as `@modelcontextprotocol/server-http`).*

### 2. Cursor, LibreChat, or other MCP Clients
Most clients allow you to add an HTTP MCP server directly via their settings interface. 
- **Type**: `SSE` or `HTTP`
- **URL**: `https://recoil-mcp.<YOUR_SUBDOMAIN>.workers.dev/<YOUR_MCP_SECRET>/mcp`

---

## Exposed Tools Catalog

Once connected, Claude can call any of the following tools:

| Tool Name | Action | Key Parameters |
| :--- | :--- | :--- |
| `recoil_list_verses` | Discover all available creative universes. | None |
| `recoil_get_verse_overview` | Get an intensive briefing of an entire universe. | `verse_id` |
| `recoil_list_characters` | List all characters in a verse with compact stats. | `verse_id`, `narrative_role` |
| `recoil_get_character` | Get the full character profile (wound, appearance, backstory). | `character_id` |
| `recoil_find_character_by_name`| Search characters by name to resolve IDs. | `verse_id`, `name` |
| `recoil_list_relationships` | List all relationships in a verse with top tensions. | `verse_id` |
| `recoil_get_character_relationships` | Load all 12 psychological tension/relationship dimensions. | `character_id` |
| `recoil_list_lore` | Discover world-building articles by category. | `verse_id`, `category` |
| `recoil_get_lore_entry` | Read the full markdown content of a lore article. | `entry_id` |
| `recoil_list_writing` | Browse draft and complete stories, novels, and scenes. | `verse_id`, `type` |
| `recoil_get_writing` | Load a specific writing piece. | `writing_id`, `include_content` |
| `recoil_list_chapters` | List chapters within a novel, ordered. | `writing_piece_id` |
| `recoil_get_chapter` | Retrieve full chapter prose. | `chapter_id` |
| `recoil_list_headcanons` | List headcanons and their current validation state. | `verse_id`, `character_id` |
| `recoil_list_foreshadowing` | Track seeds, pending payoffs, and resolved lines. | `verse_id` |
| `recoil_list_story_arcs` | Retrieve planning and developmental arcs. | `verse_id` |
| `recoil_search` | Run a full-text search across all items in a universe. | `verse_id`, `query` |
| `recoil_get_verse_stats` | Load a high-level statistical analysis of your universe. | `verse_id` |
| `recoil_create_character` | Create a new original character (returns ID). | `verse_id`, `name` |
| `recoil_update_character_field` | Update a specific field (backstory, age, traits, etc.). | `character_id`, `field`, `value` |
| `recoil_create_lore_entry` | Create a new worldbuilding lore article. | `verse_id`, `title`, `category`, `content` |
| `recoil_add_headcanon` | Save a new headcanon, optionally for a character. | `verse_id`, `content`, `canon_status` |
| `recoil_create_writing_piece` | Initialize a new manuscript, scene, or drabble. | `verse_id`, `title`, `type` |
