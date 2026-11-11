// SAMPLE DATA — every article, number and trend in this file is generated.
// None of it comes from, or represents, any real publication or news organisation.

export const CATEGORIES = [
  'Technology',
  'Business',
  'Culture',
  'Science',
  'Sport',
  'Lifestyle',
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface Article {
  id: string;
  title: string;
  summary: string;
  category: Category;
  author: string;
  publishedAt: string; // ISO date (yyyy-mm-dd)
  readMinutes: number;
  /** Views per day, aligned with SAMPLE_DATES. 0 before publication. */
  dailyViews: number[];
  likeRate: number;
  commentRate: number;
  shareRate: number;
}

/** Number of days of history in the sample set. */
export const HISTORY_DAYS = 90;

// Fixed "today" so the sample set is identical on every load.
const END_DATE = new Date(Date.UTC(2026, 10, 10));

// Deterministic PRNG (mulberry32) so the sample data never changes between reloads.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20261111);
const pick = <T,>(list: readonly T[]) => list[Math.floor(rand() * list.length)];
const between = (min: number, max: number) => min + rand() * (max - min);

function isoDay(offsetFromEnd: number) {
  const d = new Date(END_DATE);
  d.setUTCDate(d.getUTCDate() - offsetFromEnd);
  return d.toISOString().slice(0, 10);
}

export const SAMPLE_DATES: string[] = Array.from({ length: HISTORY_DAYS }, (_, i) =>
  isoDay(HISTORY_DAYS - 1 - i),
);

const AUTHORS = [
  'Sample Author A',
  'Sample Author B',
  'Sample Author C',
  'Sample Author D',
  'Sample Author E',
  'Sample Author F',
];

const TOPICS: Record<Category, { titles: string[]; summary: string }> = {
  Technology: {
    titles: [
      'How on-device AI is changing everyday apps',
      'A beginner’s guide to passkeys',
      'Why foldable phones are finally getting good',
      'Inside the race to build cheaper batteries',
      'Five browser features you probably aren’t using',
      'What open-source maintainers wish you knew',
      'The quiet return of the desktop app',
      'Smart home standards, explained simply',
      'Testing three budget laptops for students',
      'Is your password manager doing enough?',
    ],
    summary:
      'A practical look at the trend, what it means for ordinary users, and the questions worth asking before you upgrade.',
  },
  Business: {
    titles: [
      'Small cafés and the four-day week experiment',
      'What rising rents mean for high-street shops',
      'The subscription fatigue backlash',
      'How family businesses plan for succession',
      'Remote work, two years on',
      'Why more founders are bootstrapping',
      'A plain-English guide to inflation figures',
      'Local markets bounce back after a slow spring',
      'The economics of second-hand fashion',
      'Freelancers and the late-payment problem',
    ],
    summary:
      'Owners, workers and economists weigh in on what is changing, who benefits, and what to watch over the next year.',
  },
  Culture: {
    titles: [
      'The rise of the neighbourhood book club',
      'Why vinyl keeps outselling expectations',
      'A weekend guide to free museum exhibitions',
      'Community theatre’s surprising comeback',
      'What makes a podcast worth finishing',
      'Street food festivals worth the trip',
      'The art of the handwritten letter',
      'Films that quietly shaped a generation',
      'Learning a second language as an adult',
      'Inside a volunteer-run cinema',
    ],
    summary:
      'Stories from the people keeping local culture alive, with recommendations you can try this weekend.',
  },
  Science: {
    titles: [
      'What the latest comet sighting tells us',
      'How sleep shapes memory, according to new studies',
      'The science behind urban heat islands',
      'Why bees matter more than you think',
      'A short history of vaccines',
      'Can rewilding really bring species back?',
      'What we still don’t know about the deep ocean',
      'The physics of a perfect pancake flip',
      'Microplastics: what the evidence says',
      'How weather forecasts got so accurate',
    ],
    summary:
      'A clear explanation of the research, what scientists agree on, and where the open questions remain.',
  },
  Sport: {
    titles: [
      'Grassroots football clubs and the volunteer gap',
      'How amateur runners can avoid injury',
      'The data revolution in women’s cricket',
      'Why padel is the fastest-growing sport around',
      'Cycling to work: a first-month diary',
      'Youth swimming programmes under pressure',
      'What makes a great sports documentary',
      'Inside a parkrun on a rainy Saturday',
      'Climbing walls and the bouldering boom',
      'Coaching kids without the pressure',
    ],
    summary:
      'From the sidelines to the training ground — the people, numbers and debates shaping the game.',
  },
  Lifestyle: {
    titles: [
      'Ten rainy-day activities for young families',
      'Batch cooking for a busy week',
      'A realistic guide to decluttering',
      'Houseplants that survive neglect',
      'Planning a low-cost family day out',
      'How to build a morning routine that sticks',
      'Budget-friendly ideas for a cosy winter',
      'Simple ways to cut your energy bill',
      'Weekend walks within an hour of the city',
      'Kitchen gadgets that are actually worth it',
    ],
    summary:
      'Tried-and-tested tips, with costs and time estimates, so you can decide what is worth your weekend.',
  },
};

function generateArticles(): Article[] {
  const articles: Article[] = [];
  let n = 0;
  for (const category of CATEGORIES) {
    const appeal = between(0.7, 1.4); // category-level popularity
    for (const title of TOPICS[category].titles) {
      n += 1;
      const ageDays = Math.floor(between(2, HISTORY_DAYS - 1));
      const startIndex = HISTORY_DAYS - 1 - ageDays;
      // Heavy-tailed launch size so a few articles clearly outperform.
      const launch = Math.round(800 * appeal * Math.pow(between(0.15, 1), -1.1));
      const decay = between(0.04, 0.12);
      const evergreen = between(0.02, 0.08);

      const dailyViews = SAMPLE_DATES.map((date, i) => {
        if (i < startIndex) return 0;
        const age = i - startIndex;
        const weekday = new Date(date).getUTCDay();
        const weekendBoost = weekday === 0 || weekday === 6 ? 1.15 : 1;
        const base = launch * (Math.exp(-decay * age) + evergreen);
        return Math.max(0, Math.round(base * weekendBoost * between(0.85, 1.15)));
      });

      articles.push({
        id: `sample-${String(n).padStart(3, '0')}`,
        title,
        summary: TOPICS[category].summary,
        category,
        author: pick(AUTHORS),
        publishedAt: SAMPLE_DATES[startIndex],
        readMinutes: Math.round(between(3, 12)),
        dailyViews,
        likeRate: between(0.015, 0.07),
        commentRate: between(0.002, 0.015),
        shareRate: between(0.004, 0.025),
      });
    }
  }
  return articles;
}

export const SAMPLE_ARTICLES: Article[] = generateArticles();
