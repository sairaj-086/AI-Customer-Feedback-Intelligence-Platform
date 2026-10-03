/**
 * Seeds one demo tenant with an Admin/Manager/Viewer user each and ~40
 * pieces of feedback spread across channels, sentiments and themes over
 * the last 30 days. Run with `npm run seed` after `prisma migrate deploy`.
 *
 * This is what you'll log into for the demo video — it gives the
 * dashboard, feedback list, and Q&A something real to show instead of an
 * empty state. Reports still need to be generated live (via the UI) since
 * that calls Claude.
 */
import { PrismaClient, Channel, Sentiment } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "Demo1234!";

const feedbackSeed: { channel: Channel; sentiment: Sentiment; theme: string; text: string; days: number }[] = [
  { channel: "APP_REVIEW", sentiment: "NEGATIVE", theme: "Slow performance", text: "The app takes forever to load my dashboard every morning, sometimes over 10 seconds.", days: 1 },
  { channel: "APP_REVIEW", sentiment: "NEGATIVE", theme: "Slow performance", text: "Loading spinners everywhere. It used to be snappy a few months ago.", days: 3 },
  { channel: "SUPPORT_TICKET", sentiment: "NEGATIVE", theme: "Slow performance", text: "Reports page hangs and I have to refresh twice to get it to render.", days: 5 },
  { channel: "EMAIL", sentiment: "NEGATIVE", theme: "Billing confusion", text: "I was charged twice this month and support hasn't replied in 3 days.", days: 2 },
  { channel: "SUPPORT_TICKET", sentiment: "NEGATIVE", theme: "Billing confusion", text: "The invoice doesn't match what's on the pricing page, very confusing.", days: 6 },
  { channel: "SURVEY", sentiment: "NEGATIVE", theme: "Billing confusion", text: "Cancelling a plan mid-cycle should be prorated but it wasn't for us.", days: 9 },
  { channel: "SOCIAL", sentiment: "NEGATIVE", theme: "Onboarding friction", text: "Took me 45 minutes to figure out how to invite my team, docs were outdated.", days: 4 },
  { channel: "SURVEY", sentiment: "NEGATIVE", theme: "Onboarding friction", text: "First-time setup wizard crashed on step 3 and I had to start over.", days: 8 },
  { channel: "APP_REVIEW", sentiment: "NEUTRAL", theme: "Onboarding friction", text: "Setup was okay but I expected a guided tour, there wasn't one.", days: 12 },
  { channel: "EMAIL", sentiment: "POSITIVE", theme: "Customer support", text: "Your support agent Priya resolved my issue in under 10 minutes, fantastic service.", days: 1 },
  { channel: "SURVEY", sentiment: "POSITIVE", theme: "Customer support", text: "Whenever I reach out the team actually listens and follows up. Rare these days.", days: 7 },
  { channel: "SOCIAL", sentiment: "POSITIVE", theme: "Customer support", text: "Shoutout to the support team for staying on a call with me until it was fixed.", days: 10 },
  { channel: "APP_REVIEW", sentiment: "POSITIVE", theme: "Analytics dashboard", text: "The new dashboard is exactly what our leadership team needed. Clean and fast.", days: 2 },
  { channel: "SURVEY", sentiment: "POSITIVE", theme: "Analytics dashboard", text: "Love being able to filter feedback by theme, saves us hours every week.", days: 6 },
  { channel: "EMAIL", sentiment: "POSITIVE", theme: "Analytics dashboard", text: "The sentiment trend chart alone justified the subscription for our team.", days: 14 },
  { channel: "APP_REVIEW", sentiment: "NEUTRAL", theme: "Feature requests", text: "Would be nice to export reports as PDF directly instead of copy-pasting.", days: 5 },
  { channel: "SURVEY", sentiment: "NEUTRAL", theme: "Feature requests", text: "Please add Slack notifications when negative feedback spikes.", days: 11 },
  { channel: "SUPPORT_TICKET", sentiment: "NEUTRAL", theme: "Feature requests", text: "Any plans for a mobile app? We mostly use this on the go.", days: 15 },
  { channel: "SOCIAL", sentiment: "NEUTRAL", theme: "Feature requests", text: "Curious if there's a public API roadmap somewhere.", days: 18 },
  { channel: "APP_REVIEW", sentiment: "POSITIVE", theme: "Ease of use", text: "Genuinely one of the more intuitive B2B tools I've used this year.", days: 3 },
  { channel: "SURVEY", sentiment: "POSITIVE", theme: "Ease of use", text: "My whole team picked it up without any training, which says a lot.", days: 9 },
  { channel: "EMAIL", sentiment: "NEGATIVE", theme: "Ease of use", text: "The filters on the feedback page are not intuitive, I keep clicking the wrong thing.", days: 13 },
  { channel: "SUPPORT_TICKET", sentiment: "NEGATIVE", theme: "Slow performance", text: "Classification of new feedback sometimes takes minutes, seems inconsistent.", days: 16 },
  { channel: "APP_REVIEW", sentiment: "NEGATIVE", theme: "Slow performance", text: "App froze completely while generating a report last week.", days: 20 },
  { channel: "SOCIAL", sentiment: "POSITIVE", theme: "Customer support", text: "Renewed for another year mostly because of how responsive the team is.", days: 22 },
  { channel: "SURVEY", sentiment: "NEUTRAL", theme: "Billing confusion", text: "Pricing tiers could be clearer on the website before we talk to sales.", days: 19 },
  { channel: "EMAIL", sentiment: "POSITIVE", theme: "Analytics dashboard", text: "Finally a feedback tool that doesn't require a data analyst to interpret.", days: 25 },
  { channel: "APP_REVIEW", sentiment: "NEGATIVE", theme: "Onboarding friction", text: "Trial signup asked for a credit card upfront, almost bounced because of that.", days: 24 },
  { channel: "SUPPORT_TICKET", sentiment: "POSITIVE", theme: "Customer support", text: "Escalated a bug and it was fixed within the same business day. Impressive.", days: 17 },
  { channel: "SURVEY", sentiment: "NEGATIVE", theme: "Feature requests", text: "No dark mode yet? Small thing but my team asks constantly.", days: 21 },
  { channel: "SOCIAL", sentiment: "NEUTRAL", theme: "Ease of use", text: "Decent tool, learning curve is there but not steep.", days: 23 },
  { channel: "EMAIL", sentiment: "NEGATIVE", theme: "Billing confusion", text: "Downgrade option is buried three menus deep, feels intentional.", days: 27 },
  { channel: "APP_REVIEW", sentiment: "POSITIVE", theme: "Analytics dashboard", text: "The theme detection is scary accurate, it caught patterns we'd missed manually.", days: 26 },
  { channel: "SUPPORT_TICKET", sentiment: "NEUTRAL", theme: "Onboarding friction", text: "Migration from our old spreadsheet took longer than expected but got there.", days: 28 },
  { channel: "SURVEY", sentiment: "POSITIVE", theme: "Ease of use", text: "Simple, does what it says, no bloat. Appreciate that.", days: 0 },
  { channel: "SOCIAL", sentiment: "NEGATIVE", theme: "Feature requests", text: "Wish there was a way to bulk-tag old feedback instead of one by one.", days: 0 },
  { channel: "EMAIL", sentiment: "POSITIVE", theme: "Customer support", text: "Onboarding call was thorough and the rep actually knew the product well.", days: 0 },
  { channel: "APP_REVIEW", sentiment: "NEUTRAL", theme: "Slow performance", text: "Mostly fast, occasional lag when the feedback list gets long.", days: 29 },
  { channel: "SUPPORT_TICKET", sentiment: "POSITIVE", theme: "Analytics dashboard", text: "VoC report saved our PM three hours of manual summarizing this sprint.", days: 30 },
];

async function main() {
  const existing = await prisma.tenant.findFirst({ where: { name: "Acme Demo Co" } });
  if (existing) {
    console.log(`Demo tenant already exists (id: ${existing.id}), skipping seed.`);
    return;
  }

  const hashed = await bcrypt.hash(DEMO_PASSWORD, 12);

  const tenant = await prisma.tenant.create({
    data: {
      name: "Acme Demo Co",
      users: {
        create: [
          { name: "Aria Admin", email: "admin@acmedemo.io", password: hashed, role: "ADMIN" },
          { name: "Manny Manager", email: "manager@acmedemo.io", password: hashed, role: "MANAGER" },
          { name: "Val Viewer", email: "viewer@acmedemo.io", password: hashed, role: "VIEWER" },
        ],
      },
    },
  });

  const themeCache = new Map<string, string>();
  async function themeId(name: string) {
    if (themeCache.has(name)) return themeCache.get(name)!;
    const theme = await prisma.theme.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name } },
      create: { tenantId: tenant.id, name },
      update: {},
    });
    themeCache.set(name, theme.id);
    return theme.id;
  }

  for (const f of feedbackSeed) {
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - f.days);
    await prisma.feedback.create({
      data: {
        tenantId: tenant.id,
        channel: f.channel,
        rawText: f.text,
        sentiment: f.sentiment,
        summary: f.text.slice(0, 100),
        themeId: await themeId(f.theme),
        classifiedAt: createdAt,
        createdAt,
      },
    });
  }

  console.log(`Seeded tenant "${tenant.name}" (${tenant.id}) with ${feedbackSeed.length} feedback rows.`);
  console.log(`Login as admin@acmedemo.io / manager@acmedemo.io / viewer@acmedemo.io, password: ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
