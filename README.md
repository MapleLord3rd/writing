# ✦ The Archive

A beautiful, sophisticated personal writing website that acts as a digital archive for poems, stories, articles, essays, and other written works.

## 📁 Project Structure

```
writing-archive/
├── index.html              # Main HTML file
├── css/
│   └── styles.css          # All styles, animations, dark mode
├── js/
│   └── app.js              # Application logic, routing, UI
├── data/
│   └── writings.js         # Writing data store (add your works here)
├── assets/                 # For images, fonts, etc. (optional)
└── README.md               # This file
```

## 🚀 Getting Started

1. **Open the website**: Simply open `index.html` in any modern browser
2. **Add your writing**: Edit `data/writings.js` to add poems, stories, articles, or essays
3. **Customize**: Modify colors, fonts, and content to make it yours

## ✍️ Adding & Managing Poems (Directly from the Website)

Your friend can add, edit, and delete writings **directly in the browser without writing any code**:

### 1. Add a New Writing
- Click the **`+` floating button** in the bottom-right corner of any page.
- An elegant form opens up where they can enter:
  - **Title**
  - **Type** (Poem, Story, Article, Essay, Note)
  - **Date**
  - **Excerpt** (short teaser shown on cards)
  - **Content** (for poems, every line break is preserved exactly)
  - **Tags** (e.g., `friendship, gratitude, life`)
  - **Collection** (e.g., Personal, Reflections, Moments)
  - **Featured** (check to display on the home page)
- Click **Save Writing** — it appears instantly across the website!

### 2. Edit or Delete a Writing
- Open any writing/poem to read it.
- In the top-right corner, they will see **Edit** (pencil) and **Delete** (trash) buttons.
- Clicking **Edit** re-opens the form with the current content.
- Clicking **Delete** removes it after confirmation.

### 3. Backup & Restore (Export/Import)
- On the **About** page, scroll to the bottom.
- Click **Export Archive (.json)** to download a complete backup file.
- Click **Import Archive (.json)** to restore from a backup on another device or browser.

---

## 💻 Alternative: Adding via Code (Optional)

If you prefer editing the code directly, open `data/writings.js` and add an object to the `WRITINGS` array:

```javascript
{
  id: 'a-friend-like-you',
  title: 'A Friend Like You',
  type: 'poem',
  date: '2026-08-29',
  excerpt: '"Some people walk into your life and change everything..."',
  content: `Line one of your poem
Line two preserves spacing exactly

Blank lines create stanzas`,
  tags: ['friendship', 'gratitude', 'life'],
  readingTime: '2 min read',
  featured: true,
  collection: 'personal'
}
```

## 🎨 Features

### Content Management (No Coding Required!)
- **In-Browser Editor** — Add, edit, and delete writings directly from the website
- **Floating `+` Button** — Always accessible for adding new writings
- **Visual Form Editor** — Clean interface for entering title, content, tags, etc.
- **Edit/Delete Tools** — Appear on every writing's reading page
- **Export/Import** — Backup and restore your complete archive as JSON
- **localStorage Persistence** — All writings are saved in the browser automatically

### Pages
- **Home** — Cinematic landing with featured works
- **Archive** — Filterable, searchable grid of all writings
- **Reading Page** — Clean, distraction-free reading experience
- **Collections** — Curated groupings by theme or mood
- **Timeline** — Chronological journey through your writing
- **Writer's Desk** — Auto-calculated statistics
- **About** — Personal bio section with backup/restore tools
- **Tag Pages** — Browse writings by tag

### Design
- **Typography** — Cormorant Garamond (serif), Inter (sans), JetBrains Mono (mono)
- **Colors** — Warm ivory, deep charcoal, muted burgundy, soft gold
- **Dark Mode** — Beautiful "reading at midnight" theme
- **Animations** — Subtle grain texture, floating particles, elegant transitions
- **Responsive** — Works perfectly on desktop, tablet, and mobile

### Technical
- **No dependencies** — Pure HTML, CSS, and vanilla JavaScript
- **Accessible** — Semantic HTML, ARIA labels, keyboard navigation
- **Performance** — Fast loading, smooth animations, optimized rendering
- **Print-friendly** — Clean print stylesheet included

## 🎯 Customization

### Colors
Edit CSS variables in `css/styles.css`:

```css
:root {
  --accent: #7A3B3E;      /* Your brand color */
  --gold: #B8976A;        /* Accent highlights */
  --bg: #F7F4EF;          /* Background color */
  /* ... more variables ... */
}
```

### Collections
Edit the `COLLECTIONS` array in `data/writings.js`:

```javascript
{
  id: 'my-collection',
  name: 'Collection Name',
  description: 'What this collection is about.',
  icon: '🌟'
}
```

Then assign writings to the collection using `collection: 'my-collection'`.

### About Page
Edit the content directly in `index.html` — search for `page--about`.

## 📝 Writing Tips

- **Poems**: Line breaks and spacing are preserved exactly as you type them
- **Prose**: Use double line breaks (`\n\n`) between paragraphs
- **Excerpts**: Keep them short and compelling — they appear on cards
- **Tags**: Use lowercase, single words or hyphenated phrases
- **Reading Time**: Be honest — readers appreciate accurate estimates

## 🌐 Deployment

### Option 1: GitHub Pages
1. Create a GitHub repository
2. Push your `writing-archive/` folder
3. Enable GitHub Pages in Settings → Pages
4. Your site will be live at `username.github.io/repo-name`

### Option 2: Netlify
1. Drag and drop the `writing-archive/` folder to [Netlify Drop](https://app.netlify.com/drop)
2. Your site goes live instantly

### Option 3: Any static host
Upload the entire `writing-archive/` folder to any static hosting service.

## 🛠️ Browser Support

Works in all modern browsers:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## 📄 License

This is your personal archive. Use it however you like.

---

**Built with care for writers who want their words to live somewhere beautiful.**

✦ Written, remembered, and archived.
