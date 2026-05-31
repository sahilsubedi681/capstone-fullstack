import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Eye, Heart, Target, Lock, Phone, Home, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const stats = [
  { value: "1 in 4", label: "Australians aged 55+ live alone" },
  { value: "Proven", label: "Loneliness is linked to depression and cognitive decline" },
  { value: "Millions", label: "Spare bedrooms sit empty in Australian homes every night" },
  { value: "Out of reach", label: "Cost of aged care and retirement living for many Australians" },
];

const missionCards = [
  {
    icon: <Target className="h-8 w-8 text-primary" />,
    title: "Our Mission",
    desc: "To provide a safe, simple, and trusted platform that connects older Australians who have a spare room with those who need one, improving quality of life for everyone involved.",
  },
  {
    icon: <Eye className="h-8 w-8 text-primary" />,
    title: "Our Vision",
    desc: "A future where no Australian over 55 has to face housing stress or loneliness alone, where communities look after each other and shared living is a celebrated choice.",
  },
  {
    icon: <Heart className="h-8 w-8 text-primary" />,
    title: "Our Values",
    desc: "Trust, dignity, simplicity, community, and inclusion. Everything we build is guided by respect for our members and a genuine commitment to their wellbeing.",
  },
];

const teamCards = [
  {
    name: "Garry Ohlson",
    role: "Director and Founder",
    desc: "Garry founded TribeSilverCircle after recognising the growing gap between older Australians who have space and those who need it. With a background in community development and a passion for social impact, Garry leads the platform with purpose and heart.",
    initials: "GO",
  },
  {
    name: "The Charity Partner",
    role: "Community and Operations",
    desc: "TribeSilverCircle is partly managed by an authorised Australian charity with deep community access and a strong track record in social services. This partnership ensures the platform remains grounded in real community needs.",
    initials: "CP",
  },
  {
    name: "The Student Development Team",
    role: "Technology and Design",
    desc: "The platform is being built by a dedicated student team from AIH as part of a professional industry project. The team brings skills in web development, design, research, and project management to bring TribeSilverCircle to life.",
    initials: "SD",
  },
];

const timeline = [
  { year: "2024", title: "Idea and Research", desc: "Garry identifies the problem and begins researching the gap in the Australian housing market for over 55s. Early conversations with community members confirm the need." },
  { year: "Early 2025", title: "Charity Partnership", desc: "TribeSilverCircle forms a partnership with an authorised Australian charity, gaining community access, operational support, and credibility." },
  { year: "Mid 2025", title: "Political Support", desc: "The team presents the platform concept to local state and federal politicians who express strong interest and support for the initiative." },
  { year: "Late 2025", title: "Draft Platform", desc: "A basic draft version of the platform is created at tribe5.com.au to test the concept and gather initial feedback." },
  { year: "2026", title: "Student Development Project", desc: "A student team from AIH begins building the secure registration and login system, designing the user interface, and laying the foundation for the full platform launch." },
  { year: "Future", title: "Full Platform Launch", desc: "The complete TribeSilverCircle platform goes live, connecting thousands of older Australians across the country." },
];

const differentiators = [
  {
    icon: <Shield className="h-8 w-8 text-primary" />,
    title: "Built for Over 55s Only",
    desc: "Unlike general accommodation platforms, TribeSilverCircle is designed exclusively for Australians aged 55 and above. Every feature, every design decision, and every piece of content is tailored to this community.",
  },
  {
    icon: <Heart className="h-8 w-8 text-primary" />,
    title: "Charity Backed and Community Driven",
    desc: "We are not just a tech startup chasing profit. We are backed by a charity and driven by a genuine desire to improve lives. Any revenue generated is reinvested into the platform and the community.",
  },
  {
    icon: <Lock className="h-8 w-8 text-primary" />,
    title: "Safety First Always",
    desc: "From passwordless sign in to verified profiles, safety is built into every part of the platform. Our members trust us with their homes and their lives and we take that responsibility seriously.",
  },
  {
    icon: <Phone className="h-8 w-8 text-primary" />,
    title: "Simple Enough for Everyone",
    desc: "We designed TribeSilverCircle to be used comfortably by people who may not be very tech savvy. Large text, clear buttons, simple navigation, and no complicated passwords.",
  },
];

export default function AboutPage() {
  return (
    <div className="w-full">
      {/* Hero */}
      <section className="relative py-24 lg:py-36 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-primary/60" />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=2069&auto=format&fit=crop')", backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="relative container mx-auto px-4 md:px-8 max-w-screen-xl text-center text-primary-foreground">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">About TribeSilverCircle</h1>
            <p className="text-xl md:text-2xl opacity-90 max-w-3xl mx-auto leading-relaxed">
              We are on a mission to solve one of Australia's quietest crises — loneliness and housing stress among older Australians.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 lg:py-28 bg-background">
        <div className="container mx-auto px-4 md:px-8 max-w-screen-xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
              <p className="text-primary font-semibold uppercase tracking-wider mb-3">Our Story</p>
              <h2 className="text-3xl md:text-5xl font-bold mb-8">Where It All Began</h2>
              <div className="space-y-5 text-lg text-muted-foreground leading-relaxed">
                <p>
                  In Australia today there are thousands of older Australians living alone in homes with empty bedrooms. Their children have grown up and moved out, or perhaps a spouse has passed away. These individuals are often asset rich but cash poor — owning a valuable home but struggling to cover everyday living expenses.
                </p>
                <p>
                  At the same time, thousands of other older Australians are desperately searching for safe and affordable accommodation, facing a housing market that simply does not cater to their needs.
                </p>
                <p>
                  TribeSilverCircle was founded to bridge this gap. We believe that two problems can become one solution. A person with a spare room and a person who needs a room can come together not just to solve a practical problem, but to enrich each other's lives.
                </p>
                <p>
                  What started as a simple idea grew into a platform backed by an authorised Australian charity with deep community roots, strong business expertise, and the support of local and federal government representatives.
                </p>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}>
              <div className="rounded-3xl overflow-hidden shadow-2xl aspect-4/3">
                <img
                  src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=2069&auto=format&fit=crop"
                  alt="Older Australians sitting together and smiling"
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission, Vision, Values */}
      <section className="py-20 lg:py-28 bg-primary/5">
        <div className="container mx-auto px-4 md:px-8 max-w-screen-xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-5">What Drives Us</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {missionCards.map((card, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.1 }}>
                <Card className="rounded-2xl border-border/50 shadow-sm h-full">
                  <CardContent className="p-8 text-center flex flex-col items-center">
                    <div className="bg-primary/10 p-4 rounded-2xl mb-5">{card.icon}</div>
                    <h3 className="text-2xl font-bold mb-3">{card.title}</h3>
                    <p className="text-lg text-muted-foreground leading-relaxed">{card.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats — The Problem */}
      <section className="py-20 lg:py-28 bg-background">
        <div className="container mx-auto px-4 md:px-8 max-w-screen-xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-5">A Problem Too Big to Ignore</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-14">
            {stats.map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.08 }}>
                <Card className="rounded-2xl border-border/50 shadow-sm text-center">
                  <CardContent className="p-8">
                    <p className="text-3xl md:text-4xl font-bold text-primary mb-3">{stat.value}</p>
                    <p className="text-lg text-muted-foreground">{stat.label}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xl text-muted-foreground leading-relaxed">
              These are not just statistics. These are real people with real stories. TribeSilverCircle exists because we believe technology can be a force for good — connecting people who need each other and making a genuine difference in their daily lives.
            </p>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 lg:py-28 bg-primary/5">
        <div className="container mx-auto px-4 md:px-8 max-w-screen-xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-5">The People Behind TribeSilverCircle</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {teamCards.map((member, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.1 }}>
                <Card className="rounded-2xl border-border/50 shadow-sm h-full">
                  <CardContent className="p-8 flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary mb-6">
                      {member.initials}
                    </div>
                    <h3 className="text-xl font-bold mb-1">{member.name}</h3>
                    <p className="text-primary font-medium mb-4">{member.role}</p>
                    <p className="text-muted-foreground leading-relaxed">{member.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 lg:py-28 bg-background">
        <div className="container mx-auto px-4 md:px-8 max-w-screen-xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-5">Our Journey</h2>
          </div>
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <div className="absolute left-[68px] top-0 bottom-0 w-0.5 bg-border hidden sm:block" />
              <div className="space-y-8">
                {timeline.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.07 }}
                    className="flex gap-6"
                  >
                    <div className="shrink-0 flex flex-col items-center sm:w-32">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center text-sm font-bold z-10 ${item.year === "Future" ? "bg-secondary/20 text-secondary-foreground border-2 border-dashed border-secondary" : "bg-primary text-primary-foreground shadow-lg shadow-primary/20"}`}>
                        {item.year === "Future" ? "Soon" : item.year.includes(" ") ? <span className="text-xs text-center leading-tight">{item.year}</span> : item.year}
                      </div>
                    </div>
                    <Card className="flex-1 rounded-2xl border-border/50 shadow-sm">
                      <CardContent className="p-6">
                        <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                        <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What Makes Us Different */}
      <section className="py-20 lg:py-28 bg-primary/5">
        <div className="container mx-auto px-4 md:px-8 max-w-screen-xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-5">What Makes Us Different</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {differentiators.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.08 }}>
                <Card className="rounded-2xl border-border/50 shadow-sm h-full">
                  <CardContent className="p-8 flex gap-5">
                    <div className="bg-primary/10 p-3 rounded-xl h-fit shrink-0">{item.icon}</div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                      <p className="text-lg text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Government Support */}
      <section className="py-16 bg-background border-y border-border/40">
        <div className="container mx-auto px-4 md:px-8 max-w-screen-xl">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-5 py-2 rounded-full font-semibold mb-8">
              <CheckCircle2 className="h-5 w-5" />
              Recognised and Supported
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Government and Community Support</h2>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              TribeSilverCircle has been presented to local state politicians and federal politicians in Australia who have expressed strong interest in supporting the initiative. We believe that solving the housing and loneliness crisis among older Australians requires collaboration between technology, community organisations, and government — and we are proud to have that support behind us.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 md:px-8 max-w-screen-xl text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-5">Join Our Growing Community</h2>
          <p className="text-xl opacity-90 mb-10 max-w-2xl mx-auto">
            Whether you have a spare room or need one, TribeSilverCircle is here for you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Link href="/signup">
              <Button size="lg" className="text-lg rounded-full px-10 py-5 h-auto bg-white text-primary hover:bg-white/90">
                I Have a Spare Room
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="lg" variant="outline" className="text-lg rounded-full px-10 py-5 h-auto border-white/50 text-white hover:bg-white/10">
                I Need a Room
              </Button>
            </Link>
          </div>
          <Link href="/how-it-works" className="text-white/80 hover:text-white underline text-lg">
            Learn how it works
          </Link>
        </div>
      </section>

    </div>
  );
}
