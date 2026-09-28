/**
 * The passages the sprints and the timed text tests are made of.
 *
 * A prose paragraph is one line, however long: the surface wraps it, and a
 * text test that asked for Enter in the middle of a thought would be testing
 * something no one types prose with. Each is short enough to read at a
 * glance and long enough that loading the next one is not a rhythm of its
 * own. Plain sentences — capitals, commas and full stops, no code — because
 * that is what a text test is for; the code tests are next door.
 */

/** The classic: every letter of the alphabet in one sentence. */
export const PANGRAM = 'The quick brown fox jumps over the lazy dog'

export const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'

export const PROSE: string[] = [
  "The harbour wakes before the town does. Gulls work the edge of the pier, a ferry clears its throat, and the first boats slide out past the lighthouse while the cafes are still stacking chairs. By the time anyone opens a window, the day's catch is already on ice.",
  'Learning a new keyboard layout is humbling. For a week every word feels like a small negotiation, and the fingers reach for keys that have moved. Then one morning a whole sentence arrives without a thought, and the old layout starts to feel strange instead.',
  'A good map leaves things out. It does not show every tree or every crack in the road, only the turns you need and the landmarks you will recognise. Knowing what to leave out is most of the work, and it is the part nobody sees when the map is finished.',
  'The bakery on the corner has used the same oven for forty years. It runs hot at the back and cool near the door, so the bakers turn each tray halfway through without looking. Nobody wrote that down. It lives in their hands, the way most useful knowledge does.',
  'Rain came in sideways off the fjord, and the ferry queue waited in their cars with the engines running. A boy in a yellow coat walked the line selling waffles from a basket, folded in paper and still warm. He was sold out long before the boat arrived.',
  'Speed is a side effect. Typists who chase it directly tend to tense up, miss more keys and end up slower than when they started. The ones who get fast usually aim for rhythm instead: an even pace, a light touch, and no rush to fix the last mistake.',
  'The old library keeps a ladder on rails that runs the length of the reading room. Children are not supposed to ride it, and every child who visits finds a reason to try. The librarian pretends not to notice, as long as nobody knocks over the globe.',
  'Mountain weather changes faster than any forecast. A clear morning can close in by noon, and a path that was obvious on the way up disappears under cloud on the way down. Experienced walkers turn back early, not because they are timid, but because they have been caught before.',
  'Every city has a sound that belongs to it. In one it is trams grinding round a corner, in another it is church bells arguing across the rooftops on a Sunday. People who move away often say that is what they miss first, long before the food or the view.',
  'The garden looked finished in June and wild by August. Beans climbed past their poles, squash spilled over the path, and the tomatoes ripened all at once, so for two weeks every meal had tomatoes in it. Nobody complained. It was the best part of the year.',
  'A bridge is mostly a promise about weight. Engineers work out the heaviest load it will ever carry, add a generous margin, and then build for that. The margin is invisible on the day it opens, and it is the only reason the bridge is still standing fifty years later.',
  'Night trains have their own kind of quiet. The carriage rocks, the lights dim to a blue glow, and towns pass as a scatter of windows and the bell of a level crossing. You fall asleep in one country and wake up in another with no memory of the border.',
  'Most writing is rewriting. The first draft gets the ideas out of your head and onto the page, where you can finally see what is wrong with them. The second draft fixes the order, the third cuts what is not needed, and only then does it start to sound like you.',
  'The market opens at six on Saturdays. Fishmongers shout their prices, the cheese stall hands out samples on the end of a knife, and a man with a single table sells nothing but honey from his own hives. He is always the first to sell out, and he never raises his price.',
  'Practice works best in short, honest sessions. Ten minutes of full attention beat an hour of half-hearted repetition, because the mind learns from what it notices. When you start to drift, stop, stretch your hands, and come back to it tomorrow.',
  "The lighthouse keeper's log is mostly about weather. Wind from the west, visibility poor, lamp lit at four. Now and then there is something else: a whale seen at dawn, a ship that signalled thanks, a storm that took the door off the shed. Those are the lines people remember.",
  'Snow fell all night without a sound, and by morning the street had lost its edges. Cars were soft white shapes, the fences had grown thick caps, and the only tracks were a line of small prints where a fox had crossed the road and thought better of it.',
  'The workshop smells of sawdust and linseed oil. Chisels hang in a row above the bench, each one in the same place for thirty years, so a hand can find the right width without a glance. A tool that is put back where it lives is a tool that is ready.',
]
