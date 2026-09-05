/* ============================================================
   WRITINGS DATA STORE
   ============================================================
   To add a new writing, simply add an object to the WRITINGS array.
   The website will automatically:
   - Display it in the archive
   - Include it in search and filters
   - Add it to the timeline
   - Update all statistics
   - Link it by tags and collections

   HOW TO ADD YOUR POEM:

   1. Copy the template below
   2. Paste it into the WRITINGS array (after the opening [ bracket)
   3. Fill in your details:
      - id: use lowercase with hyphens (e.g., 'my-poem-title')
      - title: The actual title of your poem
      - date: Today's date or when you wrote it (YYYY-MM-DD)
      - excerpt: A short preview (first line works well)
      - content: Your full poem - PRESERVE LINE BREAKS EXACTLY
      - tags: Keywords that describe it ['friendship', 'gratitude', 'life']
   4. Save the file
   5. Refresh your browser - done!

   TEMPLATE TO COPY:

   {
     id: 'poem-slug-here',
     title: 'Your Poem Title',
     type: 'poem',
     date: '2026-08-29',
     author: 'neerav',  // or 'avigna'
     excerpt: '"First line or a teaser..."',
     content: `Line one of your poem
Line two preserves spacing exactly
Blank lines create stanzas

Second stanza here
And so on...`,
     tags: ['friendship', 'life', 'gratitude'],
     readingTime: '2 min read',
     featured: true,
     collection: 'personal'
   },

   Then add a comma and paste another one for your next poem!
   ============================================================ */

const WRITINGS = [
  {
    id: 'where-happiness-lives',
    title: 'Where Happiness Lives',
    type: 'poem',
    date: '2026-08-30',
    author: 'neerav',
    excerpt: '"Sometimes happiness isn\'t a place, or a moment we try to chase..."',
    content: `Sometimes happiness isn't a place,
Or a moment we try to chase.
Sometimes it's simply someone near,
Who turns a cloudy day sincere.

It lives in laughter, loud and bright,
In silly jokes that feel just right,
In quiet talks beneath the sky,
And knowing someone's standing by.

A friend can make the ordinary glow,
Turn little moments into a show.
A walk, a smile, a passing glance—
Suddenly, life feels like a dance.

Through changing seasons, days, and years,
Through all our joys and little fears,
The best of friendships gently prove
That happiness is something we move through.

For life may wander, twist, and bend,
But every heart feels lighter when
It has a hand to hold, a voice to hear—
And someone who makes the world feel near.

So here's to friendship, warm and true,
To all the little things friends do—
For happiness may come and go,
But friendship gives it room to grow...`,
    tags: ['friendship', 'happiness', 'gratitude', 'life'],
    readingTime: '2 min read',
    featured: true,
    collection: 'personal'
  }

  // ADD YOUR NEXT POEM HERE
  // Copy the template from above, paste it here with a comma after the } above
  // Example:
  // ,
  // {
  //   id: 'my-second-poem',
  //   title: 'My Second Poem',
  //   ...
  // }
];

/* ============================================================
   DELETED WRITINGS (GLOBAL BLACKLIST)
   Add IDs of any writings here to permanently remove them across all devices:
   ============================================================ */
const DELETED_WRITINGS = ['a-friend-like-you', 'our-first-story'];


/* ============================================================
   COLLECTIONS
   ============================================================ */
const COLLECTIONS = [
  {
    id: 'personal',
    name: 'Personal',
    description: 'Poems about people, moments, and feelings that matter.',
    icon: '💫'
  },
  {
    id: 'reflections',
    name: 'Reflections',
    description: 'Thoughts about life, time, and everything in between.',
    icon: '🌙'
  },
  {
    id: 'moments',
    name: 'Moments',
    description: 'Small observations that felt worth preserving.',
    icon: '✨'
  }
];
