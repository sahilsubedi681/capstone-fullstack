import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Home, User, Shield, Lock, Users, Phone } from "lucide-react";
import { motion } from "framer-motion";

const hostSteps = [
  {
    num: 1,
    title: "Create Your Free Account",
    desc: "Create your account in less than two minutes using your Google account or a Magic Link sent to your email. No complicated passwords to remember.",
  },
  {
    num: 2,
    title: "Set Up Your Profile",
    desc: "Tell us a little about yourself, your home, and your spare room. Add details like the rent, room size, location, house rules, and what kind of housemate you are looking for.",
  },
  {
    num: 3,
    title: "Get Discovered",
    desc: "Your listing goes live on the platform and seekers in your area can find and view your profile. You are in full control of who you speak to.",
  },
  {
    num: 4,
    title: "Connect and Choose",
    desc: "Interested seekers will send you a message. You can review their profile, chat through the platform, and decide who feels like the right fit for your home.",
  },
  {
    num: 5,
    title: "Welcome Your New Housemate",
    desc: "Once you are both happy, arrange a time to meet in person and welcome your new housemate into your home.",
  },
];

const seekerSteps = [
  {
    num: 1,
    title: "Create Your Free Account",
    desc: "Sign up in minutes using Google or a Magic Link. No password needed. Just enter your email and you are in.",
  },
  {
    num: 2,
    title: "Set Up Your Profile",
    desc: "Tell hosts about yourself, your lifestyle, your budget, and what you are looking for in a home. A complete profile gets more responses.",
  },
  {
    num: 3,
    title: "Browse Available Rooms",
    desc: "Search for rooms in your preferred area. Filter by price, location, pets allowed, and more. View host profiles and room photos before reaching out.",
  },
  {
    num: 4,
    title: "Send a Message",
    desc: "Found somewhere that looks right? Send the host a friendly message introducing yourself. Our messaging system keeps everything safe and simple.",
  },
  {
    num: 5,
    title: "Move Into Your New Home",
    desc: "Once you and the host are happy, arrange a time to meet in person and move into your new home.",
  },
];

const safetyPoints = [
  {
    icon: <Users className="h-8 w-8 text-primary" />,
    title: "Verified Members",
    desc: "Every member of TribeSilverCircle is verified to be aged 55 or above. We check this during the sign up process so you know you are always dealing with someone your age.",
  },
  {
    icon: <Lock className="h-8 w-8 text-primary" />,
    title: "Secure Sign In",
    desc: "We use Google and Magic Link technology to keep your account safe. There are no passwords to forget or lose and your personal information is always protected.",
  },
  {
    icon: <Shield className="h-8 w-8 text-primary" />,
    title: "Community Backed",
    desc: "TribeSilverCircle is managed by an authorised Australian charity with deep community roots. We are not just a tech platform — we genuinely care about the wellbeing of every member.",
  },
  {
    icon: <Phone className="h-8 w-8 text-primary" />,
    title: "You Are Always in Control",
    desc: "You choose who to talk to and who to invite into your home. You can block or report any user at any time and our support team is here to help.",
  },
];

const faqs = [
  {
    q: "Is TribeSilverCircle free to use?",
    a: "Yes, creating an account and browsing listings is completely free. We may introduce optional premium features in the future but the core platform will always be free.",
  },
  {
    q: "Do I need to be over 55 to join?",
    a: "Yes, TribeSilverCircle is designed specifically for Australians aged 55 and above. This ensures a comfortable and relatable community for all our members.",
  },
  {
    q: "How do I sign in without a password?",
    a: "You can sign in using your Google account with one click, or we can send a Magic Link to your email. Just click the link and you are signed in. No password needed.",
  },
  {
    q: "Is my personal information safe?",
    a: "Absolutely. We use Firebase Authentication which is a trusted and secure system. We never store your password because we do not use passwords. Your data is stored securely and never sold to anyone.",
  },
  {
    q: "What if I have a problem with another member?",
    a: "You can report any user through the platform at any time. Our support team will investigate and take action if needed. Your safety and comfort is our top priority.",
  },
  {
    q: "Can I use TribeSilverCircle on my phone?",
    a: "Yes, the website works on any device including phones, tablets, and computers. You do not need to download any app.",
  },
];

function StepList({ steps, color }: { steps: typeof hostSteps; color: "primary" | "secondary" }) {
  const bg = color === "primary" ? "bg-primary text-primary-foreground shadow-primary/20" : "bg-secondary text-secondary-foreground shadow-secondary/20";
  return (
    <div className="space-y-6">
      {steps.map((step, i) => (
        <motion.div
          key={step.num}
          initial={{ opacity: 0, x: color === "primary" ? -20 : 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: i * 0.08 }}
          className="flex gap-5"
        >
          <div className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center text-xl font-bold shadow-lg ${bg}`}>
            {step.num}
          </div>
          <div className="pt-1.5">
            <h4 className="text-xl font-bold mb-1">{step.title}</h4>
            <p className="text-lg text-muted-foreground leading-relaxed">{step.desc}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default function HowItWorksPage() {
  return (
    <div className="w-full">
      {/* Hero */}
      <section className="bg-primary/5 py-20 border-b border-border/40">
        <div className="container mx-auto px-4 md:px-8 max-w-screen-xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <p className="text-primary font-semibold text-lg mb-3 uppercase tracking-wider">How It Works</p>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">Getting Started is Simple</h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              We have made the process as easy as possible so you can find the right match quickly and safely.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Steps — two columns */}
      <section id="how-it-works" className="py-20 lg:py-28 bg-background">
        <div className="container mx-auto px-4 md:px-8 max-w-screen-xl">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
            {/* For Hosts */}
            <div>
              <div className="flex items-center gap-4 mb-10">
                <div className="bg-primary/10 p-4 rounded-2xl">
                  <Home className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-primary uppercase tracking-wider">For Hosts</p>
                  <h2 className="text-3xl font-bold">I have a spare room</h2>
                </div>
              </div>
              <StepList steps={hostSteps} color="primary" />
              <div className="mt-10">
                <Link href="/signup">
                  <Button size="lg" className="text-lg rounded-full px-8 py-5 h-auto">Get Started as a Host</Button>
                </Link>
              </div>
            </div>

            {/* For Seekers */}
            <div>
              <div className="flex items-center gap-4 mb-10">
                <div className="bg-muted p-4 rounded-2xl">
                  <User className="h-8 w-8 text-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">For Seekers</p>
                  <h2 className="text-3xl font-bold">I need a room</h2>
                </div>
              </div>
              <StepList steps={seekerSteps} color="secondary" />
              <div className="mt-10">
                <Link href="/signup">
                  <Button size="lg" variant="outline" className="text-lg rounded-full px-8 py-5 h-auto bg-white">Find a Room</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Safety & Trust */}
      <section className="py-20 lg:py-28 bg-primary/5">
        <div className="container mx-auto px-4 md:px-8 max-w-screen-xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-5">Your Safety is Our Priority</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {safetyPoints.map((point, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <Card className="rounded-2xl border-border/50 shadow-sm h-full">
                  <CardContent className="p-8 flex gap-5">
                    <div className="bg-primary/10 p-3 rounded-xl h-fit shrink-0">{point.icon}</div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">{point.title}</h3>
                      <p className="text-lg text-muted-foreground leading-relaxed">{point.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 lg:py-28 bg-background">
        <div className="container mx-auto px-4 md:px-8 max-w-screen-xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-5">Frequently Asked Questions</h2>
          </div>
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border border-border/50 rounded-2xl px-6 shadow-sm">
                  <AccordionTrigger className="text-xl font-semibold py-6 hover:no-underline text-left">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-lg text-muted-foreground leading-relaxed pb-6">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 md:px-8 max-w-screen-xl text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-5">Ready to Get Started?</h2>
          <p className="text-xl opacity-90 mb-10 max-w-2xl mx-auto">
            Join thousands of older Australians who have found their perfect living arrangement through TribeSilverCircle.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="text-lg rounded-full px-10 py-5 h-auto bg-white text-primary hover:bg-white/90">
                Create Free Account
              </Button>
            </Link>
            <Link href="/about">
              <Button size="lg" variant="outline" className="text-lg rounded-full px-10 py-5 h-auto border-white/50 text-white hover:bg-white/10">
                Learn About Us
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
