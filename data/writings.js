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
     author: 'neerav',  // or 'friend'
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
    id: 'a-friend-like-you',
    title: 'A Friend Like You',
    type: 'poem',
    date: '2026-08-29',
    author: 'neerav',
    excerpt: '"Some people walk into your life and change everything..."',
    content: `Some people walk into your life
and change everything —
not loudly, not all at once,
but quietly, like the first light of morning
that makes you realize
the darkness wasn't permanent.

You were one of those people.

When the world felt too heavy
and I couldn't find the words
to explain why I was tired
of pretending to be fine,
you sat with me in that silence
and made it feel less lonely.

You didn't try to fix me.
You didn't say it would all be okay.
You just stayed.

And somehow, that was everything.

You taught me that friendship
isn't about being there for the big moments
(though you were),
but about showing up
for the small, unremarkable days
when nothing happens
except that we existed
in the same space
and that was enough.

You reminded me what it feels like
to laugh until my stomach hurts,
to be understood without explaining,
to be seen — really seen —
and not turned away.

I don't say it enough,
but you are important.
Not just to me,
but to the version of me
that still believes
people can be kind
for no reason other than
they choose to be.

Thank you.
For every conversation.
For every moment of patience.
For being the kind of friend
who makes life feel
a little less heavy
and a lot more possible.

I'm lucky.
The world is big and random
and somehow,
out of everyone,
I found you.`,
    tags: ['friendship', 'gratitude', 'life', 'important'],
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
