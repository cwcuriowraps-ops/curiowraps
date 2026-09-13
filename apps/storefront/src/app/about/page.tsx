export const metadata = { title: "Our Story | Curio Wraps" };

export default function AboutPage() {
  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm font-medium tracking-[0.2em] text-accent uppercase mb-4">Our Story</p>
          <h1 className="text-5xl font-serif text-text-primary leading-tight">
            Curio Wrap is a labor of love.
          </h1>
        </div>
        
        <div className="aspect-[16/9] w-full rounded-2xl overflow-hidden bg-surface border border-border mb-16 relative flex items-center justify-center p-8 text-center shadow-sm">
          <div className="max-w-md">
            <span className="text-4xl block mb-3">✨ 🎀 🌸</span>
            <p className="font-serif text-2xl text-text-primary">Handcrafted with care</p>
            <p className="text-sm text-text-secondary font-light mt-2">Every creation is thoughtfully designed and crafted using high-quality materials.</p>
          </div>
        </div>

        <div className="prose prose-lg prose-pink mx-auto">
          <h2 className="text-3xl font-serif text-text-primary mb-6">How it started</h2>
          <p className="text-text-secondary font-light leading-relaxed mb-8">
            Curio Wrap began with a simple idea: that the most meaningful gifts are made by hand. We started by creating small, cute pipe cleaner flowers for friends and family, and soon realized how much joy these simple, handcrafted creations brought to people's lives.
          </p>

          <h2 className="text-3xl font-serif text-text-primary mb-6 mt-12">The Craft</h2>
          <p className="text-text-secondary font-light leading-relaxed mb-8">
            Every flower, bouquet, and plushie is meticulously twisted, shaped, and wrapped by hand using premium chenille stems. We take pride in the intricate details, ensuring that no two pieces are exactly alike. It's not just a product; it's a piece of art made to bring a smile to your face.
          </p>

          <blockquote className="border-l-4 border-accent pl-6 my-12 italic text-xl font-serif text-text-primary">
            "We believe in the power of cute things to brighten a dreary day."
          </blockquote>

          <h2 className="text-3xl font-serif text-text-primary mb-6 mt-12">Our Mission</h2>
          <p className="text-text-secondary font-light leading-relaxed mb-8">
            As a "Love Giver", our mission is to provide you with unique, elegant, and minimal gifts that help you express your love and appreciation for the people who matter most. Thank you for supporting our small handmade business.
          </p>
        </div>
      </div>
    </div>
  );
}