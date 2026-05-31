import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Phone, MapPin, Clock, CheckCircle2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay },
});

const contactInfo = [
  {
    icon: <Mail className="h-6 w-6 text-primary" />,
    label: "Email",
    value: "garry@tribesilvercircle.com.au",
    href: "mailto:garry@tribesilvercircle.com.au",
  },
  {
    icon: <Phone className="h-6 w-6 text-primary" />,
    label: "Phone",
    value: "+61 418 600 650",
    href: "tel:+61418600650",
  },
  {
    icon: <MapPin className="h-6 w-6 text-primary" />,
    label: "Location",
    value: "Redcliffe, Queensland, Australia",
    href: null,
  },
  {
    icon: <Clock className="h-6 w-6 text-primary" />,
    label: "Response Time",
    value: "We aim to respond within 1 business day",
    href: null,
  },
];

const topics = [
  "General Enquiry",
  "I am a Host: I have a spare room",
  "I am a Seeker: I need a room",
  "Technical Support",
  "Partnership or Charity Enquiry",
  "Media or Press",
  "Other",
];

export default function ContactPage() {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", topic: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSent(true);
      toast({ title: "Message sent!", description: "Garry will be in touch with you soon." });
    }, 1400);
  };

  return (
    <div className="w-full">
      {/* Hero */}
      <section className="bg-primary/5 py-20 border-b border-border/40">
        <div className="container mx-auto px-4 md:px-8 max-w-screen-xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            <p className="text-primary font-semibold uppercase tracking-wider mb-3">Get In Touch</p>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-5">Contact Us</h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Have a question, need support, or just want to say hello? We would love to hear from you.
            </p>
          </motion.div>
        </div>
      </section>
      {/* Main content */}
      <section className="py-20 lg:py-28 bg-background">
        <div className="container mx-auto px-4 md:px-8 max-w-screen-xl">
          <div className="grid lg:grid-cols-5 gap-14">

            {/* Left — contact info */}
            <div className="lg:col-span-2 space-y-6">
              <motion.div {...fadeUp(0)}>
                <h2 className="text-3xl font-bold mb-3">We're here to help</h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  TribeSilverCircle was built with real people in mind. If you have any questions about the platform, need a hand getting started, or just want to chat. Reach out any time.
                </p>
              </motion.div>

              <div className="space-y-4">
                {contactInfo.map((item, i) => (
                  <motion.div key={i} {...fadeUp(0.1 + i * 0.08)}>
                    <div className="flex gap-4 p-5 bg-primary/5 rounded-2xl border border-border/40">
                      <div className="bg-primary/10 p-3 rounded-xl h-fit shrink-0">
                        {item.icon}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">{item.label}</p>
                        {item.href ? (
                          <a href={item.href} className="text-lg font-medium text-foreground hover:text-primary transition-colors">
                            {item.value}
                          </a>
                        ) : (
                          <p className="text-lg font-medium text-foreground">{item.value}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Website */}
              <motion.div {...fadeUp(0.45)}>
                <div className="p-5 bg-primary rounded-2xl text-primary-foreground">
                  <p className="text-sm font-semibold uppercase tracking-wide opacity-80 mb-1">Website</p>
                  <a
                    href="https://www.tribe55.com.au"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xl font-bold hover:underline"
                  >
                    www.tribe55.com.au
                  </a>
                  <p className="text-sm opacity-70 mt-2">Our public-facing website for community updates.</p>
                </div>
              </motion.div>
            </div>

            {/* Right — form */}
            <motion.div className="lg:col-span-3" {...fadeUp(0.15)}>
              <Card className="rounded-2xl border-border/50 shadow-lg">
                <CardContent className="p-8 md:p-10">
                  {sent ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-10 space-y-5"
                    >
                      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="h-10 w-10 text-primary" />
                      </div>
                      <h3 className="text-2xl font-bold">Message Sent!</h3>
                      <p className="text-lg text-muted-foreground max-w-sm mx-auto">
                        Thank you, <strong>{form.name}</strong>. Garry will get back to you at <strong>{form.email}</strong> shortly.
                      </p>
                      <Button
                        variant="outline"
                        className="rounded-full px-8"
                        onClick={() => { setSent(false); setForm({ name: "", email: "", topic: "", message: "" }); }}
                      >
                        Send Another Message
                      </Button>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div>
                        <h3 className="text-2xl font-bold mb-1">Send a Message</h3>
                        <p className="text-muted-foreground">Fill in the form and we will get back to you promptly.</p>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label className="text-lg font-medium">Your Name <span className="text-destructive">*</span></Label>
                          <Input
                            className="h-13 text-base rounded-xl"
                            placeholder="E.g. Margaret Smith"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-lg font-medium">Your Email <span className="text-destructive">*</span></Label>
                          <Input
                            type="email"
                            className="h-13 text-base rounded-xl"
                            placeholder="your@email.com"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-lg font-medium">Topic</Label>
                        <Select value={form.topic} onValueChange={(val) => setForm({ ...form, topic: val })}>
                          <SelectTrigger className="h-13 text-base rounded-xl">
                            <SelectValue placeholder="What is your message about?" />
                          </SelectTrigger>
                          <SelectContent>
                            {topics.map((t) => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-lg font-medium">Your Message <span className="text-destructive">*</span></Label>
                        <Textarea
                          className="min-h-[150px] text-base resize-none rounded-xl"
                          placeholder="Tell us how we can help you..."
                          value={form.message}
                          onChange={(e) => setForm({ ...form, message: e.target.value })}
                          required
                        />
                      </div>

                      <Button
                        type="submit"
                        size="lg"
                        className="w-full h-14 text-lg rounded-xl shadow-lg shadow-primary/20"
                        disabled={sending}
                      >
                        {sending ? (
                          <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Sending your message...</>
                        ) : (
                          "Send Message"
                        )}
                      </Button>

                      <p className="text-sm text-muted-foreground text-center">
                        By submitting this form you agree to our{" "}
                        <a href="/privacy" className="underline hover:text-foreground">Privacy Policy</a>.
                        We never share your details with anyone.
                      </p>
                    </form>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Community CTA */}
      <section className="py-16 bg-primary/5 border-t border-border/40">
        <div className="container mx-auto px-4 md:px-8 max-w-screen-xl text-center">
          <motion.div {...fadeUp()}>
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Prefer to just get started?</h2>
            <p className="text-lg text-muted-foreground mb-8">Creating an account is free and takes less than two minutes.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/signup">
                <Button size="lg" className="rounded-full px-8 text-lg">Create Free Account</Button>
              </a>
              <a href="/how-it-works">
                <Button size="lg" variant="outline" className="rounded-full px-8 text-lg">See How It Works</Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
