'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Layers, CandlestickChart, HandCoins, Star, Check } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function HomeContent() {
  const statsRef = useRef<HTMLDivElement>(null);
  const countersRef = useRef<(HTMLSpanElement | null)[]>([]);
  const featuresRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    // Section 1: Stats Bar counter animation
    countersRef.current.forEach((el, index) => {
      if (!el) return;
      const targetStr = el.dataset.target || '0';
      const isFloat = targetStr.includes('.');
      const targetVal = parseFloat(targetStr);
      let obj = { val: 0 };
      
      gsap.to(obj, {
        val: targetVal,
        duration: 2.5,
        ease: 'power3.out',
        delay: index * 0.2,
        scrollTrigger: {
          trigger: statsRef.current,
          start: 'top 85%',
        },
        onUpdate: () => {
          if (isFloat) {
            el.innerHTML = obj.val.toFixed(1);
          } else {
            el.innerHTML = Math.round(obj.val).toLocaleString('en-US');
          }
        }
      });
    });

    // Section 3: Feature Blocks Slide-in
    featuresRef.current.forEach((feature, index) => {
      if (feature) {
        gsap.fromTo(feature,
          { 
            opacity: 0,
            x: index % 2 === 0 ? -100 : 100
          },
          {
            opacity: 1,
            x: 0,
            duration: 1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: feature,
              start: 'top 80%',
            }
          }
        );
      }
    });

  }, []);

  return (
    <div className="bg-[#0a0a0a] text-white overflow-hidden">
      {/* SECTION 1 - Animated Stats Bar */}
      <section 
        ref={statsRef}
        className="w-full border-t border-[#D4A017]/20 py-24 bg-[#0a0a0a] relative z-10"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-[#D4A017]/10">
            <div className="py-4">
              <div className="text-3xl md:text-5xl font-bold text-[#D4A017] mb-2 font-mono">
                <span ref={el => { countersRef.current[0] = el }} data-target="12400">0</span>+
              </div>
              <p className="text-gray-400 font-medium tracking-wide">Collectors</p>
            </div>
            
            <div className="py-4">
              <div className="text-3xl md:text-5xl font-bold text-[#D4A017] mb-2 font-mono">
                €<span ref={el => { countersRef.current[1] = el }} data-target="2.3">0</span>M
              </div>
              <p className="text-gray-400 font-medium tracking-wide">Tracked Value</p>
            </div>
            
            <div className="py-4">
              <div className="text-3xl md:text-5xl font-bold text-[#D4A017] mb-2 font-mono">
                <span ref={el => { countersRef.current[2] = el }} data-target="847">0</span>K+
              </div>
              <p className="text-gray-400 font-medium tracking-wide">Cards Registered</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 - How It Works */}
      <section className="py-24 bg-gradient-to-b from-[#0a0a0a] to-[#121110]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Your Vault in 3 Steps</h2>
            <div className="w-24 h-1 bg-[#D4A017] mx-auto rounded-full"></div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                title: "Add Your Cards",
                desc: "Quickly scan or search to build your digital binder in minutes.",
                imgUrl: "https://placehold.co/128x128/0a0a0a/D4A017.png?text=Vault+Door"
              },
              {
                title: "Track the Market",
                desc: "Watch real-time charts and get alerts when your cards spike in value.",
                imgUrl: "https://placehold.co/128x128/0a0a0a/D4A017.png?text=Chart"
              },
              {
                title: "Buy & Sell",
                desc: "Trade securely with other verified collectors in our active marketplace.",
                imgUrl: "https://placehold.co/128x128/0a0a0a/D4A017.png?text=Hands"
              }
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: i * 0.2 }}
                className="flex flex-col items-center text-center p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-[#D4A017]/50 transition-colors"
              >
                <motion.div 
                  whileHover={{ scale: 1.15, y: -5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  className="w-24 h-24 flex items-center justify-center mb-6"
                >
                  <img src={step.imgUrl} alt={step.title} className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(212,175,55,0.3)]" />
                </motion.div>
                <h3 className="text-2xl font-semibold mb-3">{step.title}</h3>
                <p className="text-gray-400 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3 - Features Showcase */}
      <section className="py-24 bg-[#0a0a0a] overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 space-y-32">
          
          {/* Block 1 */}
          <div ref={el => { featuresRef.current[0] = el }} className="flex flex-col md:flex-row items-center gap-16">
            <motion.div 
              whileHover={{ boxShadow: "0 0 30px rgba(212, 175, 55, 0.4)", borderColor: "rgba(212, 175, 55, 0.8)" }}
              className="w-full md:w-1/2 aspect-video rounded-3xl border border-[#D4A017]/20 flex items-center justify-center relative overflow-hidden shadow-[0_0_50px_rgba(212,160,23,0.1)] transition-colors duration-300"
            >
              <img src="https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?q=80&w=800&auto=format&fit=crop" alt="Feature Mockup" className="w-full h-full object-cover" />
            </motion.div>
            <div className="w-full md:w-1/2 space-y-6">
              <h3 className="text-3xl md:text-5xl font-bold">Museum-grade Display</h3>
              <p className="text-xl text-gray-400 leading-relaxed">
                Interact with your premium slabs and raw pulls in stunning detail. Our proprietary 3D rendering adds dynamic holographic shine to your rarest hits as you move your mouse.
              </p>
            </div>
          </div>

          {/* Block 2 */}
          <div ref={el => { featuresRef.current[1] = el }} className="flex flex-col-reverse md:flex-row items-center gap-16">
            <div className="w-full md:w-1/2 space-y-6">
              <h3 className="text-3xl md:text-5xl font-bold">Live Portfolio Dashboard</h3>
              <p className="text-xl text-gray-400 leading-relaxed">
                Treat your collection like an investment. View dynamic candlestick charts mapping out 30-day, 6-month, and 1-year historic value trends of your entire vault.
              </p>
            </div>
            <motion.div 
              whileHover={{ boxShadow: "0 0 30px rgba(212, 175, 55, 0.4)", borderColor: "rgba(212, 175, 55, 0.8)" }}
              className="w-full md:w-1/2 aspect-video rounded-3xl border border-[#D4A017]/20 flex items-center justify-center relative overflow-hidden shadow-[0_0_50px_rgba(212,160,23,0.1)] transition-colors duration-300"
            >
              <img src="https://images.unsplash.com/photo-1642790106117-e829e14a795f?q=80&w=800&auto=format&fit=crop" alt="Dashboard Mockup" className="w-full h-full object-cover" />
            </motion.div>
          </div>

          {/* Block 3 */}
          <div ref={el => { featuresRef.current[2] = el }} className="flex flex-col md:flex-row items-center gap-16">
            <motion.div 
              whileHover={{ boxShadow: "0 0 30px rgba(212, 175, 55, 0.4)", borderColor: "rgba(212, 175, 55, 0.8)" }}
              className="w-full md:w-1/2 aspect-video rounded-3xl border border-[#D4A017]/20 flex items-center justify-center relative overflow-hidden shadow-[0_0_50px_rgba(212,160,23,0.1)] transition-colors duration-300"
            >
              <img src="https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=800&auto=format&fit=crop" alt="Feature Mockup" className="w-full h-full object-cover" />
            </motion.div>
            <div className="w-full md:w-1/2 space-y-6">
              <h3 className="text-3xl md:text-5xl font-bold">Active Global Marketplace</h3>
              <p className="text-xl text-gray-400 leading-relaxed">
                Connect instantly with thousands of verified users. Negotiate trades, make offers, and secure grails with our escrow-backed transaction system.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 4 - Supported Games */}
      <section className="py-24 bg-[#0a0a0a] border-t border-[#D4A017]/10">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Every Game. One Vault.</h2>
            <div className="w-24 h-1 bg-[#D4A017] mx-auto rounded-full"></div>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: "Pokémon TCG", count: "450K+", color: "#EF4444", icon: "https://placehold.co/64x64/0a0a0a/EF4444.png?text=PKMN" },
              { name: "Magic: The Gathering", count: "890K+", color: "#3B82F6", icon: "https://placehold.co/64x64/0a0a0a/3B82F6.png?text=MTG" },
              { name: "One Piece TCG", count: "120K+", color: "#EAB308", icon: "https://placehold.co/64x64/0a0a0a/EAB308.png?text=OP" },
              { name: "Yu-Gi-Oh!", count: "340K+", color: "#8B5CF6", icon: "https://placehold.co/64x64/0a0a0a/8B5CF6.png?text=YGO" }
            ].map((game, i) => (
              <motion.div
                key={game.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -5, boxShadow: `0 0 20px ${game.color}60`, borderColor: game.color }}
                style={{ borderTopWidth: '2px', borderTopColor: game.color }}
                className="bg-[#121110] border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 transition-all duration-300 group cursor-pointer"
              >
                <div className="w-20 h-20 rounded-xl bg-white/5 flex items-center justify-center transition-colors overflow-hidden">
                  <img src={game.icon} alt={game.name} className="w-12 h-12 object-contain" />
                </div>
                <h3 className="font-semibold text-lg">{game.name}</h3>
                <span className="bg-[#D4A017]/20 text-[#D4A017] text-xs font-bold px-3 py-1 rounded-full">
                  {game.count} Cards
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5 - Testimonials */}
      <section className="py-24 bg-gradient-to-b from-[#0a0a0a] to-[#121110]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Collectors Trust TCG Tracker</h2>
            <div className="w-24 h-1 bg-[#D4A017] mx-auto rounded-full"></div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                user: "PkmnMaster_99",
                review: "Finally a portfolio tracker that actually understands condition and grading multipliers. My vintage collection has never looked better.",
                rotation: -1
              },
              {
                user: "LotusSeeker",
                review: "The price alerts alone paid for my Pro sub in a week. Caught a spike on my dual lands and sold into the hype perfectly.",
                rotation: 0
              },
              {
                user: "OP_PirateKing",
                review: "Cleanest UI on the market. Being able to scan Japanese cards directly into my vault is an absolute lifesaver.",
                rotation: 1
              }
            ].map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95, rotate: testimonial.rotation }}
                whileInView={{ opacity: 1, scale: 1, rotate: testimonial.rotation }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                whileHover={{ y: -10, rotate: 0 }}
                className="bg-white/5 border border-white/10 border-l-[3px] border-l-[#D4A017] p-8 rounded-2xl relative overflow-hidden flex flex-col"
              >
                <div className="absolute top-2 right-4 text-[#D4A017]/10 text-9xl font-serif leading-none italic pointer-events-none select-none">
                  "
                </div>
                <div className="flex items-center gap-1 mb-4 relative z-10">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-5 h-5 fill-[#D4A017] text-[#D4A017]" />
                  ))}
                </div>
                <p className="text-gray-300 mb-6 flex-grow leading-relaxed relative z-10">
                  "{testimonial.review}"
                </p>
                <div className="flex items-center gap-4 mt-auto relative z-10">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4A017] to-amber-900 border-2 border-[#D4A017]/50 flex items-center justify-center shrink-0">
                    <span className="font-bold text-white text-lg">{testimonial.user.charAt(0)}</span>
                  </div>
                  <div className="font-semibold pb-1">{testimonial.user}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 6 - Pricing */}
      <section className="py-24 bg-[#0a0a0a] border-y border-[#D4A017]/10">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Simple Pricing</h2>
            <div className="w-24 h-1 bg-[#D4A017] mx-auto rounded-full"></div>
          </motion.div>

          <div className="flex flex-col-reverse md:grid md:grid-cols-2 gap-8 items-center">
            {/* Free Tier */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-[#121110] border border-white/10 rounded-3xl p-8"
            >
              <h3 className="text-2xl font-bold mb-2">Basic</h3>
              <div className="text-3xl md:text-5xl font-bold mb-6">$0<span className="text-lg text-gray-500 font-normal">/month</span></div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3"><Check className="text-gray-400 w-5 h-5"/> <span className="text-gray-300">Up to 100 cards</span></li>
                <li className="flex items-center gap-3"><Check className="text-gray-400 w-5 h-5"/> <span className="text-gray-300">Basic portfolio tracking</span></li>
                <li className="flex items-center gap-3 opacity-50"><Check className="text-gray-600 w-5 h-5"/> <span className="text-gray-500 line-through">Real-time price alerts</span></li>
                <li className="flex items-center gap-3 opacity-50"><Check className="text-gray-600 w-5 h-5"/> <span className="text-gray-500 line-through">Export to CSV</span></li>
              </ul>
              <button className="w-full py-4 rounded-xl border border-white/20 font-semibold hover:bg-white/5 transition-colors">
                Get Started
              </button>
            </motion.div>

            {/* Pro Tier */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-b from-[#1a1710] to-[#121110] border-2 border-[#D4A017] rounded-3xl p-10 relative shadow-[0_0_30px_rgba(212,160,23,0.15)] transform md:scale-105"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#D4A017] text-[#0a0a0a] font-bold px-4 py-1 rounded-full text-sm tracking-wide">
                MOST POPULAR
              </div>
              <h3 className="text-2xl font-bold mb-2 text-[#D4A017]">Pro Vault</h3>
              <div className="text-3xl md:text-5xl font-bold mb-6">$4.99<span className="text-lg text-gray-400 font-normal">/month</span></div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3"><Check className="text-[#D4A017] w-5 h-5"/> <span className="text-gray-100">Unlimited cards</span></li>
                <li className="flex items-center gap-3"><Check className="text-[#D4A017] w-5 h-5"/> <span className="text-gray-100">Advanced analytics & tracking</span></li>
                <li className="flex items-center gap-3"><Check className="text-[#D4A017] w-5 h-5"/> <span className="text-gray-100">Real-time price alerts</span></li>
                <li className="flex items-center gap-3"><Check className="text-[#D4A017] w-5 h-5"/> <span className="text-gray-100">Export to CSV</span></li>
                <li className="flex items-center gap-3"><Check className="text-[#D4A017] w-5 h-5"/> <span className="text-gray-100">30-day price history charts</span></li>
              </ul>
              <button className="w-full py-4 rounded-xl bg-[#D4A017] text-[#0a0a0a] font-bold hover:bg-[#F2C84B] transition-colors shadow-[0_0_15px_rgba(212,160,23,0.4)] hover:shadow-[0_0_25px_rgba(212,160,23,0.6)]">
                Upgrade to Pro
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SECTION 7 - Final CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#0a0a0a]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#D4A017]/20 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-5xl lg:text-7xl font-bold mb-6 tracking-tight">
              Your Collection <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4A017] to-amber-300">Deserves a Vault</span>
            </h2>
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
              Join 12,400+ collectors tracking their cards, anticipating the market, and trading with confidence on TCG Tracker.
            </p>
            <button className="px-10 py-5 rounded-full bg-[#D4A017] text-[#0a0a0a] font-bold text-lg hover:bg-[#F2C84B] transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(212,160,23,0.3)] hover:shadow-[0_0_40px_rgba(212,160,23,0.5)]">
              Open Your Vault
            </button>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
