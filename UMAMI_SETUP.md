# Umami Dashboard Configuration Guide

Use this as a prompt or reference when configuring dashboards, funnels, retention, journeys, and goals in Umami.

## All Tracked Events

| Event | Properties | Source |
|-------|-----------|--------|
| `(pageview)` | auto (url, referrer, title) | Router afterEach |
| `boot_completed` | -- | Portfolio boot sequence |
| `section_viewed` | `{section}` (about, experience, passions) | Portfolio IntersectionObserver |
| `section_navigated` | `{section}` | Portfolio nav click |
| `timeline_clicked` | `{company}` | Portfolio career timeline |
| `outbound_link_clicked` | `{destination}` | LinkedIn, timeline links |
| `game_opened` | `{game}` | Portfolio passion click |
| `game_closed` | `{game, duration_seconds}` | Game close/overlay dismiss |
| `webamp_opened` | -- | Music player toggle |
| `theme_changed` | `{theme}` | Theme picker |
| `jadbot_message` | `{depth}` (message count) | Terminal chat send |
| `jadbot_widget_clicked` | `{widget}` | Chat widget button |
| `jadbot_theme_clicked` | `{theme}` | Chat theme button |
| `jadbot_chat_cleared` | -- | Chat clear button |
| `blog_post_viewed` | `{slug, title}` | Blog post loaded |
| `blog_scroll_depth` | `{slug, depth}` (25/50/75/100) | Blog IntersectionObserver |
| `blog_nav_clicked` | `{type, target}` (related/adjacent/series) | Blog post navigation |
| `blog_filter_clicked` | `{year, month?}` | Blog index timeline |

---

## Dashboards

### Main Dashboard
Create the default dashboard with these report widgets:

**Top Row (KPIs):**
- Total pageviews (last 7 days vs prior 7)
- Unique visitors (last 7 days vs prior 7)
- Blog post views: count of `blog_post_viewed` events
- Jadbot conversations: count of `jadbot_message` where depth=1 (first messages only)

**Charts:**
- Pageviews over time (line chart, daily, 30 days)
- Top pages (bar chart, top 10 by views)
- Referrers (bar chart, top 10)
- Countries (map or bar)

**Event Breakdown:**
- Event counts grouped by name (bar chart)
- `blog_post_viewed` by slug (table, top 10)
- `game_opened` by game (pie chart)
- `theme_changed` by theme (pie chart)

### Blog Dashboard
- `blog_post_viewed` by slug over time (line, 30 days)
- `blog_scroll_depth` distribution: group by depth (25/50/75/100), show as funnel or bar
- `blog_nav_clicked` by type (related vs adjacent vs series)
- `blog_filter_clicked` by year
- Average scroll depth per post: filter `blog_scroll_depth` by slug

### Engagement Dashboard
- `section_viewed` by section (shows how far down the portfolio people scroll)
- `game_opened` vs `game_closed` (how many people open games vs finish them)
- Average `game_closed.duration_seconds` by game
- `jadbot_message` depth distribution (histogram: 1 msg, 2-3 msgs, 4+ msgs)
- `outbound_link_clicked` by destination

---

## Funnels

### Recruiter Funnel
Measures the path a recruiter/hiring manager takes:
1. Pageview on `/` (lands on portfolio)
2. `section_viewed` where section = "experience"
3. `timeline_clicked` (any company)
4. `outbound_link_clicked` where destination contains "linkedin"

### Blog Reader Funnel
Measures blog engagement depth:
1. Pageview on `/blog` (lands on blog index)
2. `blog_post_viewed` (clicks into a post)
3. `blog_scroll_depth` where depth = 50 (reads half)
4. `blog_scroll_depth` where depth = 100 (reads to end)
5. `blog_nav_clicked` (clicks to another post)

### Explorer Funnel
Measures interactive engagement:
1. Pageview on `/` (lands on portfolio)
2. `section_viewed` where section = "passions"
3. `game_opened` (any game)
4. `game_closed` (completes the game interaction)

### Jadbot Engagement Funnel
1. `jadbot_message` where depth = 1 (sends first message)
2. `jadbot_message` where depth = 2 (sends second message)
3. `jadbot_message` where depth = 3 (three or more)
4. `jadbot_widget_clicked` (clicks a suggested widget)

---

## Retention

### Weekly Return Visitors
Track how many visitors return within 7 days. Segment by:
- **Blog readers**: visitors who triggered `blog_post_viewed`
- **Jadbot users**: visitors who triggered `jadbot_message`
- **Game players**: visitors who triggered `game_opened`

### Blog Subscriber Behavior
Track return visits to `/blog` -- are people coming back for new posts? Group by week, filter pageviews to `/blog` and `/blog/*` paths.

---

## Goals

### Primary Goals

| Goal | Event | Condition | Target |
|------|-------|-----------|--------|
| LinkedIn conversion | `outbound_link_clicked` | destination contains "linkedin" | 5% of sessions |
| Blog read-through | `blog_scroll_depth` | depth = 100 | 30% of blog post views |
| Multi-post reader | `blog_nav_clicked` | any | 15% of blog sessions |
| Jadbot engaged | `jadbot_message` | depth >= 3 | 20% of jadbot sessions |
| Game played | `game_opened` | any | 10% of portfolio sessions |

### Secondary Goals

| Goal | Event | Condition | Target |
|------|-------|-----------|--------|
| Full portfolio scroll | `section_viewed` | section = "passions" | 40% of portfolio sessions |
| Theme customizer | `theme_changed` | any | 5% of sessions |
| Boot sequence survived | `boot_completed` | any | 90% of first visits |
| Blog discovery from portfolio | Pageview | url = "/blog" after "/" | 10% of portfolio sessions |

---

## Journeys (User Flow Analysis)

### Journey 1: Recruiter
```
/ -> section_viewed(experience) -> timeline_clicked -> outbound_link_clicked(linkedin)
```
Key question: What % of visitors who view the experience section click LinkedIn?

### Journey 2: Blog Reader
```
/blog -> blog_post_viewed -> blog_scroll_depth(50) -> blog_scroll_depth(100) -> blog_nav_clicked
```
Key question: What % of blog readers read a second post?

### Journey 3: Explorer
```
/ -> section_viewed(passions) -> game_opened -> game_closed -> theme_changed
```
Key question: Do game players explore more features (themes, Jadbot)?

### Journey 4: Jadbot Conversationalist
```
/ -> jadbot_message(depth=1) -> jadbot_message(depth=2) -> jadbot_widget_clicked
```
Key question: At what depth do people stop messaging? Do widget suggestions convert?

---

## Segments to Create

- **Blog readers**: sessions with `blog_post_viewed` event
- **Game players**: sessions with `game_opened` event
- **Jadbot users**: sessions with `jadbot_message` event
- **Recruiter-like**: sessions with `timeline_clicked` AND `outbound_link_clicked`
- **Power users**: sessions with 3+ distinct event types
- **Bouncers**: sessions with only 1 pageview and no events

---

## Alerts (if supported)

- Daily blog views drop below 50% of 7-day average
- Zero `outbound_link_clicked` events in 24 hours (LinkedIn link may be broken)
- `boot_completed` rate drops below 80% (boot sequence may be causing bounces)
