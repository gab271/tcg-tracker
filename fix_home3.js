const fs = require('fs');

const contentPath = 'src/components/home/HomeContent.tsx';
let content = fs.readFileSync(contentPath, 'utf8');

// Step 1: Your Vault in 3 Steps
const oldSteps = `[
              {
                title: "Add Your Cards",
                desc: "Quickly scan or search to build your digital binder in minutes.",
                icon: Layers
              },
              {
                title: "Track the Market",
                desc: "Watch real-time charts and get alerts when your cards spike in value.",
                icon: CandlestickChart
              },
              {
                title: "Buy & Sell",
                desc: "Trade securely with other verified collectors in our active marketplace.",
                icon: HandCoins
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
                <div className="w-20 h-20 rounded-full bg-[#D4A017]/10 flex items-center justify-center mb-6 text-[#D4A017]">
                  <step.icon size={40} strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl font-semibold mb-3">{step.title}</h3>
                <p className="text-gray-400 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))`;

const newSteps = `[
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
            ))`;

content = content.replace(oldSteps, newSteps);

// Step 2: Every Game. One Vault.
const oldGames = `[
              { name: "Pokémon TCG", count: "450K+" },
              { name: "Magic: The Gathering", count: "890K+" },
              { name: "One Piece TCG", count: "120K+" },
              { name: "Yu-Gi-Oh!", count: "340K+" }
            ].map((game, i) => (
              <motion.div
                key={game.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -5, boxShadow: "0 0 20px rgba(212, 160, 23, 0.3)" }}
                className="bg-[#121110] border border-white/5 hover:border-[#D4A017] rounded-2xl p-6 flex flex-col items-center justify-center gap-4 transition-all duration-300 group cursor-pointer"
              >
                <div className="w-20 h-20 rounded-xl bg-white/5 flex items-center justify-center text-[#D4A017]/50 font-mono text-sm group-hover:bg-[#D4A017]/10 transition-colors">
                  [Icon]
                </div>
                <h3 className="font-semibold text-lg">{game.name}</h3>
                <span className="bg-[#D4A017]/20 text-[#D4A017] text-xs font-bold px-3 py-1 rounded-full">
                  {game.count} Cards
                </span>
              </motion.div>
            ))`;

const newGames = `[
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
                whileHover={{ y: -5, boxShadow: \`0 0 20px \${game.color}60\`, borderColor: game.color }}
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
            ))`;

content = content.replace(oldGames, newGames);

// Step 3: Testimonials
const oldTestimonials = `[
              {
                user: "PkmnMaster_99",
                review: "Finally a portfolio tracker that actually understands condition and grading multipliers. My vintage collection has never looked better."
              },
              {
                user: "LotusSeeker",
                review: "The price alerts alone paid for my Pro sub in a week. Caught a spike on my dual lands and sold into the hype perfectly."
              },
              {
                user: "OP_PirateKing",
                review: "Cleanest UI on the market. Being able to scan Japanese cards directly into my vault is an absolute lifesaver."
              }
            ].map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                whileHover={{ y: -10 }}
                className="bg-white/5 border border-white/10 p-8 rounded-2xl relative"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-5 h-5 fill-[#D4A017] text-[#D4A017]" />
                  ))}
                </div>
                <p className="text-gray-300 mb-6 flex-grow leading-relaxed">
                  "{testimonial.review}"
                </p>
                <div className="flex items-center gap-4 mt-auto">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4A017] to-amber-900 border-2 border-[#D4A017]/50 flex items-center justify-center">
                    <span className="font-bold text-white text-lg">{testimonial.user.charAt(0)}</span>
                  </div>
                  <div className="font-semibold pb-1">{testimonial.user}</div>
                </div>
              </motion.div>
            ))`;

const newTestimonials = `[
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
            ))`;

content = content.replace(oldTestimonials, newTestimonials);

fs.writeFileSync(contentPath, content);
