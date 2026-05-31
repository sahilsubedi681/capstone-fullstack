import { Link } from "wouter"
import { Home } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="container mx-auto px-4 md:px-8 max-w-screen-xl">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <div className="bg-primary/20 text-primary p-2 rounded-xl">
                <Home className="h-6 w-6" />
              </div>
              <span className="text-2xl font-bold text-white">TribeSilverCircle</span>
            </Link>
            <p className="text-lg text-gray-400 max-w-sm mb-2">
              A warm, trusted community for older Australians aged 55 and above.
            </p>
            <p className="text-sm text-gray-500">Backed by an authorised Australian charity.</p>
          </div>

          <div>
            <h4 className="text-xl font-bold mb-6 text-white">Explore</h4>
            <ul className="space-y-4">
              <li><Link href="/" className="text-gray-400 hover:text-white transition-colors text-lg">Home</Link></li>
              <li><Link href="/how-it-works" className="text-gray-400 hover:text-white transition-colors text-lg">How it Works</Link></li>
              <li><Link href="/about" className="text-gray-400 hover:text-white transition-colors text-lg">About Us</Link></li>
              <li><Link href="/contact" className="text-gray-400 hover:text-white transition-colors text-lg">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xl font-bold mb-6 text-white">Support</h4>
            <ul className="space-y-4">
              <li><Link href="/contact" className="text-gray-400 hover:text-white transition-colors text-lg">Contact Us</Link></li>
              <li><Link href="/how-it-works" className="text-gray-400 hover:text-white transition-colors text-lg">FAQs</Link></li>
              <li><Link href="/about" className="text-gray-400 hover:text-white transition-colors text-lg">Privacy Policy</Link></li>
              <li><Link href="/about" className="text-gray-400 hover:text-white transition-colors text-lg">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 text-center text-gray-500">
          <p>&copy; {new Date().getFullYear()} TribeSilverCircle Ltd. All rights reserved. ABN managed by authorised Australian charity.</p>
        </div>
      </div>
    </footer>
  )
}