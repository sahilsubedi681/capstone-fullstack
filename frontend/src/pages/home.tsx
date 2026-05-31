import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Home, Heart, Shield, User, MapPin, Star, DollarSign,
  ArrowRight, Wifi, Car, PawPrint, Users
} from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

/* ─── Animations ─────────────────────────────────────────── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.55, delay },
});

const fadeIn = (delay = 0) => ({
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true },
  transition: { duration: 0.5, delay },
});

/* ─── Static room data ───────────────────────────────────── */
const rooms = [
  {
    id: 1,
    img: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=800&auto=format&fit=crop",
    title: "Sunny Double Room",
    suburb: "Brighton", state: "VIC",
    rent: 280,
    bathroom: "Private",
    hostName: "Margaret W.",
    hostAge: 68,
    hostImg: "https://i.pravatar.cc/150?u=margaret2",
    bills: true, wifi: true, parking: false, pets: false,
    badge: "Popular",
  },
  {
    id: 2,
    img: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=800&auto=format&fit=crop",
    title: "Quiet Single Room",
    suburb: "Manly", state: "NSW",
    rent: 220,
    bathroom: "Shared",
    hostName: "David H.",
    hostAge: 71,
    hostImg: "https://i.pravatar.cc/150?u=david3",
    bills: false, wifi: true, parking: true, pets: false,
    badge: "New",
  },
  {
    id: 3,
    img: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=800&auto=format&fit=crop",
    title: "Large Double Room",
    suburb: "New Farm", state: "QLD",
    rent: 300,
    bathroom: "Private",
    hostName: "Barbara L.",
    hostAge: 65,
    hostImg: "https://i.pravatar.cc/150?u=barbara4",
    bills: true, wifi: true, parking: true, pets: true,
    badge: "Pet Friendly",
  },
  {
    id: 4,
    img: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=800&auto=format&fit=crop",
    title: "Cosy Furnished Room",
    suburb: "Glenelg", state: "SA",
    rent: 195,
    bathroom: "Shared",
    hostName: "Ronald B.",
    hostAge: 74,
    hostImg: "https://i.pravatar.cc/150?u=ronald5",
    bills: true, wifi: true, parking: false, pets: false,
    badge: "Best Value",
  },
  {
    id: 5,
    img: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?q=80&w=800&auto=format&fit=crop",
    title: "Garden-View Room",
    suburb: "Cottesloe", state: "WA",
    rent: 260,
    bathroom: "Shared",
    hostName: "Helen M.",
    hostAge: 66,
    hostImg: "https://i.pravatar.cc/150?u=helen6",
    bills: false, wifi: true, parking: true, pets: true,
    badge: null,
  },
  {
    id: 6,
    img: "https://images.unsplash.com/photo-1484101403633-562f891dc89a?q=80&w=800&auto=format&fit=crop",
    title: "Spacious Queen Room",
    suburb: "Sandy Bay", state: "TAS",
    rent: 240,
    bathroom: "Private",
    hostName: "John P.",
    hostAge: 70,
    hostImg: "https://i.pravatar.cc/150?u=john7",
    bills: true, wifi: false, parking: true, pets: false,
    badge: null,
  },
];

/* ─── Testimonials ───────────────────────────────────────── */
const testimonials = [
  {
    quote: "After my husband passed, the house felt too big and too quiet. Finding Jane through TribeSilverCircle changed everything. Sharing a pot of tea in the afternoon is now the highlight of my day.",
    name: "Margaret",
    age: 68,
    role: "Host · Melbourne, VIC",
    img: "https://i.pravatar.cc/150?u=margaret",
    color: "from-primary/10 to-primary/5",
  },
  {
    quote: "I needed to downsize but didn't want to live alone in a tiny apartment. I rent a room from David — we both love gardening and split the bills. Best decision I ever made.",
    name: "Robert",
    age: 72,
    role: "Seeker · Sydney, NSW",
    img: "https://i.pravatar.cc/150?u=robert",
    color: "from-secondary/20 to-secondary/5",
  },
  {
    quote: "I was nervous about sharing my home after living alone for six years. The process was simple and I felt safe every step of the way. My housemate Anne is wonderful company.",
    name: "Patricia",
    age: 64,
    role: "Host · Brisbane, QLD",
    img: "https://i.pravatar.cc/150?u=patricia8",
    color: "from-primary/10 to-primary/5",
  },
];

/* ─── Component ──────────────────────────────────────────── */
export default function HomePage() {
  return (
    <div className="w-full overflow-x-hidden">
      {/* ── Hero ── */}
      <section className="bg-primary/5 py-20 lg:py-32">
        <div className="container mx-auto px-4 md:px-8 max-w-screen-xl">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <motion.div
              className="flex-1 text-center lg:text-left"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65 }}
            >
              <motion.div
                className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <Heart className="h-4 w-4 mr-2" />
                For Australians 55 and over
              </motion.div>
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight text-foreground mb-6 leading-tight">
                Find Your Perfect{" "}
                <span className="text-primary block mt-2">Home Companion</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto lg:mx-0">
                A warm, trusted community space where older Australians can find housemates, share costs, and combat loneliness.
              </p>
              <motion.div
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Link href="/signup">
                  <Button size="lg" className="text-lg rounded-full px-8 py-6 w-full sm:w-auto h-auto shadow-lg shadow-primary/25">
                    Get Started as Host
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="lg" variant="outline" className="text-lg rounded-full px-8 py-6 w-full sm:w-auto h-auto bg-white hover:bg-muted">
                    Find a Room
                  </Button>
                </Link>
              </motion.div>

              {/* Quick stats */}
              <motion.div
                className="flex gap-8 mt-12 justify-center lg:justify-start"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                {[["100% Free", "to join"], ["55+", "community"], ["Verified", "members"]].map(([val, label]) => (
                  <div key={val} className="text-center">
                    <p className="text-2xl font-bold text-primary">{val}</p>
                    <p className="text-sm text-muted-foreground">{label}</p>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              className="flex-1 w-full max-w-lg lg:max-w-none relative"
              initial={{ opacity: 0, scale: 0.93 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <div className="aspect-4/3 rounded-3xl overflow-hidden shadow-2xl relative">
                <div className="absolute inset-0 bg-primary/15 z-10 mix-blend-overlay" />
                <img
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=2000&auto=format&fit=crop"
                  alt="Older Australians sharing a warm moment"
                  className="w-full h-full object-cover"
                />
              </div>
              <motion.div
                className="absolute -bottom-6 -left-6 bg-background rounded-2xl p-4 shadow-xl border border-border flex items-center gap-4 z-20"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <div className="bg-primary/10 p-3 rounded-full">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-foreground">Verified Members</p>
                  <p className="text-muted-foreground text-sm">Safe & Trusted</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-20 lg:py-28 bg-background">
        <div className="container mx-auto px-4 md:px-8 max-w-screen-xl">
          <motion.div className="text-center max-w-3xl mx-auto mb-16" {...fadeUp()}>
            <p className="text-primary font-semibold uppercase tracking-wider mb-3">Simple Process</p>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-5">How It Works</h2>
            <p className="text-xl text-muted-foreground">Three easy steps to finding your perfect living arrangement.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-10 relative">
            <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-primary/30 via-primary to-primary/30" />
            {[
              { n: "1", title: "Create a Profile", desc: "Tell us about yourself, your lifestyle, and what you're looking for in a home or housemate." },
              { n: "2", title: "Browse & Connect", desc: "Search for compatible people in your area and send a safe, secure message through the platform." },
              { n: "3", title: "Meet & Match", desc: "Chat online, meet for a coffee, and if it feels right, start your new living arrangement." },
            ].map((step, i) => (
              <motion.div key={step.n} className="text-center relative" {...fadeUp(i * 0.12)}>
                <div className="w-24 h-24 mx-auto bg-primary text-primary-foreground rounded-full flex items-center justify-center text-3xl font-bold mb-6 shadow-lg shadow-primary/25">
                  {step.n}
                </div>
                <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                <p className="text-lg text-muted-foreground leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div className="text-center mt-12" {...fadeUp(0.4)}>
            <Link href="/how-it-works">
              <Button variant="outline" size="lg" className="text-lg rounded-full px-8">
                See Full Guide <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Who Is It For ── */}
      <section className="py-20 lg:py-28 bg-primary/5">
        <div className="container mx-auto px-4 md:px-8 max-w-screen-xl">
          <motion.div className="text-center max-w-3xl mx-auto mb-16" {...fadeUp()}>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-5">Who Is It For?</h2>
            <p className="text-xl text-muted-foreground">Whether you have a spare room or you're looking for one, there's a place for you.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                icon: <Home className="h-10 w-10 text-primary" />,
                bg: "bg-primary/10",
                title: "For Hosts",
                desc: "You have a spare room and would love some extra income, a bit of company, or someone to help keep an eye on things.",
                points: ["Supplement your income", "Enjoy shared meals and chats", "Retain your independence"],
                delay: 0,
              },
              {
                icon: <User className="h-10 w-10 text-primary" />,
                bg: "bg-primary/10",
                title: "For Seekers",
                desc: "You're looking for affordable, comfortable accommodation with someone in a similar stage of life who understands your values.",
                points: ["Find affordable rent", "Live in a peaceful environment", "Connect with peers your age"],
                delay: 0.1,
              },
            ].map((card) => (
              <motion.div key={card.title} {...fadeUp(card.delay)}>
                <Card className="border-border/50 shadow-md transition-all overflow-hidden rounded-3xl hover:shadow-xl h-full">
                  <CardContent className="p-8 md:p-12">
                    <div className={`${card.bg} w-20 h-20 rounded-2xl flex items-center justify-center mb-8`}>
                      {card.icon}
                    </div>
                    <h3 className="text-3xl font-bold mb-4">{card.title}</h3>
                    <p className="text-lg text-muted-foreground mb-8">{card.desc}</p>
                    <ul className="space-y-4 mb-8">
                      {card.points.map((pt) => (
                        <li key={pt} className="flex items-center gap-3 text-lg">
                          <CheckIcon /> {pt}
                        </li>
                      ))}
                    </ul>
                    <Link href="/signup">
                      <Button className="rounded-full px-6">Get Started <ArrowRight className="ml-2 h-4 w-4" /></Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Browse Rooms ── */}
      <section className="py-20 lg:py-28 bg-background">
        <div className="container mx-auto px-4 md:px-8 max-w-screen-xl">
          <motion.div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14" {...fadeUp()}>
            <div>
              <p className="text-primary font-semibold uppercase tracking-wider mb-3">Available Now</p>
              <h2 className="text-3xl md:text-5xl font-bold text-foreground">Browse a Room</h2>
              <p className="text-xl text-muted-foreground mt-3">Real rooms from verified hosts across Australia.</p>
            </div>
            <Link href="/signup">
              <Button variant="outline" size="lg" className="rounded-full px-6 shrink-0">
                See All Rooms <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room, i) => (
              <motion.div key={room.id} {...fadeUp(i * 0.07)}>
                <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden flex flex-col h-full group hover:shadow-lg transition-shadow duration-300">
                  {/* Image */}
                  <div className="relative h-52 overflow-hidden">
                    <img
                      src={room.img}
                      alt={room.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    {room.badge && (
                      <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground border-none text-sm px-3 py-1">
                        {room.badge}
                      </Badge>
                    )}
                    <div className="absolute bottom-3 right-3 bg-background/95 backdrop-blur rounded-full px-4 py-1.5 font-bold text-foreground shadow-sm flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-primary" />
                      {room.rent}<span className="text-muted-foreground font-normal text-sm">/wk</span>
                    </div>
                  </div>

                  <CardContent className="p-5 flex-1 flex flex-col">
                    <h3 className="text-xl font-bold mb-1">{room.title}</h3>
                    <p className="text-muted-foreground flex items-center gap-1.5 text-sm mb-3">
                      <MapPin className="h-4 w-4 shrink-0" /> {room.suburb}, {room.state}
                    </p>

                    {/* Amenity chips */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="inline-flex items-center gap-1 bg-muted/60 rounded-full px-3 py-1 text-sm font-medium">
                        🛁 {room.bathroom}
                      </span>
                      {room.bills && <span className="inline-flex items-center gap-1 bg-muted/60 rounded-full px-3 py-1 text-sm font-medium">💡 Bills incl.</span>}
                      {room.wifi && <span className="inline-flex items-center gap-1 bg-muted/60 rounded-full px-3 py-1 text-sm font-medium"><Wifi className="h-3.5 w-3.5" /> WiFi</span>}
                      {room.parking && <span className="inline-flex items-center gap-1 bg-muted/60 rounded-full px-3 py-1 text-sm font-medium"><Car className="h-3.5 w-3.5" /> Parking</span>}
                      {room.pets && <span className="inline-flex items-center gap-1 bg-muted/60 rounded-full px-3 py-1 text-sm font-medium"><PawPrint className="h-3.5 w-3.5" /> Pets OK</span>}
                    </div>

                    {/* Host */}
                    <div className="flex items-center gap-3 mt-auto pt-4 border-t border-border/50">
                      <img src={room.hostImg} alt={room.hostName} className="w-10 h-10 rounded-full object-cover" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{room.hostName}</p>
                        <p className="text-xs text-muted-foreground">Host · Age {room.hostAge}</p>
                      </div>
                      <Link href="/signup">
                        <Button size="sm" className="rounded-full text-sm px-4">View</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div className="text-center mt-12" {...fadeUp(0.3)}>
            <Link href="/signup">
              <Button size="lg" className="text-lg rounded-full px-10 shadow-lg shadow-primary/20">
                Create Free Account to See All Rooms
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

 {/* ── Real Stories ── */}
<section className="py-20 lg:py-28 bg-gray-900 overflow-hidden">
  <div className="container mx-auto px-4 md:px-8 max-w-screen-xl">
    <motion.div className="text-center max-w-3xl mx-auto mb-16" {...fadeUp()}>
      <p className="text-primary font-semibold uppercase tracking-wider mb-3">Community Voices</p>
      <h2 className="text-3xl md:text-5xl font-bold mb-5 text-white">Real Stories</h2>
      <p className="text-xl text-gray-400">Hear from members who found their match.</p>
    </motion.div>

    <div className="grid md:grid-cols-3 gap-6">
      {testimonials.map((t, i) => (
        <motion.div
          key={t.name}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: i * 0.12 }}
          className="relative"
        >
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 h-full flex flex-col hover:bg-white/10 transition-colors duration-300">
            <div className="flex gap-1 mb-5">
              {Array(5).fill(0).map((_, s) => (
                <Star key={s} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <div className="text-5xl text-primary font-serif leading-none mb-2">"</div>
            <p className="text-lg text-gray-300 leading-relaxed flex-1 mb-8">
              {t.quote}
            </p>
            <div className="flex items-center gap-4 pt-5 border-t border-white/10">
              <img src={t.img} alt={t.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/40" />
              <div>
                <p className="font-bold text-lg text-white">{t.name}, {t.age}</p>
                <p className="text-gray-400 text-sm">{t.role}</p>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
</section>

{/* ── Trust Strip ── */}
<section className="py-16 bg-primary/5 border-y border-border/40">
  <div className="container mx-auto px-4 md:px-8 max-w-screen-xl">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
      {[
        { icon: <Shield className="h-8 w-8 text-primary mx-auto mb-3" />, label: "Verified 55+ Members" },
        { icon: <Users className="h-8 w-8 text-primary mx-auto mb-3" />, label: "Charity Backed Platform" },
        { icon: <Heart className="h-8 w-8 text-primary mx-auto mb-3" />, label: "100% Free to Join" },
        { icon: <Home className="h-8 w-8 text-primary mx-auto mb-3" />, label: "Australia-Wide Listings" },
      ].map((item, i) => (
        <motion.div key={i} {...fadeIn(i * 0.1)}>
          {item.icon}
          <p className="font-semibold text-lg text-gray-800">{item.label}</p>
        </motion.div>
      ))}
    </div>
  </div>
</section>

      {/* ── CTA ── */}
      <section className="py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 md:px-8 max-w-screen-xl text-center">
          <motion.div {...fadeUp()}>
            <h2 className="text-3xl md:text-5xl font-bold mb-5">Ready to Find Your Match?</h2>
            <p className="text-xl opacity-90 mb-10 max-w-2xl mx-auto">
              Join TribeSilverCircle today for free, it takes less than two minutes to get started.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
          </motion.div>
        </div>
      </section>

    
    </div>
  );
}

function CheckIcon() {
  return (
    <div className="bg-primary/15 text-primary rounded-full p-1 shrink-0">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </div>
  );
}
